<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stScoreFame() {
        $playerId = intval($this->getActivePlayerId());

        $player = $this->getPlayer($playerId);

        $inc = 0;
        foreach ($this->VP_BY_FAME as $min => $points) {
            if ($player->fame >= $min) {
                $inc = $points;
            }
        }

        $this->incPlayerScore($playerId, $inc, clienttranslate('${player_name} scores ${incScore} with fame'));
        
        $this->gamestate->nextState('next');
    }

    function stPlayAction() {
        $playerId = intval($this->getActivePlayerId());

        /*if (count($this->getCardsByLocation('hand', $playerId)) == 0) {
            $this->gamestate->nextState('next');
        } else {*/
            /*if ($this->getGlobalVariable(UNDO) == null) {
                $this->saveForUndo($playerId, false);
            }*/
        /*}*/
    }

    function stNextPlayer() {
        //$playerId = intval($this->getActivePlayerId());

        //$this->deleteGlobalVariables([UNDO, POWER_PAY_ONE_LESS]);
        $this->setGameStateValue(ACTION_DONE, 0);
        $this->setGameStateValue(TRADE_DONE, 0);

        $this->activeNextPlayer();       
        $playerId = $this->getActivePlayerId();

        $this->giveExtraTime($playerId);

        $endGame = false;
        /* TODO check if first player if ($this->getPlayer($playerId)->chief == intval($this->getUniqueValueFromDB("SELECT min(player_chief) FROM player"))) {
            $this->incStat(1, 'roundNumber');
            if (boolval($this->getGameStateValue(LAST_TURN))) {
                $endGame = true;
            }
        }*/

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
