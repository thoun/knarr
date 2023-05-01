<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stPlayCard() {
        $playerId = intval($this->getActivePlayerId());

        /*if (count($this->getCardsByLocation('hand', $playerId)) == 0) {
            $this->gamestate->nextState('next');
        } else {*/
            if ($this->getGlobalVariable(UNDO) == null) {
                $this->saveForUndo($playerId, false);
            }
        /*}*/
    }
    function stNextPlayer() {
        //$playerId = intval($this->getActivePlayerId());

        $this->deleteGlobalVariables([UNDO, POWER_PAY_ONE_LESS]);

        $this->activeNextPlayer();       
        $playerId = $this->getActivePlayerId();

        $this->giveExtraTime($playerId);

        $endGame = false;
        if ($this->getPlayer($playerId)->chief == intval($this->getUniqueValueFromDB("SELECT min(player_chief) FROM player"))) {
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
            $playedCards = $this->getPlayedCardWithStoredResources($playerId);
            foreach ($playedCards as $card) {
                $score = $this->getCardScore($card, $playedCards);
                $this->incStat($score, 'pointCards'.$card->cardType);
                $this->incStat($score, 'pointCards'.$card->cardType, $playerId);
            }

            $scoreAux = count($this->getTokensByLocation('player', $playerId));
            $this->DbQuery("UPDATE player SET player_score_aux = $scoreAux WHERE player_id = $playerId");
        }

        $this->gamestate->nextState('endGame');
    }
}
