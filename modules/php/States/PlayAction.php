<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class PlayAction extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_PLAY_ACTION,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must recruit (play a card) or explore (take a destination)'),
            descriptionMyTurn: clienttranslate('${you} must recruit (play a card) or explore (take a destination)'),
        );
    }   

    function getArgs(int $activePlayerId): array {
        return $this->game->argPlayAction($activePlayerId);
    }

    #[PossibleAction]
    public function actPlayCard(int $id, int $activePlayerId) {
        if (boolval($this->game->getGameStateValue((string)RECRUIT_DONE))) {
            throw new UserException("Invalid action");
        }
            

        $hand = $this->game->vikingManager->getCardsByLocation('hand', $activePlayerId);
        $card = \array_find($hand, fn($c) => $c->id == $id);

        if ($card == null || $card->location != 'hand' || $card->locationArg != $activePlayerId) {
            throw new UserException("You can't play this card");
        }

        $this->game->vikingManager->cards->moveCard($card->id, 'played'.$activePlayerId.'-'.$card->color, intval($this->game->destinationManager->destinations->countCardInLocation('played'.$activePlayerId.'-'.$card->color)));

        $cardsOfColor = $this->game->vikingManager->getCardsByLocation('played'.$activePlayerId.'-'.$card->color);
        $gains = array_map(fn($card) => $card->gain, $cardsOfColor);
        $groupGains = $this->game->groupGains($gains);
        $effectiveGains = $this->game->gainResources($activePlayerId, $groupGains, 'recruit');

        $this->bga->notify->all('playCard', clienttranslate('${player_name} plays a ${card_color} ${card_type} card from their hand and gains ${gains}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'card' => $card,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'card_type' => $this->game->getGainName($card->gain), // for logs
            'card_color' => $this->game->getColorName($card->color), // for logs
        ]);

        $this->game->setGameStateValue((string)PLAYED_CARD_COLOR, $card->color);

        $argChooseNewCard = $this->game->argChooseNewCard($activePlayerId);
        if ($argChooseNewCard['allFree']) {
            $this->bga->notify->all('log', clienttranslate('${player_name} can recruit any viking for free thanks to ${artifact_name} effect'), [
                'player_name' => $this->game->getPlayerName($activePlayerId),
                'artifact_name' => $this->game->artifactManager->getArtifactName(ARTIFACT_CAULDRON), // for logs
                'i18n' => ['artifact_name'],
            ]);
        }

        $this->bga->playerStats->inc('playedCards', 1, $activePlayerId, updateTableStat: true);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->bga->playerStats->inc('assetsCollectedByPlayedCards', $allGains, $activePlayerId, updateTableStat: true);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->bga->playerStats->inc('assetsCollectedByPlayedCards'.$type, $count, $activePlayerId, updateTableStat: true);
            }
        }

        if ($this->game->isSkaliExpansion()) {
            $this->game->buildingManager->onRecruitViking($activePlayerId, count($cardsOfColor) <= 1);
        }

        return ST_PLAYER_CHOOSE_NEW_CARD;
    }

    #[PossibleAction]
    public function actTakeDestination(int $id, array $args) {
        if (boolval($this->game->getGameStateValue((string)EXPLORE_DONE))) {
            throw new UserException("Invalid action");
        }

        $destination = \array_find($args['possibleDestinations'], fn($c) => $c->id == $id);

        if ($destination == null) {
            throw new UserException("You can't take this destination");
        }

        $this->game->setGameStateValue((string)SELECTED_DESTINATION, $id);

        return ST_PLAYER_PAY_DESTINATION;
    }

    #[PossibleAction]
    public function actTakeBuilding(int $id, int $activePlayerId, array $args) {
        if (boolval($this->game->getGameStateValue((string)EXPLORE_DONE))) {
            throw new UserException("Invalid action");
        }

        /** @var Building */
        $building = \array_find($args['possibleBuildings'], fn($c) => $c->id == $id);

        if ($building == null) {
            throw new UserException("You can't take this building");
        }

        $coins = $building->cost[COIN];

        $this->game->incPlayerCoin($activePlayerId, -$coins, clienttranslate('${player_name} pays ${absInc} coins(s) for the selected building'));
        //$this->bga->playerStats->inc('coinsUsedToPayBuilding', $coins, $activePlayerId, updateTableStat: true);

        $buildingIndex = intval($this->game->buildingManager->buildings->countCardInLocation('played'.$activePlayerId));
        $this->game->buildingManager->buildings->moveCard($building->id, 'played'.$activePlayerId, $buildingIndex);

        $this->bga->notify->all('takeBuilding', clienttranslate('${player_name} takes a building'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'building' => $building,
        ]);
                    
        //$this->bga->playerStats->inc('discoveredBuildings', 1, $activePlayerId, updateTableStat: true);

        $newBuilding = $this->game->buildingManager->pickBuildingToSlot($building->locationArg);

        $this->bga->notify->all('newTableBuilding', '', [ 
            'building' => $newBuilding,
            'buildingDeckTop' => $this->game->buildingManager->getBuildingDeckTop(),
            'buildingDeckCount' => $this->game->buildingManager->getBuildingDeckCount(),
        ]);

        $this->game->setGameStateValue((string)\DEVELOPING_VILLAGE_DONE, 1);

        //$this->game->redirectAfterAction($activePlayerId, true);
        return PlayAction::class;
    }

    #[PossibleAction]
    public function actGoTrade() {
        return Trade::class;
    }

    #[PossibleAction]
    public function actGoRenewBuildings() {
        return RenewBuildings::class;
    }
    
    #[PossibleAction]
    public function actEndTurn(int $currentPlayerId) {
        $endTurn = $this->game->artifactManager->checkEndTurnArtifacts($currentPlayerId);

        return $endTurn ? NextPlayer::class : PlayAction::class;
    }

    function zombie(int $playerId) {
        return $this->actEndTurn($playerId);
    }
}
