<?php

require_once(__DIR__.'/../constants.inc.php');

class CardType {
    public /*int|null*/ $color;
    public /*int|null*/ $gain;
    public array $number;
  
    public function __construct(int $color, int $gain, array $number) {
        $this->color = $color;
        $this->gain = $gain;
        $this->number = $number;
    } 
}

class Card extends CardType {

    public int $id;
    public string $location;
    public int $locationArg;
    public /*int|null*/ $color;
    public /*int|null*/ $gain;

    public function __construct($dbCard) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->color = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;
        $this->gain = array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null;
    } 

    public static function onlyId(/*Card|null*/ $card) {
        if ($card == null) {
            return null;
        }
        
        return new Card([
            'card_id' => $card->id,
            'card_location' => $card->location,
            'card_location_arg' => $card->locationArg,
        ]);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }
}

?>