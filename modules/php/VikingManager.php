<?php

namespace Bga\Games\Knarr;

use Bga\GameFramework\Components\Deck;
use Card;
use CardType;

require_once(__DIR__.'/constants.inc.php');
require_once(__DIR__.'/objects/card.php');

class VikingManager {
    public Deck $cards;
    public array $CARDS;

    public function __construct(private Game $game) {
        $this->cards = $this->game->deckFactory->createDeck('card');
        $this->cards->autoreshuffle = true;
        $this->cards->autoreshuffle_trigger = ['obj' => $this->game, 'method' => 'cardDeckAutoReshuffle'];

        $this->CARDS = [
            new CardType(BLUE, VP, [2 => 2, 3 => 3, 4 => 4]),
            new CardType(BLUE, BRACELET, [2 => 1, 3 => 2, 4 => 2]),
            new CardType(BLUE, RECRUIT, [2 => 1, 3 => 1, 4 => 1]),
            new CardType(BLUE, REPUTATION, [2 => 2, 3 => 2, 4 => 3]),

            new CardType(YELLOW, VP, [2 => 3, 3 => 4, 4 => 5]),
            new CardType(YELLOW, BRACELET, [2 => 1, 3 => 1, 4 => 2]),
            new CardType(YELLOW, RECRUIT, [2 => 0, 3 => 1, 4 => 1]),
            new CardType(YELLOW, REPUTATION, [2 => 2, 3 => 2, 4 => 2]),

            new CardType(PURPLE, VP, [2 => 1, 3 => 2, 4 => 4]),
            new CardType(PURPLE, BRACELET, [2 => 2, 3 => 2, 4 => 2]),
            new CardType(PURPLE, RECRUIT, [2 => 2, 3 => 2, 4 => 2]),
            new CardType(PURPLE, REPUTATION, [2 => 1, 3 => 2, 4 => 2]),

            new CardType(GREEN, VP, [2 => 2, 3 => 3, 4 => 4]),
            new CardType(GREEN, BRACELET, [2 => 1, 3 => 1, 4 => 2]),
            new CardType(GREEN, RECRUIT, [2 => 2, 3 => 3, 4 => 3]),
            new CardType(GREEN, REPUTATION, [2 => 1, 3 => 1, 4 => 1]),

            new CardType(RED, VP, [2 => 3, 3 => 3, 4 => 4]),
            new CardType(RED, BRACELET, [2 => 2, 3 => 3, 4 => 3]),
            new CardType(RED, RECRUIT, [2 => 1, 3 => 1, 4 => 2]),
            new CardType(RED, REPUTATION, [2 => 0, 3 => 1, 4 => 1]),
        ];
    }

    private function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard);
    }

    private function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    public function getCard(int $id) {
        return $this->getCardFromDb($this->cards->getCard($id));
    }

    public function getCardOnTopOfDeck() {
        return $this->getCardFromDb($this->cards->getCardOnTop('deck'));
    }

    public function getCardsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `card` WHERE `card_location` = '$location'";
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
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
    }

    public function getCardDeckTop() {
        return Card::onlyId($this->getCardOnTopOfDeck());
    }

    public function getCardDeckCount(): int {
        return intval($this->cards->countCardInLocation('deck'));
    }

    public function getCardDiscardCount(): int {
        return intval($this->cards->countCardInLocation('discard'));
    }

    public function getAvailableDeckCards(): int {
        return $this->getCardDeckCount() + $this->getCardDiscardCount();
    }

    public function pickDeckCard() {
        return $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'played'));
    }

    public function pickCardToSlot(int $slotColor) {
        $card = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotColor));
        if ($card !== null) {
            $card->location = 'slot';
            $card->locationArg = $slotColor;
        }
        return $card;
    }

    public function setupCards(array $playersIds) {
        $playerCount = count($playersIds);
        $cards = [];
        foreach ($this->CARDS as $cardType) {
            $cards[] = ['type' => $cardType->color, 'type_arg' => $cardType->gain, 'nbr' => $cardType->number[$playerCount]];
        }
        $this->cards->createCards($cards, 'deck');
        $this->cards->shuffle('deck');

        foreach ([1, 2, 3, 4, 5] as $slot) {
            $this->cards->pickCardForLocation('deck', 'slot', $slot);
        }

        foreach ($playersIds as $playerId) {
            $playedCards = $this->getCardsFromDb($this->cards->pickCardsForLocation(2, 'deck', 'played'.$playerId));
            while ($playedCards[0]->color == $playedCards[1]->color) {
                $this->cards->moveAllCardsInLocation('played'.$playerId, 'deck');
                $this->cards->shuffle('deck');
                $playedCards = $this->getCardsFromDb($this->cards->pickCardsForLocation(2, 'deck', 'played'.$playerId));
            }
            foreach ($playedCards as $playedCard) {
                $this->cards->moveCard($playedCard->id, 'played'.$playerId.'-'.$playedCard->color);
            }

            $this->cards->pickCardsForLocation(3, 'deck', 'hand', $playerId);
        }
    }
}
