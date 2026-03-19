<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\Actions\Types\IntArrayParam;
use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class PayDestination extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_PAY_DESTINATION,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must choose the cards to pay for the selected destination'),
            descriptionMyTurn: clienttranslate('${you} must choose the cards to pay for the selected destination'),
            transitions: [
                "next" => ST_PLAYER_PLAY_ACTION,
                "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
                "reserve" => ST_PLAYER_RESERVE_DESTINATION,
                "discardTableCard" => ST_PLAYER_DISCARD_TABLE_CARD,
                "endTurn" => ST_NEXT_PLAYER,
            ]
        );
    }   

    function getArgs(int $activePlayerId): array {
        $selectedDestination = $this->game->destinationManager->getDestination(intval($this->game->getGameStateValue((string)SELECTED_DESTINATION)));

        return [
            'selectedDestination' => $selectedDestination,
            'recruits' => $this->game->getPlayer($activePlayerId)->recruit,
        ];
    }

    #[PossibleAction]
    public function actPayDestination(#[IntArrayParam] array $ids, int $recruits, int $activePlayerId) {
        if ($recruits > 0 && $this->game->getPlayer($activePlayerId)->recruit < $recruits) {
            throw new UserException("Not enough recruits");
        }

        $destination = $this->game->destinationManager->getDestination($this->game->getGameStateValue((string)SELECTED_DESTINATION));
        $fromReserve = $destination->location == 'reserved';
        
        // will contain only selected cards of player
        $playedCardsByColor = [];
        $selectedPlayedCardsColors = [];
        $cardsToDiscard = [];
        if (count($ids) > 0) {
            $playedCardsByColor = $this->game->getPlayedCardsByColor($activePlayerId);
            foreach ([1,2,3,4,5] as $color) {
                $playedCardsByColor[$color] = array_values(array_filter($playedCardsByColor[$color], fn($card) => in_array($card->id, $ids)));
                $selectedPlayedCardsColors[$color] = count($playedCardsByColor[$color]);
                $cardsToDiscard = array_merge($cardsToDiscard, $playedCardsByColor[$color]);
            }
        }

        $valid = $this->game->canTakeDestination($destination, $selectedPlayedCardsColors, $recruits, true);
        if (!$valid) {
            throw new UserException("Invalid payment for this destination");
        }

        if ($recruits > 0) {
            $this->game->incPlayerRecruit($activePlayerId, -$recruits, clienttranslate('${player_name} pays ${number} recruit(s) for the selected destination'), [
                'number' => $recruits, // for logs
            ]);
            $this->bga->playerStats->inc('recruitsUsedToPayDestination', $recruits, $activePlayerId, updateTableStat: true);
        }

        if (count($cardsToDiscard)) {
            $this->game->vikingManager->cards->moveCards(array_map(fn($card) => $card->id, $cardsToDiscard), 'discard');

            $this->bga->notify->all('discardCards', clienttranslate('${player_name} discards ${number} cards(s) for the selected destination'), [
                'playerId' => $activePlayerId,
                'player_name' => $this->game->getPlayerName($activePlayerId),
                'cards' => $cardsToDiscard,
                'number' => count($cardsToDiscard), // for logs
                'cardDiscardCount' => $this->game->vikingManager->getCardDiscardCount(),
            ]);
        }

        $destinationIndex = intval($this->game->destinationManager->destinations->countCardInLocation('played'.$activePlayerId));
        $this->game->destinationManager->destinations->moveCard($destination->id, 'played'.$activePlayerId, $destinationIndex);

        $effectiveGains = $this->game->gainResources($activePlayerId, $destination->immediateGains, 'explore');
        $type = $destination->type == 2 ? 'B' : 'A';

        $this->bga->notify->all('takeDestination', clienttranslate('${player_name} takes a destination from line ${line_letter} and gains ${gains}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'destination' => $destination,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'line_letter' => $type, // for logs
        ]);
                    
        $this->bga->playerStats->inc('discoveredDestinations', 1, $activePlayerId, updateTableStat: true);
        $this->bga->playerStats->inc('discoveredDestinations'.$destination->type, 1, $activePlayerId, updateTableStat: true);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->bga->playerStats->inc('assetsCollectedByDestination', $allGains, $activePlayerId, updateTableStat: true);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->bga->playerStats->inc('assetsCollectedByDestination'.$type, $count, $activePlayerId, updateTableStat: true);
            }
        }

        $remainingCardsToTake = $this->game->getGlobalVariable(REMAINING_CARDS_TO_TAKE);
        if ($remainingCardsToTake != null) {
            $remainingCardsToTake->fromReserve = $fromReserve;
            $remainingCardsToTake->destination = $destination;
            $remainingCardsToTake->destinationIndex = $destinationIndex;
            $this->game->setGlobalVariable(REMAINING_CARDS_TO_TAKE, $remainingCardsToTake);

            return ST_MULTIPLAYER_DISCARD_CARD;
        } else {
            $this->game->endExplore($activePlayerId, $fromReserve, $destination, $destinationIndex);
        }
    }

    #[PossibleAction]
    public function actCancel() {
        return PlayAction::class;
    }

    function zombie(int $playerId) {
        return $this->actCancel();
    }
}
