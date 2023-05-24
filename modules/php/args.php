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

        $playedCardsColors = $this->getPlayedCardsColor($playerId);

        $recruitDone = boolval($this->getGameStateValue(RECRUIT_DONE));
        $exploreDone = boolval($this->getGameStateValue(EXPLORE_DONE));
        $tradeDone = boolval($this->getGameStateValue(TRADE_DONE));

        $possibleDestinations = [];
        if (!$exploreDone) {
            $possibleDestinations = array_merge(
                $this->getDestinationsByLocation('slotA'),
                $this->getDestinationsByLocation('slotB'),
                $this->getDestinationsByLocation('reserved', $playerId),
            );

            $possibleDestinations = array_values(array_filter($possibleDestinations, fn($destination) => $this->canTakeDestination($destination, $playedCardsColors, $recruits, false)));
        }

        return [
            'possibleDestinations' => $possibleDestinations,
            'canRecruit' => !$recruitDone,
            'canExplore' => !$exploreDone,
            'canTrade' => !$tradeDone && $bracelets > 0,
        ];
    }

    function argChooseNewCard() {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);

        $freeColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
        $centerCards = $this->getCardsByLocation('slot');

        $allFree = false;
        if ($this->getVariantOption() >= 2) {
            $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];
            if (in_array(ARTIFACT_CAULDRON, $artifacts)) {
                $playedCardColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->getPlayedCardsColor($playerId);
                    $allFree = $playedCardsColors[$playedCardColor] == 2;
                }
            }
        }

        return [
            'centerCards' => $centerCards,
            'freeColor' => $freeColor,
            'recruits' => $player->recruit,
            'allFree' => $allFree,
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
        $gainsByBracelets = [];
        for ($i = 1; $i <= 3; $i++) {
            $gainsByBracelets[$i] = count($this->getTradeGains($playerId, $i));
        }

        return [
            'bracelets' => $bracelets,
            'gainsByBracelets' => $gainsByBracelets,
        ];
    }
} 
