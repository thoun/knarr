<?php

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
   
    function argPlayAction() {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);

        $bracelets = $player->bracelet;
        $recruits = $player->recruit;

        $playedCardsByColor = [];
        $playedCardsColors = [];
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
            $playedCardsColors[$color] = count($playedCardsByColor[$color]);
        }

        $actionDone = boolval($this->getGameStateValue(ACTION_DONE));
        $tradeDone = boolval($this->getGameStateValue(TRADE_DONE));

        $possibleDestinations = [];
        if (!$actionDone) {
            $possibleDestinations = array_merge(
                $this->getDestinationsByLocation('slotA'),
                $this->getDestinationsByLocation('slotB'),
            );

            $possibleDestinations = array_values(array_filter($possibleDestinations, fn($destination) => $this->canTakeDestination($destination, $playedCardsColors, $recruits, false)));
        }

        return [
            'possibleDestinations' => $possibleDestinations,
            'canDoAction' => !$actionDone,
            'canTrade' => !$tradeDone && $bracelets > 0,
        ];
    }

    function argChooseNewCard() {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);

        $freeColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
        $centerCards = $this->getCardsByLocation('slot');

        return [
            'centerCards' => $centerCards,
            'freeColor' => $freeColor,
            'recruits' => $player->recruit,
        ];
    }

    function argPayDestination() {
        $playerId = intval($this->getActivePlayerId());

        $selectedDestination = $this->getDestinationFromDb($this->destinations->getCard(intval($this->getGameStateValue(SELECTED_DESTINATION))));

        return [
            'selectedDestination' => $selectedDestination,
            'recruits' => $this->getPlayer($playerId)->recruit,
        ];
    }

    function argTrade() {
        $playerId = intval($this->getActivePlayerId());

        $bracelets = $this->getPlayer($playerId)->bracelet;

        return [
            'bracelets' => $bracelets,
        ];
    }
} 
