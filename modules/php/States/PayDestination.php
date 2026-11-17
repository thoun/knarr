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

        $destination = $this->game->destinationManager->getDestination((int)$this->game->getGameStateValue((string)SELECTED_DESTINATION));
        $fromReserve = $destination->location == 'reserved';
        
        // will contain only selected cards of player
        $playedCardsByColor = [];
        $selectedPlayedCardsColors = array_fill_keys([1, 2, 3, 4, 5], 0);
        $cardsToDiscard = [];
        if (count($ids) > 0) {
            $playedCardsByColor = $this->game->vikingManager->getPlayedCardsByColor($activePlayerId);
            foreach ([1,2,3,4,5] as $color) {
                $playedCardsByColor[$color] = array_values(array_filter($playedCardsByColor[$color], fn($card) => in_array($card->id, $ids)));
                $selectedPlayedCardsColors[$color] = count($playedCardsByColor[$color]);
                $cardsToDiscard = array_merge($cardsToDiscard, $playedCardsByColor[$color]);
            }
        }

        $valid = $this->game->destinationManager->canTakeDestination($destination, $selectedPlayedCardsColors, $recruits, true);
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

        [$effectiveGains, $raidTokens] = $this->game->gainResources($activePlayerId, $destination->immediateGains, 'explore');
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

        $allGains = array_sum($effectiveGains);
        $this->bga->playerStats->inc('assetsCollectedByDestination', $allGains, $activePlayerId, updateTableStat: true);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->bga->playerStats->inc('assetsCollectedByDestination'.$type, $count, $activePlayerId, updateTableStat: true);
            }
        }

        if ($this->game->isSkaliExpansion()) {
            $this->game->buildingManager->onExporeLand($activePlayerId, $destination->type);
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

    function zombie(int $playerId, array $args) {
        $destination = $args['selectedDestination'];
        $cardsByColor = $this->game->vikingManager->getPlayedCardsByColor($playerId);
        $colors = [1, 2, 3, 4, 5];
        $limits = [];
        if (isset($destination->cost[EQUAL])) {
            foreach ($colors as $color) {
                $limits[] = [$color => $destination->cost[EQUAL]];
            }
        } elseif (isset($destination->cost[DIFFERENT])) {
            $limits[] = array_fill_keys($colors, 1);
        } else {
            $limits[] = $destination->cost;
        }

        $payments = [];
        foreach ($limits as $limit) {
            $selections = [[]];
            foreach ($colors as $color) {
                $nextSelections = [];
                foreach ($selections as $selection) {
                    for ($count = 0; $count <= min($limit[$color] ?? 0, count($cardsByColor[$color])); $count++) {
                        $nextSelections[] = $selection + [$color => $count];
                    }
                }
                $selections = $nextSelections;
            }
            foreach ($selections as $selection) {
                if (isset($destination->cost[DIFFERENT]) && array_sum($selection) > $destination->cost[DIFFERENT]) {
                    continue;
                }
                for ($recruits = 0; $recruits <= $args['recruits']; $recruits++) {
                    if ($this->game->destinationManager->canTakeDestination($destination, $selection, $recruits, true)) {
                        $payments[] = ['counts' => $selection, 'recruits' => $recruits];
                    }
                }
            }
        }
        if ($payments === []) {
            return $this->actCancel();
        }

        $payment = $this->getRandomZombieChoice($payments);
        $ids = [];
        foreach ($payment['counts'] as $color => $count) {
            $cards = array_values($cardsByColor[$color]);
            for ($i = 0; $i < $count; $i++) {
                $card = $this->getRandomZombieChoice($cards);
                $ids[] = $card->id;
                $cards = array_values(array_filter($cards, fn($other) => $other->id !== $card->id));
            }
        }
        return $this->actPayDestination($ids, $payment['recruits'], $playerId);
    }
}
