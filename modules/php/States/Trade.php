<?php

declare(strict_types=1);

namespace Bga\Games\Knarr\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Knarr\Game;

class Trade extends GameState
{
    function __construct(
        protected Game $game,
    ) {
        parent::__construct($game,
            id: ST_PLAYER_TRADE,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must choose how many bracelets to spend'),
            descriptionMyTurn: clienttranslate('${you} must choose how many bracelets to spend'),
            transitions: [
                "next" => ST_PLAYER_PLAY_ACTION,
                "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
                "endTurn" => ST_NEXT_PLAYER,
            ]
        );
    }   

    function getArgs(int $activePlayerId): array {
        $bracelets = $this->game->getPlayer($activePlayerId)->bracelet;
        $gainsByBracelets = [];
        for ($i = 1; $i <= 3; $i++) {
            $gainsByBracelets[$i] = count($this->game->getTradeGains($activePlayerId, $i));
        }

        return [
            'bracelets' => $bracelets,
            'gainsByBracelets' => $gainsByBracelets,
        ];
    }

    #[PossibleAction]
    public function actTrade(int $number, int $activePlayerId) {
        if ($this->game->getPlayer($activePlayerId)->bracelet < $number) {
            throw new UserException("Not enough bracelets");
        }

        $this->game->incPlayerBracelet($activePlayerId, -$number, clienttranslate('${player_name} chooses to pay ${number} bracelet(s) to trade'), [
            'number' => $number, // for logs
        ]);

        $gains = $this->game->getTradeGains($activePlayerId, $number);
        $groupGains = $this->game->groupGains($gains);
        $effectiveGains = $this->game->gainResources($activePlayerId, $groupGains, 'trade');

        $this->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with traded bracelet(s)'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
        ]);

        $this->bga->playerStats->inc('tradeActions', 1, $activePlayerId, updateTableStat: true);
        $this->bga->playerStats->inc('tradeActions'.$number, 1, $activePlayerId, updateTableStat: true);
        $this->bga->playerStats->inc('braceletsUsed', $number, $activePlayerId, updateTableStat: true);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->bga->playerStats->inc('assetsCollectedByTrade', $allGains, $activePlayerId, updateTableStat: true);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->bga->playerStats->inc('assetsCollectedByTrade'.$type, $count, $activePlayerId, updateTableStat: true);
            }
        }

        if ($this->game->getGlobalVariable(REMAINING_CARDS_TO_TAKE) != null) {
            $this->gamestate->nextState('discardCardsForDeck');
        } else {
            $this->game->endTrade($activePlayerId);
        }
    }

    #[PossibleAction]
    public function actCancel() {
        return PlayAction::class;
    }

    function zombie(int $playerId, array $args) {
        if ($args['bracelets'] > 0) {
            return $this->actTrade($args['bracelets'], $playerId);
        } else {
            return $this->actCancel();
        }
    }
}
