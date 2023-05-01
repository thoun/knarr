<?php

require_once(__DIR__.'/../constants.inc.php');

class CardType {
    public int $tokens;
    public int $points;
    public int $cardType;
    public array $resources;
    public bool $discard;
    public /*int|null*/ $power;
    public /*int|null*/ $storageType;
  
    public function __construct(int $tokens, int $points, int $cardType, array $resources, /*int|null*/ $powerOrStorageType = null) {
        $this->tokens = $tokens;
        $this->points = $points;
        $this->cardType = $cardType;
        $this->resources = $resources;
        $this->discard = count($this->resources) > 0 && $this->resources[0] == DISCARD;
        if ($this->discard) {
            $this->resources = array_slice($this->resources, 1);
        }
        if ($cardType == HUMAN) {
            $this->power = $powerOrStorageType;
        } else {
            $this->storageType = $powerOrStorageType;
        }
    } 
}

class Card extends CardType {

    public int $id;
    public string $location;
    public int $locationArg;
    public /*int|null*/ $color;
    public /*int|null*/ $number;
    public /*Token|null*/ $prestoredResource;
    public /*array|null*/ $storedResources;

    public /*bool|null*/ $canStoreResourceType; // only for front

    public function __construct($dbCard, $CARDS) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->color = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;
        $this->number = array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null;
        
        if ($this->number !== null) {
            $cardType = $CARDS[$this->color][$this->number];
            $this->tokens = $cardType->tokens;
            $this->points = $cardType->points;
            $this->cardType = $cardType->cardType;
            $this->resources = $cardType->resources;
            $this->discard = $cardType->discard;
            $this->power = $cardType->power;
            $this->storageType = $cardType->storageType;
        }
    } 

    public static function onlyId(/*Card|null*/ $card) {
        if ($card == null) {
            return null;
        }
        
        return new Card([
            'card_id' => $card->id,
            'card_location' => $card->location,
            'card_location_arg' => $card->locationArg,
        ], null);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }
}

?>