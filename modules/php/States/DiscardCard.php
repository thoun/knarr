<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class DiscardCard extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_MULTIPLAYER_DISCARD_CARD,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            description: clienttranslate('Waiting for other players'),
            descriptionMyTurn: clienttranslate('${you} must discard a card to refill the deck'),
            transitions: [
                "next" => ST_PLAYER_PLAY_ACTION,
                "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
                "endTurn" => ST_NEXT_PLAYER,
            ]
        );
    }   

    function onEnteringState() {
        $playersIds = $this->game->getPlayersIds();

        $max = -1;
        $maxPlayersIds = [];

        foreach ($playersIds as $playerId) {
            $playerCardCount = intval($this->game->getUniqueValueFromDB("SELECT count(*) FROM card WHERE card_location LIKE 'played$playerId%'"));
            if ($playerCardCount > $max) {
                $max = $playerCardCount;
                $maxPlayersIds = [$playerId];
            } else if ($playerCardCount == $max) {
                $maxPlayersIds[] = $playerId;
            }
        }

        $this->gamestate->setPlayersMultiactive($maxPlayersIds, 'next', true);
    }

    #[PossibleAction]
    public function actDiscardCard(int $id, int $currentPlayerId) {
        $card = $this->game->vikingManager->getCard($id);

        if ($card == null || !str_starts_with($card->location, "played$currentPlayerId")) {
            throw new UserException("You must choose a card in front of you");
        }

        $this->game->vikingManager->cards->moveCard($card->id, 'discard');

        $this->bga->notify->all('discardCards', clienttranslate('${player_name} discards a cards to refill the deck'), [
            'playerId' => $currentPlayerId,
            'player_name' => $this->game->getPlayerName($currentPlayerId),
            'cards' => [$card],
            'cardDiscardCount' => $this->game->vikingManager->getCardDiscardCount(),
        ]);

        $this->bga->playerStats->inc('discardedCards', 1, $currentPlayerId, updateTableStat: true);

        $this->gamestate->setPlayerNonMultiactive($currentPlayerId, AfterDiscardCard::class);
    }

    function zombie(int $playerId) {
        $playedCards = [];
        foreach ([1,2,3,4,5] as $color) {
            $playedCards = array_merge($playedCards, $this->game->vikingManager->getCardsByLocation('played'.$playerId.'-'.$color));
        }
        $cardId = $this->getRandomZombieChoice(array_map(fn($card) => $card->id, $playedCards));

        return $this->actDiscardCard($cardId, $playerId);
    }
}
