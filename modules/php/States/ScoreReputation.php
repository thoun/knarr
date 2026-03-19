<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\Games\Knarr\Game;

class ScoreReputation extends \Bga\GameFramework\States\GameState
{

    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_SCORE_REPUTATION,
            type: StateType::GAME,
            description: clienttranslate('Scoring reputation points...'),
        );
    }

    public function onEnteringState(int $activePlayerId) {
        $player = $this->game->getPlayer($activePlayerId);

        $inc = 0;
        foreach ($this->game->VP_BY_REPUTATION as $min => $points) {
            if ($player->reputation >= $min) {
                $inc = $points;
            }
        }

        $this->game->incPlayerScore($activePlayerId, $inc, clienttranslate('${player_name} scores ${incScore} Victory Point(s) with reputation'));
        $this->bga->playerStats->inc('reputationPoints', $inc, $activePlayerId, updateTableStat: true);

        $this->game->setGameStateValue((string)COMPLETED_LINES, $this->game->vikingManager->getCompletedLines($activePlayerId));
        
        return ST_PLAYER_PLAY_ACTION;
    }
}
