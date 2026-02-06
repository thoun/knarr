<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\Games\Knarr\Game;

class AfterDiscardCard extends \Bga\GameFramework\States\GameState
{

    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_AFTER_DISCARD_CARD,
            type: StateType::GAME,
            transitions: [
                "next" => ST_PLAYER_PLAY_ACTION,
                "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
                "reserve" => ST_PLAYER_RESERVE_DESTINATION,
                "discardTableCard" => ST_PLAYER_DISCARD_TABLE_CARD,
                "endTurn" => NextPlayer::class,
            ],
        );
    }

    public function onEnteringState() {
        $remainingCardsToTake = $this->game->getGlobalVariable(REMAINING_CARDS_TO_TAKE);
        $playerId = $remainingCardsToTake->playerId;

        if ($remainingCardsToTake->phase == 'recruit') {
            $this->game->deleteGlobalVariable(REMAINING_CARDS_TO_TAKE);
            $this->game->endOfRecruit($playerId, $remainingCardsToTake->slotColor);
        } else {
            $available = $this->game->getAvailableDeckCards();
            $effectiveGain = min($remainingCardsToTake->remaining, $available);
            for ($i = 0; $i < $effectiveGain; $i++) {
                $this->game->powerTakeCard($playerId);
            }
            if ($effectiveGain < $remainingCardsToTake->remaining) {
                $remainingCardsToTake->remaining = $remainingCardsToTake->remaining - $effectiveGain;
                $this->game->setGlobalVariable(REMAINING_CARDS_TO_TAKE, $remainingCardsToTake);
                $this->gamestate->nextState('discardCardsForDeck');
            } else {
                $this->game->deleteGlobalVariable(REMAINING_CARDS_TO_TAKE);
                if ($remainingCardsToTake->phase == 'explore') {
                    $this->bga->playerStats->inc('assetsCollectedByDestination5', $effectiveGain, $playerId, updateTableStat: true);

                    $this->game->endExplore($playerId, $remainingCardsToTake->fromReserve, $remainingCardsToTake->destination, $remainingCardsToTake->destinationIndex);
                } else if ($remainingCardsToTake->phase == 'trade') {
                    $this->bga->playerStats->inc('assetsCollectedByTrade5', $effectiveGain, $playerId, updateTableStat: true);

                    $this->game->endTrade($playerId);
                }
            }
        }
    }
}
