<?php

namespace Bga\Games\Knarr;

use Bga\GameFramework\Components\Deck;
use Building;
use BuildingType;

require_once(__DIR__.'/constants.inc.php');
require_once(__DIR__.'/objects/building.php');

class BuildingManager {
    public Deck $buildings;
    public array $BUILDINGS;
    private \Bga\GameFramework\Bga $bga;

    public function __construct(private Game $game) {
        $this->bga = $game->bga;
        $this->buildings = $this->game->deckFactory->createDeck('building');
        $this->buildings->autoreshuffle = false;

        $this->BUILDINGS = [
            1 => new BuildingType([COIN => 2], [[VP => -1], [REPUTATION => 1], null, null]),
            2 => new BuildingType([COIN => 1], [null, null, null, [REPUTATION => 1]]),
            3 => new BuildingType([COIN => 3], [null, null, [REPUTATION => 1], null]),
            4 => new BuildingType([COIN => 2], [[REPUTATION => 1], null, null, null], mostRaid: [VP => 2]),
            5 => new BuildingType([COIN => 1], [null, [VP => 1], null, null], mostRaid: [REPUTATION => 1]),
            6 => new BuildingType([COIN => 1], [[VP => 1], [VP => 1], null, null], fewestRaid: [VP => -1]),
            7 => new BuildingType([COIN => 1], [null, [VP => -1], null, [VP => 2]], fewestRaid: [VP => -1]),
            8 => new BuildingType([COIN => 1], [[VP => -1], null, [VP => 1], null]),
            9 => new BuildingType([COIN => 3], [[VP => 1], [VP => 1], [VP => 1], [VP => 1]], mostRaid: [VP => 1]),
            10 => new BuildingType([COIN => 2], [null, null, null, [VP => 1]], mostRaid: [VP => 2]),
            11 => new BuildingType([COIN => 1], [null, null, [VP => 1], [VP => 1]], fewestRaid: [VP => -1]),
            12 => new BuildingType([COIN => 2], [null, null, [VP => 1], null], mostRaid: [VP => 2]),
            13 => new BuildingType([COIN => 3], [[RAID => 1], null, null, null], mostRaid: [VP => 2]),
            14 => new BuildingType([COIN => 3], [null, [RAID => 1],  null, null], mostRaid: [VP => 1]),
            15 => new BuildingType([COIN => 3], [null, null, [RAID => 1], null], mostRaid: [VP => 1]),
            16 => new BuildingType([COIN => 2], [null, [CARD => 1], null, null]),
            17 => new BuildingType([COIN => 2], [[CARD => 1], null, null, null]),
            18 => new BuildingType([COIN => 3], [null, [CARD => 1], null, [RAID => 1]], mostRaid: [VP => 1]),
            19 => new BuildingType([COIN => 3], [null, null, [CARD => 1] ,null], mostRaid: [VP => 1]),
            20 => new BuildingType([COIN => 3], [[RAID => 1], null, null, [CARD => 1]]),
            21 => new BuildingType([COIN => 2], [[VP => -1], null, [RECRUIT => 1], null]),
            22 => new BuildingType([COIN => 1], [[VP => 1], null, null, null], mostRaid: [RECRUIT => 1]),
            23 => new BuildingType([COIN => 2], [null, [VP => 1], [VP => 1], null], mostRaid: [RECRUIT => 1]),
            24 => new BuildingType([COIN => 1], [null, null, null, [RECRUIT => 1]], fewestRaid: [VP => -1]),
            25 => new BuildingType([COIN => 2], [null, [RECRUIT => 1], null, null]),
            26 => new BuildingType([COIN => 3], [[BRACELET => 1], null, null, [RAID => 1]]),
            27 => new BuildingType([COIN => 2], [[VP => -1], null, [BRACELET => 1], null]),
            28 => new BuildingType([COIN => 1], [[VP => 1], null, null, null], mostRaid: [BRACELET => 1]),
            29 => new BuildingType([COIN => 2], [[BRACELET => 1], null, null, null]),
            30 => new BuildingType([COIN => 2], [null, null, null, [BRACELET => 1]]),
            31 => new BuildingType([COIN => 1], [null, [VP => -1], [COIN => 1], null]),
            32 => new BuildingType([COIN => 1], [[VP => -1], null, null, [COIN => 1]]),
            33 => new BuildingType([COIN => 1], [[COIN => 1], null, null, null], mostRaid: [COIN => 1]),
            34 => new BuildingType([COIN => 2], [null, null, [VP => 1], null], mostRaid: [COIN => 2]),
            35 => new BuildingType([COIN => 2], [null, [COIN => 1], null, null], mostRaid: [VP => 1]),
        ];
    }

    private function getBuildingFromDb(?array $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Building($dbCard, $this->BUILDINGS);
    }

    public function getBuilding(int $id) {
        return $this->getBuildingFromDb($this->buildings->getCard($id));
    }

    public function getBuildingsByLocation(string $location, ?int $location_arg = null, ?int $number = null) {
        $sql = "SELECT * FROM `building` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->game->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getBuildingFromDb($dbCard), array_values($dbResults));
    }

    public function getBuildingDeckTop() {
        return Building::onlyId($this->getBuildingFromDb($this->buildings->getCardOnTop('deck')));
    }

    public function getBuildingDeckCount(): int {
        return intval($this->buildings->countCardInLocation('deck'));
    }

    public function pickBuildingToSlot(int $slot) {
        $building = $this->getBuildingFromDb($this->buildings->pickCardForLocation('deck', 'slot', $slot));
        if ($building !== null) {
            $building->location = 'slot';
            $building->locationArg = $slot;
        }
        return $building;
    }

    public function setupBuildings(): void {
        $cards = [];
        foreach ($this->BUILDINGS as $number => $destinationType) {
            $cards[] = ['type' => 1, 'type_arg' => $number, 'nbr' => 1];
        }
        $this->buildings->createCards($cards, 'deck');
        $this->buildings->shuffle('deck');

        foreach ([1, 2, 3, 4] as $slot) {
            $this->buildings->pickCardForLocation('deck', 'slot', $slot);
        }
    }

    public function getMostRaidGains(int $playerId): array {
        $buildings = $this->getBuildingsByLocation('played'.$playerId);

        $gains = [];
        $rows = array_merge(
            [[VP => 2]],
            array_map(fn($building) => $building->mostRaid, $buildings),
        );
        foreach ($rows as $row) {
            if ($row !== null) {
                $gains[] = $row;
            }
        }

        return $gains;
    }

    public function getFewestRaidGains(int $playerId): array {
        $buildings = $this->getBuildingsByLocation('played'.$playerId);

        $gains = [];
        $rows = array_merge(
            [[VP => -1]],
            array_map(fn($building) => $building->fewestRaid, $buildings),
        );
        foreach ($rows as $row) {
            if ($row !== null) {
                $gains[] = $row;
            }
        }

        return $gains;
    }

    function getRowGains(int $playerId, int $row, array $extraGain) {
        $buildings = $this->getBuildingsByLocation('played'.$playerId);

        $gains = [];
        $rows = array_merge(
            [$extraGain],
            array_map(fn($building) => $building->gains[$row], $buildings),
        );
        foreach ($rows as $row) {
            if ($row !== null) {
                $gains[] = $row;
            }
        }

        return $gains;
    }

    private function applyRowGain(int $playerId, int $row, array $extraGain) {
        $gains = $this->getRowGains($playerId, $row, $extraGain); 

        $groupGains = [];

        foreach ($gains as $gain => $quantity) {
            if (array_key_exists($gain, $groupGains)) {
                $groupGains[$gain] += $quantity;
            } else {
                $groupGains[$gain] = $quantity;
            }
        }
        
        $effectiveGains = $this->game->gainResources($playerId, $groupGains, 'trade');

        $this->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with the village'), [
            'playerId' => $playerId,
            'player_name' => $this->game->getPlayerName($playerId),
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
        ]);

        $this->bga->playerStats->inc('buildingActions', 1, $playerId, updateTableStat: true);
        $this->bga->playerStats->inc('buildingActions'.$row, 1, $playerId, updateTableStat: true);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->bga->playerStats->inc('assetsCollectedByBuilding', $allGains, $playerId, updateTableStat: true);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->bga->playerStats->inc('assetsCollectedByBuilding'.$type, $count, $playerId, updateTableStat: true);
            }
        }
    }

    public function onExporeLand(int $playerId, int $type) {
        $row = $type === 2 ? 0 : 1;
        $this->applyRowGain(
            $playerId, 
            $row,
            [RAID => 1]
        );
    }
    public function onRecruitViking(int $playerId, bool $uniqueOfThisColor) {
        $row = $uniqueOfThisColor ? 3 : 2;

        if ($row === 3 && $this->game->getPlayerCount() === 2) {
            $this->game->playerRenewal->set($playerId, 1);
        }

        $this->applyRowGain(
            $playerId, 
            $row,
            $row === 3 ? [COIN => 1] : [],
        );
    }

    public function onRaidTriggered(array $playerIdsWithMostRaidTokens, array $playerIdsWithFewestRaidTokens) {
        $gainPerPlayer = [];
        foreach($playerIdsWithMostRaidTokens as $playerId) {
            $gainPerPlayer[$playerId] = $this->getMostRaidGains($playerId);
        }
        foreach($playerIdsWithFewestRaidTokens as $playerId) {
            $gainPerPlayer[$playerId] = array_merge($gainPerPlayer[$playerId] ?? [], $this->getFewestRaidGains($playerId));
        }

        foreach ($gainPerPlayer as $playerId => $gains) {
            $groupGains = $this->game->groupGains($gains);
            $effectiveGains = $this->game->gainResources($playerId, $groupGains, 'trade');

            $this->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with the raid'), [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerName($playerId),
                'effectiveGains' => $effectiveGains,
                'gains' => $effectiveGains, // for logs
            ]);

            $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
            $this->bga->playerStats->inc('assetsCollectedByRaid', $allGains, $playerId, updateTableStat: true);
            foreach ($effectiveGains as $type => $count) {
                if ($count > 0) {
                    $this->bga->playerStats->inc('assetsCollectedByRaid'.$type, $count, $playerId, updateTableStat: true);
                }
            }
        }
    }

}
