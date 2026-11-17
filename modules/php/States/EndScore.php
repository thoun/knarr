<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\Games\Knarr\Game;

const ST_END_GAME = 99;

class EndScore extends \Bga\GameFramework\States\GameState
{

    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_END_SCORE,
            type: StateType::GAME,
        );
    }

    public function onEnteringState() {
        $tieBreakers = $this->game->getCollectionFromDB("SELECT player_id, player_recruit + player_bracelet AS tie_breaker FROM player", true);
        foreach ($tieBreakers as $playerId => $tieBreaker) {
            $this->bga->playerScoreAux->set((int) $playerId, (int) $tieBreaker, null);
        }

        return ST_END_GAME;
    }
}
