<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function goTrade() {
        self::checkAction('goTrade');

        $this->gamestate->nextState('trade');
    }

    public function playCard(int $id) {
        self::checkAction('playCard');

        $playerId = intval($this->getActivePlayerId());

        $hand = $this->getCardsByLocation('hand', $playerId);
        $card = $this->array_find($hand, fn($c) => $c->id == $id);

        if ($card == null || $card->location != 'hand' || $card->locationArg != $playerId) {
            throw new BgaUserException("You can't play this card");
        }

        $this->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->destinations->countCardInLocation('played'.$playerId.'-'.$card->color)));

        $cardsOfColor = $this->getCardsByLocation('played'.$playerId.'-'.$card->color);
        $gains = array_map(fn($card) => $card->gain, $cardsOfColor);
        $groupGains = $this->groupGains($gains);
        $effectiveGains = $this->gainResources($playerId, $groupGains);

        self::notifyAllPlayers('playCard', clienttranslate('${player_name} plays a ${card_color} ${card_type} card from their hand and gains ${gains}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

        $this->setGameStateValue(PLAYED_CARD_COLOR, $card->color);

        $this->gamestate->nextState('chooseNewCard');
    }

    public function chooseNewCard(int $id) {
        self::checkAction('chooseNewCard');

        $playerId = intval($this->getActivePlayerId());

        $args = $this->argChooseNewCard();
        $card = $this->array_find($args['centerCards'], fn($card) => $card->id == $id);

        if ($card == null || $card->location != 'slot') {
            throw new BgaUserException("You can't play this card");
        }
        $slotColor = $card->locationArg;

        if ($slotColor != $args['freeColor']) {
            if ($args['recruits'] < 1) {
                throw new BgaUserException("Not enough recruits");
            } else {
                $this->incPlayerRecruit($playerId, -1, clienttranslate('${player_name} pays a recruit to choose the new card'), []);
            }
        }
        
        $this->cards->moveCard($card->id, 'hand', $playerId);

        self::notifyAllPlayers('takeCard', clienttranslate('${player_name} takes the ${card_color} ${card_type} card from the table (${color} column)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'color' => $this->getColorName($slotColor), // for logs
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

        // TODO handle case both deck & discards are empty
        $newTableCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotColor));
        $newTableCard->location = 'slot';
        $newTableCard->locationArg = $slotColor;

        self::notifyAllPlayers('newTableCard', '', [
            'card' => $newTableCard,
        ]);

        $this->setGameStateValue(ACTION_DONE, 1);
        $this->redirectAfterAction();
    }

    public function takeDestination(int $id) {
        self::checkAction('takeDestination');

        $args = $this->argPlayAction();
        $destination = $this->array_find($args['possibleDestinations'], fn($c) => $c->id == $id);

        if ($destination == null) {
            throw new BgaUserException("You can't take this destination");
        }

        $this->setGameStateValue(SELECTED_DESTINATION, $id);

        $this->gamestate->nextState('payDestination');
    }

    public function payDestination(array $ids, int $recruits) {
        self::checkAction('payDestination');

        $playerId = intval($this->getActivePlayerId());
        
        if ($recruits > 0 && $this->getPlayer($playerId)->recruit < $recruits) {
            throw new BgaUserException("Not enough recruits");
        }

        $destination = $this->getDestinationFromDb($this->destinations->getCard($this->getGameStateValue(SELECTED_DESTINATION)));
        
        // will contain only selected cards of player
        $playedCardsByColor = [];
        $selectedPlayedCardsColors = [];
        $cardsToDiscard = [];
        if (count($ids) > 0) {
            foreach ([1,2,3,4,5] as $color) {
                $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
                $playedCardsByColor[$color] = array_values(array_filter($playedCardsByColor[$color], fn($card) => in_array($card->id, $ids)));
                $selectedPlayedCardsColors[$color] = count($playedCardsByColor[$color]);
                $cardsToDiscard = array_merge($cardsToDiscard, $playedCardsByColor[$color]);
            }
        }

        $valid = $this->canTakeDestination($destination, $selectedPlayedCardsColors, $recruits, true);
        if (!$valid) {
            throw new BgaUserException("Invalid payment for this destination");
        }

        if ($recruits > 0) {
            $this->incPlayerRecruit($playerId, -$recruits, clienttranslate('${player_name} pays ${number} recruit(s) for the selected destination'), [
                'number' => $recruits, // for logs
            ]);
        }

        if (count($cardsToDiscard)) {
            $this->cards->moveCards(array_map(fn($card) => $card->id, $cardsToDiscard), 'discard');

            self::notifyAllPlayers('discardCards', clienttranslate('${player_name} discards ${number} cards(s) for the selected destination'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'cards' => $cardsToDiscard,
                'number' => $recruits, // for logs
            ]);
        }

        $this->destinations->moveCard($destination->id, 'played'.$playerId, intval($this->destinations->countCardInLocation('played'.$playerId)));

        $effectiveGains = $this->gainResources($playerId, $destination->immediateGains);
        $type = $destination->number > 20 ? 'B' : 'A';

        self::notifyAllPlayers('takeDestination', clienttranslate('${player_name} takes a destination from line ${letter} and gains ${gains}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'destination' => $destination,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'letter' => $type, // for logs
        ]);

        $newDestination = $this->getDestinationFromDb($this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $destination->locationArg));
        $newDestination->location = 'slot'.$type;
        $newDestination->locationArg = $destination->locationArg;

        self::notifyAllPlayers('newTableDestination', '', [
            'destination' => $newDestination,
            'letter' => $type,
        ]);

        $this->setGameStateValue(ACTION_DONE, 1);
        $this->redirectAfterAction();
    }

    public function trade(int $number) {
        self::checkAction('trade');

        $playerId = intval($this->getActivePlayerId());

        if ($this->getPlayer($playerId)->bracelet < $number) {
            throw new BgaUserException("Not enough bracelets");
        }

        $this->incPlayerBracelet($playerId, -$number, clienttranslate('${player_name} chooses to pay ${number} bracelet(s) to trade'), [
            'number' => $number, // for logs
        ]);

        $destinations = $this->getDestinationsByLocation('played'.$playerId);

        $gains = [];

        $rows = array_merge(
            [$this->getBoatGain()],
            array_map(fn($destination) => $destination->gains, $destinations),
        );
        foreach ($rows as $row) {
            for ($i = 0; $i < $number; $i++) {
                if ($row[$i] !== null) {
                    $gains[] = $row[$i];
                }
            }
        }
        $groupGains = $this->groupGains($gains);
        $effectiveGains = $this->gainResources($playerId, $groupGains);

        self::notifyAllPlayers('trade', clienttranslate('${player_name} gains ${gains} with traded bracelet(s)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
        ]);

        $this->setGameStateValue(TRADE_DONE, 1);
        $this->redirectAfterAction();
    }

    public function cancel() {
        self::checkAction('cancel');

        $this->gamestate->nextState('cancel');
    }

    public function endTurn() {
        self::checkAction('endTurn');

        $this->gamestate->nextState('endTurn');
    }
}
