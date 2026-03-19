<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class ReserveDestination extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_RESERVE_DESTINATION,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} can reserve a destination'),
            descriptionMyTurn: clienttranslate('${you} can reserve a destination'),
            transitions: [
                "next" => ST_PLAYER_PLAY_ACTION,
                "endTurn" => NextPlayer::class,
            ]
        );
    }   

    #[PossibleAction]
    public function actReserveDestination(int $id, int $activePlayerId) {
        $destination = $this->game->destinationManager->getDestination($id);

        if ($destination == null || !in_array($destination->location, ['slotA', 'slotB'])) {
            throw new UserException("You can't reserve this destination");
        }

        $this->game->destinationManager->destinations->moveCard($destination->id, 'reserved', $activePlayerId);
        $type = $destination->type == 2 ? 'B' : 'A';

        $this->bga->notify->all('reserveDestination', clienttranslate('${player_name} reserves a destination from line ${line_letter}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'destination' => $destination,
            'line_letter' => $type, // for logs
        ]);

        $newDestination = $this->game->destinationManager->pickDestinationToSlot($type, $destination->locationArg);

        $this->bga->notify->all('newTableDestination', '', [
            'destination' => $newDestination,
            'letter' => $type,
            'destinationDeckTop' => $this->game->destinationManager->getDestinationDeckTop($type),
            'destinationDeckCount' => $this->game->destinationManager->getDestinationDeckCount($type),
        ]);

        $this->gamestate->nextState('next');
    }

    #[PossibleAction]
    public function actPass(int $activePlayerId)
    {
        $this->game->redirectAfterAction($activePlayerId, true);
    }

    function zombie(int $playerId) {
        return $this->actPass($playerId);
    }
}
