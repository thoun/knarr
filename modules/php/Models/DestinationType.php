<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\Models;

class DestinationType {
    public function __construct(public array $cost, public array $immediateGains, public array $gains) {
    } 
}
