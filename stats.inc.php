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
    "playedCards" => [
        "id" => 20,
        "name" => totranslate("Played cards"),
        "type" => "int"
    ],
    "playedCards1" => [
        "id" => 21,
        "name" => totranslate("Played cards (house)"),
        "type" => "int"
    ],
    "playedCards2" => [
        "id" => 22,
        "name" => totranslate("Played cards (storage)"),
        "type" => "int"
    ],
    "playedCards3" => [
        "id" => 23,
        "name" => totranslate("Played cards (human)"),
        "type" => "int"
    ],
    "playedCards4" => [
        "id" => 24,
        "name" => totranslate("Played cards (tool)"),
        "type" => "int"
    ],
    "collectedResources" => [
        "id" => 30,
        "name" => totranslate("Collected resources"),
        "type" => "int"
    ],
    "collectedResources1" => [
        "id" => 31,
        "name" => totranslate("Collected resources (berry)"),
        "type" => "int"
    ],
    "collectedResources2" => [
        "id" => 32,
        "name" => totranslate("Collected resources (meat)"),
        "type" => "int"
    ],
    "collectedResources3" => [
        "id" => 33,
        "name" => totranslate("Collected resources (flint)"),
        "type" => "int"
    ],
    "collectedResources4" => [
        "id" => 34,
        "name" => totranslate("Collected resources (skin)"),
        "type" => "int"
    ],
    "collectedResources5" => [
        "id" => 35,
        "name" => totranslate("Collected resources (bone)"),
        "type" => "int"
    ],
    "pointCards1" => [
        "id" => 41,
        "name" => totranslate("Points with houses"),
        "type" => "int"
    ],
    "pointCards2" => [
        "id" => 42,
        "name" => totranslate("Points with storages"),
        "type" => "int"
    ],
    "pointCards3" => [
        "id" => 43,
        "name" => totranslate("Points with humans"),
        "type" => "int"
    ],
    "pointCards4" => [
        "id" => 44,
        "name" => totranslate("Points with tools"),
        "type" => "int"
    ],
    "sacrifices" => [
        "id" => 50,
        "name" => totranslate("Sacrifices"),
        "type" => "int"
    ],
    "discardedResourcesEndOfTurn" => [
        "id" => 51,
        "name" => totranslate("Discarded resources at end of turn"),
        "type" => "int"
    ],
    "collectedResourcesFromFire" => [
        "id" => 52,
        "name" => totranslate("Collected resources from fire"),
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
