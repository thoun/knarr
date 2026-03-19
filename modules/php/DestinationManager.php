<?php

namespace Bga\Games\Knarr;

use Bga\GameFramework\Components\Deck;
use Destination;
use DestinationType;

require_once(__DIR__.'/constants.inc.php');
require_once(__DIR__.'/objects/destination.php');

class DestinationManager {
    public Deck $destinations;
    public array $DESTINATIONS;

    public function __construct(private Game $game) {
        $this->destinations = $this->game->deckFactory->createDeck('destination');
        $this->destinations->autoreshuffle = false;

        $this->DESTINATIONS = [
            // A
            1 => new DestinationType([DIFFERENT => 3], [RECRUIT => 1, REPUTATION => 1, CARD => 1], [null, VP, null]),
            2 => new DestinationType([DIFFERENT => 3], [BRACELET => 1, REPUTATION => 1, CARD => 1], [null, VP, null]),
            3 => new DestinationType([DIFFERENT => 3], [BRACELET => 1, RECRUIT => 1, CARD => 1], [null, VP, null]),
            4 => new DestinationType([DIFFERENT => 3], [BRACELET => 1], [VP, REPUTATION, RECRUIT]),
            5 => new DestinationType([DIFFERENT => 3], [BRACELET => 1], [VP, REPUTATION, RECRUIT]),
            6 => new DestinationType([PURPLE => 2], [BRACELET => 1, CARD => 1], [null, VP, CARD]),
            7 => new DestinationType([PURPLE => 2], [CARD => 1], [CARD, null, VP]),
            8 => new DestinationType([PURPLE => 2], [CARD => 1], [VP, CARD, null]),
            9 => new DestinationType([BLUE => 2], [REPUTATION => 2], [null, VP, REPUTATION]),
            10 => new DestinationType([BLUE => 2], [RECRUIT => 1, REPUTATION => 1], [REPUTATION, null, VP]),
            11 => new DestinationType([BLUE => 2], [BRACELET => 1, REPUTATION => 1], [null, REPUTATION, VP]),
            12 => new DestinationType([GREEN => 2], [BRACELET => 1, RECRUIT => 1], [VP, null, RECRUIT]),
            13 => new DestinationType([GREEN => 2], [RECRUIT => 1], [RECRUIT, VP, null]),
            14 => new DestinationType([GREEN => 2], [RECRUIT => 2], [null, RECRUIT, null]),
            15 => new DestinationType([YELLOW => 2], [], [VP, VP, VP]),
            16 => new DestinationType([YELLOW => 2], [REPUTATION => 1], [VP, VP, null]),
            17 => new DestinationType([YELLOW => 2], [RECRUIT => 1], [VP, VP, null]),
            18 => new DestinationType([RED => 2], [BRACELET => 1, CARD => 1], [VP, null, VP]),
            19 => new DestinationType([RED => 2], [BRACELET => 1, REPUTATION => 1], [VP, null, VP]),
            20 => new DestinationType([RED => 2], [BRACELET => 1], [VP, VP, null]),
            // B
            21 => new DestinationType([EQUAL => 4], [VP => 5, RECRUIT => 1], [null, null, VP]),
            22 => new DestinationType([EQUAL => 4], [VP => 5, REPUTATION => 1], [null, null, VP]),
            23 => new DestinationType([EQUAL => 4], [VP => 5, BRACELET => 1], [null, null, VP]),
            24 => new DestinationType([RED => 1, YELLOW => 1, GREEN => 1, BLUE => 1, PURPLE => 1], [VP => 4, BRACELET => 1, RECRUIT => 1, REPUTATION => 1, CARD => 1], [null, null, VP]),
            25 => new DestinationType([RED => 1, YELLOW => 1, GREEN => 1, BLUE => 1, PURPLE => 1], [VP => 4, BRACELET => 1, RECRUIT => 1, REPUTATION => 1, CARD => 1], [null, null, VP]),
            26 => new DestinationType([PURPLE => 2, YELLOW => 2], [VP => 6], [null, VP, null]),
            27 => new DestinationType([PURPLE => 3, RED => 2], [VP => 8, CARD => 1], [null, null, VP]),
            28 => new DestinationType([BLUE => 2, RED => 2], [VP => 6], [null, VP, null]),
            29 => new DestinationType([BLUE => 3, PURPLE => 2], [VP => 7, REPUTATION => 2], [null, null, VP]),
            30 => new DestinationType([GREEN => 2, PURPLE => 2], [VP => 6], [null, VP, null]),
            31 => new DestinationType([GREEN => 3, BLUE => 2], [VP => 8, RECRUIT => 1], [null, null, VP]),
            32 => new DestinationType([YELLOW => 2, BLUE => 2], [VP => 6], [null, VP, null]),
            33 => new DestinationType([YELLOW => 3, GREEN => 2], [VP => 9], [null, null, VP]),
            34 => new DestinationType([RED => 2, GREEN => 2], [VP => 6], [null, VP, null]),
            35 => new DestinationType([RED => 3, YELLOW => 2], [VP => 7, BRACELET => 1], [null, null, VP]),
        ];
    }

    private function getDestinationFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Destination($dbCard, $this->DESTINATIONS);
    }

    private function getDestinationsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getDestinationFromDb($dbCard), array_values($dbCards));
    }

    public function getDestination(int $id) {
        return $this->getDestinationFromDb($this->destinations->getCard($id));
    }

    public function getDestinationsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `destination` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->game->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getDestinationFromDb($dbCard), array_values($dbResults));
    }

    public function canTakeDestination(Destination $destination, array $playedCardsColors, int $recruits, bool $strict): bool {
        $missingCards = 0;

        foreach ($destination->cost as $color => $required) {
            $available = 0;
            if ($color == EQUAL) {
                $available = max($playedCardsColors);
            } else if ($color == DIFFERENT) {
                $available = count(array_filter($playedCardsColors, fn($count) => $count > 0));
            } else {
                $available = ($playedCardsColors[$color] ?? 0);
            }

            if ($available < $required) {
                $missingCards += ($required - $available);
            }
        }

        return $strict ? $recruits == $missingCards : $recruits >= $missingCards;
    }

    public function getDestinationDeckTop(string $type) {
        return Destination::onlyId($this->getDestinationFromDb($this->destinations->getCardOnTop('deck'.$type)));
    }

    public function getDestinationDeckCount(string $type): int {
        return intval($this->destinations->countCardInLocation('deck'.$type));
    }

    public function pickDestinationToSlot(string $type, int $slot) {
        $destination = $this->getDestinationFromDb($this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $slot));
        if ($destination !== null) {
            $destination->location = 'slot'.$type;
            $destination->locationArg = $slot;
        }
        return $destination;
    }

    public function setupDestinations() {
        $cards = ['A' => [], 'B' => []];
        foreach ($this->DESTINATIONS as $number => $destinationType) {
            $cards[$number > 20 ? 'B' : 'A'][] = ['type' => $number > 20 ? 2 : 1, 'type_arg' => $number, 'nbr' => 1];
        }
        foreach (['A', 'B'] as $type) {
            $this->destinations->createCards($cards[$type], 'deck'.$type);
            $this->destinations->shuffle('deck'.$type);
        }

        foreach ([1, 2, 3] as $slot) {
            foreach (['A', 'B'] as $type) {
                $this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $slot);
            }
        }
    }
}
