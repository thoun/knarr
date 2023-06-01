<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stScoreReputation() {
        $playerId = intval($this->getActivePlayerId());

        $player = $this->getPlayer($playerId);

        $inc = 0;
        foreach ($this->VP_BY_REPUTATION as $min => $points) {
            if ($player->reputation >= $min) {
                $inc = $points;
            }
        }

        $this->incPlayerScore($playerId, $inc, clienttranslate('${player_name} scores ${incScore} Victory Point(s) with reputation'));
        $this->incStat($inc, 'reputationPoints');
        $this->incStat($inc, 'reputationPoints', $playerId);

        $this->setGameStateValue(COMPLETED_LINES, $this->getCompletedLines($playerId));
        
        $this->gamestate->nextState('next');
    }

    /*function stPlayAction() {
        $playerId = intval($this->getActivePlayerId());

        if ($this->getGlobalVariable(UNDO) == null) {
            $this->saveForUndo($playerId, false);
        }
    }*/

    function stDiscardCard() {
        $playersIds = $this->getPlayersIds();

        $max = -1;
        $maxPlayersIds = [];

        foreach ($playersIds as $playerId) {
            $playerCardCount = intval($this->getUniqueValueFromDB("SELECT count(*) FROM card WHERE card_location LIKE 'played$playerId%'"));
            if ($playerCardCount > $max) {
                $max = $playerCardCount;
                $maxPlayersIds = [$playerId];
            } else if ($playerCardCount == $max) {
                $maxPlayersIds[] = $playerId;
            }
        }

        $this->gamestate->setPlayersMultiactive($maxPlayersIds, 'next', true);
    }

    function stAfterDiscardCard() {
        $remainingCardsToTake = $this->getGlobalVariable(REMAINING_CARDS_TO_TAKE);
        $playerId = $remainingCardsToTake->playerId;

        if ($remainingCardsToTake->phase == 'recruit') {
            $this->deleteGlobalVariable(REMAINING_CARDS_TO_TAKE);
            $this->endOfRecruit($playerId, $remainingCardsToTake->slotColor);
        } else {
            $available = $this->getAvailableDeckCards();
            $effectiveGain = min($remainingCardsToTake->remaining, $available);
            for ($i = 0; $i < $effectiveGain; $i++) {
                $this->powerTakeCard($playerId);
            }
            if ($effectiveGain < $remainingCardsToTake->remaining) {
                $remainingCardsToTake->remaining = $remainingCardsToTake->remaining - $effectiveGain;
                $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, $remainingCardsToTake);
                $this->gamestate->nextState('discardCardsForDeck');
            } else {
                $this->deleteGlobalVariable(REMAINING_CARDS_TO_TAKE);
                if ($remainingCardsToTake->phase == 'explore') {
                    $this->incStat($effectiveGain, 'assetsCollectedByDestination5');
                    $this->incStat($effectiveGain, 'assetsCollectedByDestination5', $playerId);

                    $this->endExplore($playerId, $remainingCardsToTake->fromReserve, $remainingCardsToTake->destination, $remainingCardsToTake->destinationIndex);
                } else if ($remainingCardsToTake->phase == 'trade') {
                    $this->incStat($effectiveGain, 'assetsCollectedByTrade5');
                    $this->incStat($effectiveGain, 'assetsCollectedByTrade5', $playerId);

                    $this->endTrade($playerId);
                }
            }
        }
    }

    function stNextPlayer() {
        $playerId = intval($this->getActivePlayerId());

        //$this->deleteGlobalVariables([UNDO, POWER_PAY_ONE_LESS]);
        $this->setGameStateValue(RECRUIT_DONE, 0);
        $this->setGameStateValue(EXPLORE_DONE, 0);
        $this->setGameStateValue(TRADE_DONE, 0);
        $this->setGameStateValue(PLAYED_CARD_COLOR, 0);
        $this->setGameStateValue(GO_DISCARD_TABLE_CARD, 0);
        $this->setGameStateValue(GO_RESERVE, 0);

        if (!boolval($this->getGameStateValue(LAST_TURN)) && $this->getPlayer($playerId)->score >= 40) {
            $this->setGameStateValue(LAST_TURN, 1);

            self::notifyAllPlayers('lastTurn', clienttranslate('${player_name} reached 40 Victory Points, triggering the end of the game !'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);
        }

        $this->activeNextPlayer();
        $playerId = $this->getActivePlayerId();

        $this->giveExtraTime($playerId);

        $endGame = false;
        if ($this->getPlayer($playerId)->no == 1) {
            $this->incStat(1, 'roundNumber');
            if (boolval($this->getGameStateValue(LAST_TURN))) {
                $endGame = true;
            }
        }

        $this->gamestate->nextState($endGame ? 'endScore' : 'nextPlayer');
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();

        foreach($playersIds as $playerId) {
            $player = $this->getPlayer($playerId);
            //$scoreAux = $player->recruit + $player->bracelet;
            //$this->DbQuery("UPDATE player SET player_score_aux = player_recruit + player_bracelet WHERE player_id = $playerId");
        }
        $this->DbQuery("UPDATE player SET player_score_aux = player_recruit + player_bracelet");

        $this->gamestate->nextState('endGame');
    }
}
