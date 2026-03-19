<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class DiscardTableCard extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_DISCARD_TABLE_CARD,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} can discard a card from the table'),
            descriptionMyTurn: clienttranslate('${you} can discard a card from the table'),
            transitions: [
            "next" => ST_PLAYER_PLAY_ACTION,
            "endTurn" => ST_NEXT_PLAYER,
            ]
        );
    }   

    #[PossibleAction]
    public function actDiscardTableCard(int $id, int $activePlayerId) {
        $card = $this->game->vikingManager->getCard($id);

        if ($card == null || $card->location != 'slot') {
            throw new UserException("You can't discard this card");
        }
        $slotColor = $card->locationArg;
        
        $this->game->vikingManager->cards->moveCard($card->id, 'discard');

        $this->bga->notify->all('discardTableCard', clienttranslate('${player_name} discards ${card_color} ${card_type} card from the table (${color} column)'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'card' => $card,
            'cardDiscardCount' => $this->game->vikingManager->getCardDiscardCount(),
            'color' => $this->game->getColorName($slotColor), // for logs
            'card_type' => $this->game->getGainName($card->gain), // for logs
            'card_color' => $this->game->getColorName($card->color), // for logs
        ]);

        $newTableCard = $this->game->vikingManager->pickCardToSlot($slotColor);

        $this->bga->notify->all('newTableCard', '', [
            'card' => $newTableCard,
            'cardDeckTop' => $this->game->vikingManager->getCardDeckTop(),
            'cardDeckCount' => $this->game->vikingManager->getCardDeckCount() + 1, // to count the new card
        ]);

        $this->game->redirectAfterAction($activePlayerId, true);
    }

    #[PossibleAction]
    public function actPass(int $activePlayerId) {
        $this->game->redirectAfterAction($activePlayerId, true);
    }

    function zombie(int $playerId) {
        return $this->actPass($playerId);
    }
}
