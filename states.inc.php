<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Knarr implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * states.inc.php
 *
 * Knarr game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/
require_once("modules/php/constants.inc.php");

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_SCORE_REPUTATION ]
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];

$playerActionsGameStates = [

    ST_PLAYER_PLAY_ACTION => [
        "name" => "playAction",
        "description" => clienttranslate('${actplayer} must recruit (play a card) or explore (take a destination)'),
        "descriptionmyturn" => clienttranslate('${you} must recruit (play a card) or explore (take a destination)'),
        "descriptionRecruitOnly" => clienttranslate('${actplayer} can recruit (play a card)'),
        "descriptionmyturnRecruitOnly" => clienttranslate('${you} can recruit (play a card)'),
        "descriptionExploreOnly" => clienttranslate('${actplayer} can explore (take a destination)'),
        "descriptionmyturnExploreOnly" => clienttranslate('${you} can explore (take a destination)'),
        "descriptionTradeOnly" => clienttranslate('${actplayer} can trade'),
        "descriptionmyturnTradeOnly" => clienttranslate('${you} can trade'),
        "type" => "activeplayer",    
        "args" => "argPlayAction",
        //"action" => "stPlayAction",
        "possibleactions" => [ 
            "playCard",
            "takeDestination",
            "goTrade",
            "endTurn",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "chooseNewCard" => ST_PLAYER_CHOOSE_NEW_CARD,
            "payDestination" => ST_PLAYER_PAY_DESTINATION,
            "trade" => ST_PLAYER_TRADE,
            "endTurn" => ST_NEXT_PLAYER,
        ],
    ],

    ST_PLAYER_CHOOSE_NEW_CARD => [
        "name" => "chooseNewCard",
        "description" => clienttranslate('${actplayer} must choose the new card to take from the table'),
        "descriptionmyturn" => clienttranslate('${you} must choose the new card to take from the table'),
        "type" => "activeplayer",
        "args" => "argChooseNewCard",
        "possibleactions" => [ 
            "chooseNewCard",
            "cancel",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
            "reserve" => ST_PLAYER_RESERVE_DESTINATION,
            "discardTableCard" => ST_PLAYER_DISCARD_TABLE_CARD,
            "endTurn" => ST_NEXT_PLAYER,
            "cancel" => ST_PLAYER_PLAY_ACTION,
        ]
    ],

    ST_PLAYER_PAY_DESTINATION => [
        "name" => "payDestination",
        "description" => clienttranslate('${actplayer} must choose the cards to pay for the selected destination'),
        "descriptionmyturn" => clienttranslate('${you} must choose the cards to pay for the selected destination'),
        "type" => "activeplayer",
        "args" => "argPayDestination",
        "possibleactions" => [ 
            "payDestination",
            "cancel",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
            "reserve" => ST_PLAYER_RESERVE_DESTINATION,
            "discardTableCard" => ST_PLAYER_DISCARD_TABLE_CARD,
            "endTurn" => ST_NEXT_PLAYER,
            "cancel" => ST_PLAYER_PLAY_ACTION,
        ]
    ],

    ST_PLAYER_RESERVE_DESTINATION => [
        "name" => "reserveDestination",
        "description" => clienttranslate('${actplayer} can reserve a destination'),
        "descriptionmyturn" => clienttranslate('${you} can reserve a destination'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "reserveDestination",
            "pass",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "endTurn" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_DISCARD_TABLE_CARD => [
        "name" => "discardTableCard",
        "description" => clienttranslate('${actplayer} can discard a card from the table'),
        "descriptionmyturn" => clienttranslate('${you} can discard a card from the table'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "discardTableCard",
            "pass",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "endTurn" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_TRADE => [
        "name" => "trade",
        "description" => clienttranslate('${actplayer} must choose how many bracelets to spend'),
        "descriptionmyturn" => clienttranslate('${you} must choose how many bracelets to spend'),
        "type" => "activeplayer",
        "args" => "argTrade",
        "possibleactions" => [ 
            "trade",
            "cancel",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
            "endTurn" => ST_NEXT_PLAYER,
            "cancel" => ST_PLAYER_PLAY_ACTION,
        ]
    ],

    ST_MULTIPLAYER_DISCARD_CARD => [
        "name" => "discardCard",
        "description" => clienttranslate('Waiting for other players'),
        "descriptionmyturn" => clienttranslate('${you} must discard a card to refill the deck'),
        "type" => "multipleactiveplayer",
        "action" => "stDiscardCard",
        "possibleactions" => [ 
            "discardCard",
        ],
        "transitions" => [
            "next" => ST_AFTER_DISCARD_CARD,
        ],
    ],
];

$gameGameStates = [

    ST_SCORE_REPUTATION => [
        "name" => "scoreReputation",
        "description" => clienttranslate('Scoring reputation points...'),
        "type" => "game",
        "action" => "stScoreReputation",
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
        ]
    ],

    ST_AFTER_DISCARD_CARD => [
        "name" => "afterDiscardCard",
        "description" => "",
        "type" => "game",
        "action" => "stAfterDiscardCard",
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
            "discardCardsForDeck" => ST_MULTIPLAYER_DISCARD_CARD,
            "reserve" => ST_PLAYER_RESERVE_DESTINATION,
            "discardTableCard" => ST_PLAYER_DISCARD_TABLE_CARD,
            "endTurn" => ST_NEXT_PLAYER,
        ],
    ],

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => [
            "nextPlayer" => ST_SCORE_REPUTATION,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [
            "endGame" => ST_END_GAME,
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;



