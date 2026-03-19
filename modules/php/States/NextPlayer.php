<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\Games\Knarr\Game;

class NextPlayer extends \Bga\GameFramework\States\GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_NEXT_PLAYER,
            type: StateType::GAME,
            updateGameProgression: true,
        );
    }

    function onEnteringState() {
        $this->game->raidManager->triggerRaid();

        //$this->deleteGlobalVariables([UNDO, POWER_PAY_ONE_LESS]);
        $this->game->setGameStateValue((string)RECRUIT_DONE, 0);
        $this->game->setGameStateValue((string)EXPLORE_DONE, 0);
        $this->game->setGameStateValue((string)TRADE_DONE, 0);
        $this->game->setGameStateValue((string)PLAYED_CARD_COLOR, 0);
        $this->game->setGameStateValue((string)GO_DISCARD_TABLE_CARD, 0);
        $this->game->setGameStateValue((string)GO_RESERVE, 0);

        $this->game->activeNextPlayer();
        $playerId = (int)$this->game->getActivePlayerId();

        $this->game->giveExtraTime($playerId);

        $endGame = false;
        if ($this->game->getPlayer($playerId)->no == 1) {
            $this->bga->tableStats->inc('roundNumber', 1);
            if (boolval($this->game->getGameStateValue((string)LAST_TURN))) {
                $endGame = true;
            }
        }

        return $endGame ? EndScore::class : ST_SCORE_REPUTATION;
    }
}