<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\Models;

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
