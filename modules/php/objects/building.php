<?php

require_once(__DIR__.'/../constants.inc.php');

class BuildingType {
    public function __construct(public array $cost = [], public array $gains = [], public ?array $mostRaid = null, public ?array $fewestRaid = null) {
    }
}

class Building extends BuildingType {

    public int $id;
    public string $location;
    public int $locationArg;
    public /*int | null*/ $number;

    public function __construct($dbCard, ?array $BUILDINGS = null) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->number = array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null;

        if ($this->number !== null && $BUILDINGS !== null && array_key_exists($this->number, $BUILDINGS)) {
            $cardType = $BUILDINGS[$this->number];
            $this->cost = $cardType->cost;
            $this->gains = $cardType->gains;
            $this->mostRaid = $cardType->mostRaid;
            $this->fewestRaid = $cardType->fewestRaid;
        }
    }

    public static function onlyId(?Building $card) {
        if ($card == null) {
            return null;
        }

        return new Building([
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
