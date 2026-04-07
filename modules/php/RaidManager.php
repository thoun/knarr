<?php

namespace Bga\Games\Knarr;

use Bga\GameFramework\Components\Deck;
use Raid;
use RaidType;

require_once(__DIR__.'/constants.inc.php');
require_once(__DIR__.'/objects/raid.php');

class RaidManager {
    public Deck $raids;
    private \Bga\GameFramework\Bga $bga;

    public function __construct(private Game $game) {
        $this->bga = $game->bga;
        $this->raids = $this->game->deckFactory->createDeck('raid');
        $this->raids->autoreshuffle = false;
    }

    private function getRaidFromDb(?array $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Raid($dbCard);
    }

    public function getRaid(int $id) {
        return $this->getRaidFromDb($this->raids->getCard($id));
    }

    public function getRaidsByLocation(string $location, ?int $location_arg = null, ?int $number = null) {
        $sql = "SELECT * FROM `raid` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->game->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getRaidFromDb($dbCard), array_values($dbResults));
    }

    public function setupRaids(array $playerIds): void {
        $cards = [
            ['type' => 1, 'type_arg' => 1, 'nbr' => count($playerIds) * 2 + 2],
        ];

        if (count($cards) === 0) {
            return;
        }

        $this->raids->createCards($cards, 'deck');
        $this->raids->pickCardsForLocation(count($playerIds) + 1, 'deck', 'board');

        foreach ($playerIds as $playerId) {
            $this->raids->pickCardForLocation('deck', 'player', $playerId);
        }
    }

    public function triggerRaid(): void {
        if (intval($this->raids->countCardInLocation('board')) > 0) {
            return; // no raid triggered if there is raid tokens on the board
        }
        $this->bga->notify->all('log', clienttranslate('There are no raid tokens on the board, a raid is triggered!'));

        $playerIds = $this->game->getPlayersIds();
        $raidTokenCounts = array_fill_keys($playerIds, 0);
        foreach ($this->getRaidsByLocation('player') as $raidToken) {
            $raidTokenCounts[$raidToken->locationArg]++;
        }

        $maxRaidTokens = max($raidTokenCounts);
        $minRaidTokens = min($raidTokenCounts);
        $playerIdsWithMostRaidTokens = [];
        $playerIdsWithFewestRaidTokens = [];
        foreach ($raidTokenCounts as $playerId => $raidTokenCount) {
            if ($raidTokenCount === $maxRaidTokens) {
                $playerIdsWithMostRaidTokens[] = $playerId;
            }
            if ($raidTokenCount === $minRaidTokens) {
                $playerIdsWithFewestRaidTokens[] = $playerId;
            }
        }

        $this->game->buildingManager->onRaidTriggered($playerIdsWithMostRaidTokens, $playerIdsWithFewestRaidTokens);

        $otherPlayers = array_diff($playerIds, $playerIdsWithMostRaidTokens, $playerIdsWithFewestRaidTokens);

        // special rule for 2 players (with no tie)
        if (count($playerIds) === 2 && count($playerIdsWithFewestRaidTokens) === 1) {
            $otherPlayers = $playerIdsWithFewestRaidTokens;
        }

        $movedTokens = [];
        $deckRaidToken = $this->getDeck()[0] ?? null;
        foreach ($playerIdsWithMostRaidTokens as $playerId) {
            $raidTokens = $this->getPlayer($playerId);
            if ($deckRaidToken === null) {
                $deckRaidToken = array_pop($raidTokens);
                $this->raids->moveCard($deckRaidToken->id, 'deck');
                $deckRaidToken->location = 'deck';
                $movedTokens[] = $deckRaidToken;
            }
            $this->raids->moveCards(array_map(fn($token) => $token->id, $raidTokens), 'board');
            foreach ($raidTokens as $raidToken) {
                $raidToken->location = 'board';
                $movedTokens[] = $raidToken;
            }
        }

        foreach ($otherPlayers as $otherPlayerId) {
            $raidToken = $this->getPlayer($otherPlayerId)[0] ?? null;
            if ($raidToken !== null) {
                $this->raids->moveCard($raidToken->id, 'board');
                $raidToken->location = 'board';
                $movedTokens[] = $raidToken;
            }
        }

        $this->bga->notify->all('resetRaidTokens', clienttranslate('Raid tokens are set back to the board'), ['raidTokens' => $movedTokens]);
    }

    public function gainRaidTokens(int $playerId, int $count): array {
        if ($count <= 0) {
            return [];
        }

        $boardCount = min($count, intval($this->raids->countCardInLocation('board')));
        if ($boardCount > 0) {
            $tokens = $this->raids->pickCardsForLocation($boardCount, 'board', 'player', $playerId);
        }

        $remainingCount = $count - $boardCount;
        if ($remainingCount > 0) {
            $tokens = array_merge($tokens, $this->raids->pickCardsForLocation($remainingCount, 'deck', 'player', $playerId));
        }

        return $tokens;
    }

    public function returnRaidTokens(int $playerId) {
        $raidTokens = $this->raids->getCardsInLocation('player', $playerId);
        if (count($raidTokens) === 0) {
            return;
        }

        if (intval($this->raids->countCardInLocation('deck')) === 0) {
            $firstRaidToken = reset($raidTokens);
            $this->raids->moveCard($firstRaidToken['id'], 'deck');
            unset($raidTokens[key($raidTokens)]);
        }

        if (count($raidTokens) > 0) {
            $this->raids->moveCards(array_map(fn($raidToken) => $raidToken['id'], $raidTokens), 'board');
        }
    }

    public function getAvailableRaidTokens(): int {
        return intval($this->raids->countCardInLocation('board')) + intval($this->raids->countCardInLocation('deck'));
    }

    public function getPlayer(int $playerId): array {
        return $this->getRaidsByLocation('player', $playerId);
    }

    public function getBoard(): array {
        return $this->getRaidsByLocation('board');
    }

    public function getDeck(): array {
        return $this->getRaidsByLocation('deck');
    }
}
