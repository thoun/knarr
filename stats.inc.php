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
 * stats.inc.php
 *
 * Knarr game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed at the end of the
    game.
    
    !! After modifying this file, you must use "Reload  statistics configuration" in BGA Studio backoffice
    ("Control Panel" / "Manage Game" / "Your Game")
    
    There are 2 types of statistics:
    _ table statistics, that are not associated to a specific player (ie: 1 value for each game).
    _ player statistics, that are associated to each players (ie: 1 value for each player in the game).

    Statistics types can be "int" for integer, "float" for floating point values, and "bool" for boolean
    
    Once you defined your statistics there, you can start using "initStat", "setStat" and "incStat" method
    in your game logic, using statistics names defined below.
    
    !! It is not a good idea to modify this file when a game is running !!

    If your game is already public on BGA, please read the following before any change:
    http://en.doc.boardgamearena.com/Post-release_phase#Changes_that_breaks_the_games_in_progress
    
    Notes:
    * Statistic index is the reference used in setStat/incStat/initStat PHP method
    * Statistic index must contains alphanumerical characters and no space. Example: 'turn_played'
    * Statistics IDs must be >=10
    * Two table statistics can't share the same ID, two player statistics can't share the same ID
    * A table statistic can have the same ID than a player statistics
    * Statistics ID is the reference used by BGA website. If you change the ID, you lost all historical statistic data. Do NOT re-use an ID of a deleted statistic
    * Statistic name is the English description of the statistic as shown to players
    
*/

$commonStats = [
    // repuration
    "reputationPoints" => [
        "id" => 20,
        "name" => totranslate("Points gained with reputation"),
        "type" => "int"
    ],

    // played cards
    "playedCards" => [
        "id" => 21,
        "name" => totranslate("Played cards"),
        "type" => "int"
    ],
    "assetsCollectedByPlayedCards" => [
        "id" => 22,
        "name" => totranslate("Assets gained by played cards"),
        "type" => "int"
    ],
    "assetsCollectedByPlayedCards1" => [
        "id" => 23,
        "name" => totranslate("Victory points gained by played cards"),
        "type" => "int"
    ],
    "assetsCollectedByPlayedCards2" => [
        "id" => 24,
        "name" => totranslate("Bracelets gained by played cards"),
        "type" => "int"
    ],
    "assetsCollectedByPlayedCards3" => [
        "id" => 25,
        "name" => totranslate("Recruits gained by played cards"),
        "type" => "int"
    ],
    "assetsCollectedByPlayedCards4" => [
        "id" => 26,
        "name" => totranslate("Reputation gained by played cards"),
        "type" => "int"
    ],
    "recruitsUsedToChooseCard" => [
        "id" => 30,
        "name" => totranslate("Recruits used to choose card"),
        "type" => "int"
    ],
    "discardedCards" => [
        "id" => 39,
        "name" => totranslate("Discarded cards to reform deck"),
        "type" => "int"
    ],
    
    // destinations
    "discoveredDestinations" => [
        "id" => 40,
        "name" => totranslate("Discovered destinations"),
        "type" => "int"
    ],    
    "discoveredDestinations1" => [
        "id" => 41,
        "name" => totranslate("Discovered Trading Lands"),
        "type" => "int"
    ],    
    "discoveredDestinations2" => [
        "id" => 42,
        "name" => totranslate("Discovered Lands of influence"),
        "type" => "int"
    ],
    "assetsCollectedByDestination" => [
        "id" => 43,
        "name" => totranslate("Assets gained by destinations"),
        "type" => "int"
    ],
    "assetsCollectedByDestination1" => [
        "id" => 44,
        "name" => totranslate("Victory points gained by destinations"),
        "type" => "int"
    ],
    "assetsCollectedByDestination2" => [
        "id" => 45,
        "name" => totranslate("Bracelets gained by destinations"),
        "type" => "int"
    ],
    "assetsCollectedByDestination3" => [
        "id" => 46,
        "name" => totranslate("Recruits gained by destinations"),
        "type" => "int"
    ],
    "assetsCollectedByDestination4" => [
        "id" => 47,
        "name" => totranslate("Reputation gained by destinations"),
        "type" => "int"
    ],
    "assetsCollectedByDestination5" => [
        "id" => 48,
        "name" => totranslate("Cards gained by destinations"),
        "type" => "int"
    ],
    "recruitsUsedToPayDestination" => [
        "id" => 50,
        "name" => totranslate("Recruits used to take a destination"),
        "type" => "int"
    ],

    // trade
    "tradeActions" => [
        "id" => 60,
        "name" => totranslate("Trade actions"),
        "type" => "int"
    ],   
    "tradeActions1" => [
        "id" => 61,
        "name" => totranslate("Trade actions with 1 bracelet"),
        "type" => "int"
    ],  
    "tradeActions2" => [
        "id" => 62,
        "name" => totranslate("Trade actions with 2 bracelets"),
        "type" => "int"
    ],  
    "tradeActions3" => [
        "id" => 63,
        "name" => totranslate("Trade actions with 3 bracelets"),
        "type" => "int"
    ], 
    "braceletsUsed" => [
        "id" => 64,
        "name" => totranslate("Bracelets used for trade"),
        "type" => "int"
    ], 
    "assetsCollectedByTrade" => [
        "id" => 65,
        "name" => totranslate("Assets gained by trade"),
        "type" => "int"
    ],
    "assetsCollectedByTrade1" => [
        "id" => 66,
        "name" => totranslate("Victory points gained by trade"),
        "type" => "int"
    ],
    "assetsCollectedByTrade2" => [
        "id" => 67,
        "name" => totranslate("Bracelets gained by trade"),
        "type" => "int"
    ],
    "assetsCollectedByTrade3" => [
        "id" => 68,
        "name" => totranslate("Recruits gained by trade"),
        "type" => "int"
    ],
    "assetsCollectedByTrade4" => [
        "id" => 69,
        "name" => totranslate("Reputation gained by trade"),
        "type" => "int"
    ],
    "assetsCollectedByTrade5" => [
        "id" => 70,
        "name" => totranslate("Cards gained by trade"),
        "type" => "int"
    ],  

    // artifacts
    "activatedArtifacts" => [
        "id" => 80,
        "name" => totranslate("Activated artifacts"),
        "type" => "int"
    ],
    
    //	miscellaneous
    "recruitsMissed" => [
        "id" => 90,
        "name" => totranslate("Recruits missed (already at 3)"),
        "type" => "int"
    ],
    "braceletsMissed" => [
        "id" => 91,
        "name" => totranslate("Bracelets missed (already at 3)"),
        "type" => "int"
    ],
];

$stats_type = [
    // Statistics global to table
    "table" => $commonStats + [
        "roundNumber" => [
            "id" => 10,
            "name" => totranslate("Number of rounds"),
            "type" => "int"
        ],
    ],
    
    // Statistics existing for each player
    "player" => $commonStats + [
    ],
];
