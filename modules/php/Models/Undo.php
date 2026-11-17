<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\Models;

class Undo {
    public function __construct(public array $cardsIds, public array $tokensIds, public ?array $payOneLess) {
    }

}
