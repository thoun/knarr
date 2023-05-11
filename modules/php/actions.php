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

        $this->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->destinations->countCardInLocation('played'.$playerId.'-'.$card->color)) - 1);
        // TODO notif play card
        
        $slotId = $this->COLOR_TO_SLOT_ID[$card->color];
        $newHandCard = $this->getCardsByLocation('slot', $slotId);
        $this->cards->moveCard($newHandCard->id, 'hand', $playerId);
        // TODO grab new card to hand (color of played card)

        $cardsOfColor = $this->getCardsByLocation('played'.$playerId.'-'.$card->color);
        // TODO gain of color cards of played card

        // TODO refill cards
        $newTableCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotId));
        // TODO notif refill card

        $this->setGameStateValue(ACTION_DONE, 1);
        $this->redirectAfterAction();
    }

    public function takeDestination(int $id) {
        self::checkAction('takeDestination');

        $playerId = intval($this->getActivePlayerId());

        $args = $this->argPlayAction();
        $destination = $this->array_find($args['possibleDestinations'], fn($c) => $c->id == $id);

        if ($destination == null) {
            throw new BgaUserException("You can't take this destination");
        }

        $this->destinations->moveCard($destination->id, 'played'.$playerId, intval($this->destinations->countCardInLocation('played'.$playerId)) - 1);
        // TODO notif take destination

        // TODO pay cost

        // TODO immediate gain

        $type = $destination->number > 20 ? 'B' : 'A';
        $newDestination = $this->getDestinationFromDb($this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $destination->locationArg));
        // TODO notif refill destinations

        $this->setGameStateValue(ACTION_DONE, 1);
        $this->redirectAfterAction();
    }

    public function trade(int $number) {
        self::checkAction('trade');

        $playerId = intval($this->getActivePlayerId());

        if ($this->getPlayer($playerId)->bracelet < $number) {
            throw new BgaUserException("Not enough bracelets");
        }

        // pay bracelets

        // gain destination & boats for $number rows

        $this->setGameStateValue(TRADE_DONE, 1);
        $this->redirectAfterAction();
    }

    /*public function endTurn() {
        self::checkAction('endTurn');
        $playerId = intval($this->getActivePlayerId());

        $this->confirmStoreTokens($playerId);

        $args = $this->argDiscardTokens();
        $max = $args['number'];
        $tokens = $this->getDestinationsByLocation('player', $playerId);

        $discard = true;
        if (count($tokens) <= $max) {
            self::notifyAllPlayers('discardTokens', '', [
                'playerId' => $playerId,
                'keptTokens' => $tokens,
                'discardedTokens' => [],
            ]);

            $discard = false;
        }

        $this->gamestate->nextState($discard ? 'endTurnDiscard' : 'endTurn');
    }*/

    public function cancel() {
        self::checkAction('cancel');

        $this->gamestate->nextState('cancel');
    }

    public function endTurn() {
        self::checkAction('endTurn');

        $this->gamestate->nextState('endTurn');
    }
}
