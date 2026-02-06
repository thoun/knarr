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
        $this->game->DbQuery("UPDATE player SET player_score_aux = player_recruit + player_bracelet");

        return ST_END_GAME;
    }
}