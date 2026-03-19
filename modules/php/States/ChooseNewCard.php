<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class ChooseNewCard extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_NEW_CARD,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must choose the new card to take from the table'),
            descriptionMyTurn: clienttranslate('${you} must choose the new card to take from the table'),
            transitions: [
                "next" => ST_PLAYER_PLAY_ACTION,
                "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
                "reserve" => ST_PLAYER_RESERVE_DESTINATION,
                "discardTableCard" => ST_PLAYER_DISCARD_TABLE_CARD,
                "endTurn" => ST_NEXT_PLAYER,
            ]
        );
    }   

    function getArgs(int $activePlayerId): array {
        return $this->game->argChooseNewCard($activePlayerId);
    }

    #[PossibleAction]
    public function actChooseNewCard(int $id, int $activePlayerId, array $args) {
        $card = \array_find($args['centerCards'], fn($card) => $card->id == $id);

        if ($card == null || $card->location != 'slot') {
            throw new UserException("You can't play this card");
        }
        $slotColor = $card->locationArg;

        if ($slotColor != $args['freeColor'] && !$args['allFree']) {
            if ($args['recruits'] < 1) {
                throw new UserException("Not enough recruits");
            } else {
                $this->game->incPlayerRecruit($activePlayerId, -1, clienttranslate('${player_name} pays a recruit to choose the new card'), []);
        
                $this->bga->playerStats->inc('recruitsUsedToChooseCard', 1, $activePlayerId, updateTableStat: true);
            }
        }
        
        $this->game->vikingManager->cards->moveCard($card->id, 'hand', $activePlayerId);

        $this->bga->notify->all('takeCard', clienttranslate('${player_name} takes the ${card_color} ${card_type} card from the table (${color} column)'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'card' => $card,
            'color' => $this->game->getColorName($slotColor), // for logs
            'card_type' => $this->game->getGainName($card->gain), // for logs
            'card_color' => $this->game->getColorName($card->color), // for logs
        ]);

        if ($this->game->vikingManager->getAvailableDeckCards() >= 1) {
            $this->game->endOfRecruit($activePlayerId, $slotColor);
        } else {
            $this->game->setGlobalVariable(REMAINING_CARDS_TO_TAKE, [
                'playerId' => $activePlayerId,
                'slotColor' => $slotColor,
                'phase' => 'recruit',
                'remaining' => 1,
            ]);
            $this->gamestate->nextState('discardCardsForDeck');
        }
    }

    #[PossibleAction]
    public function actCancel() {
        return PlayAction::class;
    }

    function zombie(int $playerId) {
        return $this->actCancel();
    }
}
