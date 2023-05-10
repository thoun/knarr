<?php

require_once(__DIR__.'/../constants.inc.php');

class DestinationType {
    public array $cost;
    public array $immediateGains;
    public array $gains;
  
    public function __construct(array $cost, array $immediateGains, array $gains) {
        $this->cost = $cost;
        $this->immediateGains = $immediateGains;
        $this->gains = $gains;
    } 
}

class Destination extends DestinationType {

    public int $id;
    public string $location;
    public int $locationArg;
    public /*int | null*/ $type;
    public /*int | null*/ $number;

    public function __construct($dbCard, $DESTINATIONS) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->type = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;
        $this->number = array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null;

        if ($this->number !== null) {
            $cardType = $DESTINATIONS[$this->number];
            $this->cost = $cardType->cost;
            $this->immediateGains = $cardType->immediateGains;
            $this->gains = $cardType->gains;
        }
    } 

    public static function onlyId(/*Destination|null*/ $card) {
        if ($card == null) {
            return null;
        }
        
        return new Destination([
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