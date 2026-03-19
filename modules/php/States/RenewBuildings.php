<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\Actions\Types\IntArrayParam;
use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class RenewBuildings extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_RENEW_BUILDINGS,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must choose 1 or 2 Building cards'),
            descriptionMyTurn: clienttranslate('${you} must choose 1 or 2 Building cards'),
        );
    }

    #[PossibleAction]
    public function actRenewBuildings(#[IntArrayParam] array $ids, int $activePlayerId) {
        if (count($ids) < 1 || count($ids) > 2 || count(array_unique($ids)) !== count($ids)) {
            throw new UserException("Invalid selection");
        }

        $buildingsById = [];
        foreach ($this->game->buildingManager->getBuildingsByLocation('slot') as $building) {
            $buildingsById[$building->id] = $building;
        }

        $selectedBuildings = [];
        foreach ($ids as $id) {
            $building = $buildingsById[$id] ?? null;
            if ($building === null) {
                throw new UserException("Invalid selection");
            }
            $selectedBuildings[] = $building;
        }

        foreach ($selectedBuildings as $building) {
            $this->game->buildingManager->buildings->insertCardOnExtremePosition($building->id, 'deck', false);
        }

        $this->bga->notify->all('removeTableBuildings', '', [ // TODO
            'selectedBuildings' => $selectedBuildings,
            'buildingDeckTop' => $this->game->buildingManager->getBuildingDeckTop(),
            'buildingDeckCount' => $this->game->buildingManager->getBuildingDeckCount(),
        ]);

        usort($selectedBuildings, fn($a, $b) => $a->locationArg <=> $b->locationArg);

        foreach ($selectedBuildings as $building) {
            $newBuilding = $this->game->buildingManager->pickBuildingToSlot($building->locationArg);

            $this->bga->notify->all('newTableBuilding', '', [
                'building' => $newBuilding,
                'buildingDeckTop' => $this->game->buildingManager->getBuildingDeckTop(),
                'buildingDeckCount' => $this->game->buildingManager->getBuildingDeckCount(),
            ]);
        }

        $this->game->playerRenewal->set($activePlayerId, 0);

        return PlayAction::class;
    }

    #[PossibleAction]
    public function actCancel() {
        return PlayAction::class;
    }

    function zombie(int $playerId, array $args) {
        return $this->actCancel();
    }
}
