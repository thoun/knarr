<?php

if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

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

        if (boolval($this->getGameStateValue(RECRUIT_DONE))) {
            throw new BgaUserException("Invalid action");
        }

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
        $effectiveGains = $this->gainResources($playerId, $groupGains, 'recruit');

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

        $argChooseNewCard = $this->argChooseNewCard();
        if ($argChooseNewCard['allFree']) {
            self::notifyAllPlayers('log', clienttranslate('${player_name} can recruit any viking for free thanks to ${artifact_name} effect'), [
                'player_name' => $this->getPlayerName($playerId),
                'artifact_name' => $this->getArtifactName(ARTIFACT_CAULDRON), // for logs
                'i18n' => ['artifact_name'],
            ]);
        }

        $this->incStat(1, 'playedCards');
        $this->incStat(1, 'playedCards', $playerId);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->incStat($allGains, 'assetsCollectedByPlayedCards');
        $this->incStat($allGains, 'assetsCollectedByPlayedCards', $playerId);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->incStat($count, 'assetsCollectedByPlayedCards'.$type);
                $this->incStat($count, 'assetsCollectedByPlayedCards'.$type, $playerId);
            }
        }

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

        if ($slotColor != $args['freeColor'] && !$args['allFree']) {
            if ($args['recruits'] < 1) {
                throw new BgaUserException("Not enough recruits");
            } else {
                $this->incPlayerRecruit($playerId, -1, clienttranslate('${player_name} pays a recruit to choose the new card'), []);
        
                $this->incStat(1, 'recruitsUsedToChooseCard');
                $this->incStat(1, 'recruitsUsedToChooseCard', $playerId);
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

        if ($this->getAvailableDeckCards() >= 1) {
            $this->endOfRecruit($playerId, $slotColor);
        } else {
            $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, [
                'playerId' => $playerId,
                'slotColor' => $slotColor,
                'phase' => 'recruit',
                'remaining' => 1,
            ]);
            $this->gamestate->nextState('discardCardsForDeck');
        }
    }

    public function endOfRecruit(int $playerId, int $slotColor) {
        $newTableCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotColor));
        $newTableCard->location = 'slot';
        $newTableCard->locationArg = $slotColor;

        self::notifyAllPlayers('newTableCard', '', [
            'card' => $newTableCard,
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')) + 1, // to count the new card
        ]);

        $this->setGameStateValue(RECRUIT_DONE, 1);
        $this->setGameStateValue(EXPLORE_DONE, 1);

        $this->redirectAfterAction($playerId, true);
    }

    public function takeDestination(int $id) {
        self::checkAction('takeDestination');

        if (boolval($this->getGameStateValue(EXPLORE_DONE))) {
            throw new BgaUserException("Invalid action");
        }

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
        $fromReserve = $destination->location == 'reserved';
        
        // will contain only selected cards of player
        $playedCardsByColor = [];
        $selectedPlayedCardsColors = [];
        $cardsToDiscard = [];
        if (count($ids) > 0) {
            $playedCardsByColor = $this->getPlayedCardsByColor($playerId);
            foreach ([1,2,3,4,5] as $color) {
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
            $this->incStat($recruits, 'recruitsUsedToPayDestination');
            $this->incStat($recruits, 'recruitsUsedToPayDestination', $playerId);
        }

        if (count($cardsToDiscard)) {
            $this->cards->moveCards(array_map(fn($card) => $card->id, $cardsToDiscard), 'discard');

            self::notifyAllPlayers('discardCards', clienttranslate('${player_name} discards ${number} cards(s) for the selected destination'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'cards' => $cardsToDiscard,
                'number' => $recruits, // for logs
                'cardDiscardCount' => intval($this->cards->countCardInLocation('discard')),
            ]);
        }

        $destinationIndex = intval($this->destinations->countCardInLocation('played'.$playerId));
        $this->destinations->moveCard($destination->id, 'played'.$playerId, $destinationIndex);

        $effectiveGains = $this->gainResources($playerId, $destination->immediateGains, 'explore');
        $type = $destination->type == 2 ? 'B' : 'A';

        self::notifyAllPlayers('takeDestination', clienttranslate('${player_name} takes a destination from line ${letter} and gains ${gains}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'destination' => $destination,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'letter' => $type, // for logs
        ]);
                    
        $this->incStat(1, 'discoveredDestinations');
        $this->incStat(1, 'discoveredDestinations', $playerId);
        $this->incStat(1, 'discoveredDestinations'.$destination->type);
        $this->incStat(1, 'discoveredDestinations'.$destination->type, $playerId);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->incStat($allGains, 'assetsCollectedByDestination');
        $this->incStat($allGains, 'assetsCollectedByDestination', $playerId);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->incStat($count, 'assetsCollectedByDestination'.$type);
                $this->incStat($count, 'assetsCollectedByDestination'.$type, $playerId);
            }
        }

        $remainingCardsToTake = $this->getGlobalVariable(REMAINING_CARDS_TO_TAKE);
        if ($remainingCardsToTake != null) {
            $remainingCardsToTake->fromReserve = $fromReserve;
            $remainingCardsToTake->destination = $destination;
            $remainingCardsToTake->destinationIndex = $destinationIndex;
            $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, $remainingCardsToTake);

            $this->gamestate->nextState('discardCardsForDeck');
        } else {
            $this->endExplore($playerId, $fromReserve, $destination, $destinationIndex);
        }
    }

    public function endExplore(int $playerId, bool $fromReserve, object $destination, int $destinationIndex) {
        if (!$fromReserve) {
            $type = $destination->type == 2 ? 'B' : 'A';
            $newDestination = $this->getDestinationFromDb($this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $destination->locationArg));
            $newDestination->location = 'slot'.$type;
            $newDestination->locationArg = $destination->locationArg;

            self::notifyAllPlayers('newTableDestination', '', [
                'destination' => $newDestination,
                'letter' => $type,
                'destinationDeckTop' => Destination::onlyId($this->getDestinationFromDb($this->destinations->getCardOnTop('deck'.$type))),
                'destinationDeckCount' => intval($this->destinations->countCardInLocation('deck'.$type)),
            ]);
        }

        $this->setGameStateValue(RECRUIT_DONE, 1);
        $this->setGameStateValue(EXPLORE_DONE, 1);

        if ($this->getVariantOption() >= 2) {
            $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];
            if (in_array(ARTIFACT_HELMET, $artifacts) && $destinationIndex > 0 && $destination->type == 2) {
                $previousDestination = $this->getDestinationsByLocation('played'.$playerId)[$destinationIndex - 1];
                if ($previousDestination->type == 1) {
                    $this->setGameStateValue(RECRUIT_DONE, 0);
                    self::notifyAllPlayers('log', clienttranslate('${player_name} can do the recruit action thanks to ${artifact_name} effect'), [
                        'player_name' => $this->getPlayerName($playerId),
                        'artifact_name' => $this->getArtifactName(ARTIFACT_HELMET), // for logs
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->incStat(1, 'activatedArtifacts');
                    $this->incStat(1, 'activatedArtifacts', $playerId);
                }
            }

            if (in_array(ARTIFACT_ARTIFACT_MEAD_CUP_CUP, $artifacts)) {
                $this->setGameStateValue(GO_DISCARD_TABLE_CARD, 1);

                $this->incStat(1, 'activatedArtifacts');
                $this->incStat(1, 'activatedArtifacts', $playerId);
            }
        }

        $this->redirectAfterAction($playerId, true);
    }

    public function reserveDestination(int $id) {
        self::checkAction('reserveDestination');

        $playerId = intval($this->getActivePlayerId());

        $destination = $this->getDestinationFromDb($this->destinations->getCard($id));

        if ($destination == null || !in_array($destination->location, ['slotA', 'slotB'])) {
            throw new BgaUserException("You can't reserve this destination");
        }

        $this->destinations->moveCard($destination->id, 'reserved', $playerId);
        $type = $destination->type == 2 ? 'B' : 'A';

        self::notifyAllPlayers('reserveDestination', clienttranslate('${player_name} takes a destination from line ${letter}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'destination' => $destination,
            'letter' => $type, // for logs
        ]);

        $newDestination = $this->getDestinationFromDb($this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $destination->locationArg));
        $newDestination->location = 'slot'.$type;
        $newDestination->locationArg = $destination->locationArg;

        self::notifyAllPlayers('newTableDestination', '', [
            'destination' => $newDestination,
            'letter' => $type,
            'destinationDeckTop' => Destination::onlyId($this->getDestinationFromDb($this->destinations->getCardOnTop('deck'.$type))),
            'destinationDeckCount' => intval($this->destinations->countCardInLocation('deck'.$type)),
        ]);

        $this->gamestate->nextState('next');
    }

    public function discardTableCard(int $id) {
        self::checkAction('discardTableCard');

        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));

        if ($card == null || $card->location != 'slot') {
            throw new BgaUserException("You can't discard this card");
        }
        $slotColor = $card->locationArg;
        
        $this->cards->moveCard($card->id, 'discard');

        self::notifyAllPlayers('discardTableCard', clienttranslate('${player_name} discards ${card_color} ${card_type} card from the table (${color} column)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'color' => $this->getColorName($slotColor), // for logs
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

        $newTableCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotColor));
        $newTableCard->location = 'slot';
        $newTableCard->locationArg = $slotColor;

        self::notifyAllPlayers('newTableCard', '', [
            'card' => $newTableCard,
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')) + 1, // to count the new card
        ]);

        $this->redirectAfterAction($playerId, true);
    }

    public function pass() {
        self::checkAction('pass');

        $playerId = intval($this->getActivePlayerId());

        $this->redirectAfterAction($playerId, true);
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

        $gains = $this->getTradeGains($playerId, $number);
        $groupGains = $this->groupGains($gains);
        $effectiveGains = $this->gainResources($playerId, $groupGains, 'trade');

        self::notifyAllPlayers('trade', clienttranslate('${player_name} gains ${gains} with traded bracelet(s)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
        ]);

        $this->incStat(1, 'tradeActions');
        $this->incStat(1, 'tradeActions', $playerId);
        $this->incStat(1, 'tradeActions'.$number);
        $this->incStat(1, 'tradeActions'.$number, $playerId);
        $this->incStat($number, 'braceletsUsed');
        $this->incStat($number, 'braceletsUsed', $playerId);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->incStat($allGains, 'assetsCollectedByTrade');
        $this->incStat($allGains, 'assetsCollectedByTrade', $playerId);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->incStat($count, 'assetsCollectedByTrade'.$type);
                $this->incStat($count, 'assetsCollectedByTrade'.$type, $playerId);
            }
        }

        if ($this->getGlobalVariable(REMAINING_CARDS_TO_TAKE) != null) {
            $this->gamestate->nextState('discardCardsForDeck');
        } else {
            $this->endTrade($playerId);
        }
    }

    public function endTrade(int $playerId) {
        $this->setGameStateValue(TRADE_DONE, 1);
        $this->redirectAfterAction($playerId, false);
    }

    public function cancel() {
        self::checkAction('cancel');

        $this->gamestate->nextState('cancel');
    }

    public function endTurn() {
        self::checkAction('endTurn');

        $this->gamestate->nextState('endTurn');
    }

    public function discardCard(int $id) {
        self::checkAction('discardCard');

        $playerId = intval($this->getCurrentPlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));

        if ($card == null || !str_starts_with($card->location, "played$playerId")) {
            throw new BgaUserException("You must choose a card in front of you");
        }

        $this->cards->moveCard($card->id, 'discard');

        self::notifyAllPlayers('discardCards', clienttranslate('${player_name} discards a cards to refill the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'cards' => [$card],
            'cardDiscardCount' => intval($this->cards->countCardInLocation('discard')),
        ]);

        $this->incStat(1, 'discardedCards');
        $this->incStat(1, 'discardedCards', $playerId);

        $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
    }
}
