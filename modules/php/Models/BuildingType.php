<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\Models;

class BuildingType {
    public function __construct(public array $cost = [], public array $gains = [], public ?array $mostRaid = null, public ?array $fewestRaid = null) {
    }
}
