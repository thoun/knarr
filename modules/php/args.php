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

        $handColors = [
            RED => 0,
            YELLOW => 0,
            GREEN => 0,
            BLUE => 0,
            PURPLE => 0,
        ];
        foreach ([1,2,3,4,5] as $color) {
            $handColors[$color] = count($this->getCardsByLocation('played'.$playerId.'-'.$color));
        }

        $actionDone = boolval($this->getGameStateValue(ACTION_DONE));
        $tradeDone = boolval($this->getGameStateValue(TRADE_DONE));

        $possibleDestinations = [];
        if (!$actionDone) {
            $possibleDestinations = array_merge(
                $this->getDestinationsByLocation('slotA'),
                $this->getDestinationsByLocation('slotB'),
            );

            $possibleDestinations = array_values(array_filter($possibleDestinations, fn($destination) => $this->canTakeDestination($destination, $handColors, $recruits)));
        }

        return [
            'possibleDestinations' => $possibleDestinations,
            'canDoAction' => !$actionDone,
            'canTrade' => !$tradeDone && $bracelets > 0,
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
