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
 * material.inc.php
 *
 * Knarr game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

require_once(__DIR__.'/modules/php/constants.inc.php');
require_once(__DIR__.'/modules/php/objects/card.php');

$this->CENTER_RESOURCES_BY_PLAYER_COUNT = [
    2 => 6,
    3 => 8,
    4 => 10,
];

$this->CARDS = [    
    BLUE => [
        1 => new CardType(2, 3, HOUSE, [BERRY, MEAT, SKIN], BLUE),
        2 => new CardType(1, 2, HOUSE, [BERRY, MEAT], BLUE),
        3 => new CardType(1, 4, STORAGE, [SKIN], FLINT),
        4 => new CardType(2, 3, STORAGE, [MEAT], FLINT),
        5 => new CardType(2, 2, STORAGE, [], FLINT),
        6 => new CardType(1, 4, HUMAN, [MEAT, SKIN], POWER_CARD),
        7 => new CardType(2, 6, HUMAN, [BERRY, BERRY, SKIN], POWER_CARD),
        8 => new CardType(3, 2, HUMAN, [DISCARD, MEAT], POWER_CARD),
        9 => new CardType(2, 7, HUMAN, [MEAT, MEAT, SKIN], POWER_RESSOURCE),
        10 => new CardType(1, 5, HUMAN, [BERRY, BERRY], POWER_RESSOURCE),
        11 => new CardType(3, 14, HUMAN, [MEAT, MEAT, SKIN, SKIN], POWER_RESSOURCE),
        12 => new CardType(2, 3, TOOL, [BERRY, MEAT, MEAT, SKIN], TOOL),
    ],

    YELLOW => [
        1 => new CardType(3, 3, HOUSE, [BERRY, BERRY, FLINT, FLINT], YELLOW),
        2 => new CardType(2, 2, HOUSE, [BERRY, MEAT, FLINT], YELLOW),
        3 => new CardType(1, 4, STORAGE, [BERRY], SKIN),
        4 => new CardType(1, 3, STORAGE, [], SKIN),
        5 => new CardType(1, 8, HUMAN, [MEAT, FLINT]),
        6 => new CardType(1, 15, HUMAN, [DISCARD, BERRY, BERRY, MEAT, MEAT]),
        7 => new CardType(3, 3, HUMAN, [BERRY, FLINT]),
        8 => new CardType(2, 2, TOOL, [FLINT], HOUSE),
        9 => new CardType(3, 3, TOOL, [BERRY, BERRY, MEAT], HOUSE),
        10 => new CardType(2, 2, TOOL, [MEAT], STORAGE),
        11 => new CardType(2, 3, TOOL, [BERRY, BERRY, FLINT], STORAGE),
        12 => new CardType(2, 2, TOOL, [BERRY, MEAT], TOOL),
    ],

    GREEN => [
        1 => new CardType(2, 3, HOUSE, [MEAT, FLINT, SKIN], GREEN),
        2 => new CardType(2, 2, HOUSE, [FLINT, SKIN], GREEN),
        3 => new CardType(1, 4, STORAGE, [MEAT, MEAT], BERRY),
        4 => new CardType(1, 3, STORAGE, [FLINT], BERRY),
        5 => new CardType(2, 2, STORAGE, [MEAT], BERRY),
        6 => new CardType(3, 1, STORAGE, [], BERRY),
        7 => new CardType(1, 3, STORAGE, [MEAT], DIFFERENT),
        8 => new CardType(1, 2, STORAGE, [], DIFFERENT),
        9 => new CardType(3, 5, HUMAN, [MEAT, SKIN]),
        10 => new CardType(3, 7, HUMAN, [MEAT, FLINT, FLINT]),
        11 => new CardType(2, 11, HUMAN, [MEAT, FLINT, SKIN]),
        12 => new CardType(2, 3, TOOL, [MEAT, MEAT, FLINT, FLINT], HUMAN),
    ],

    RED => [
        1 => new CardType(2, 3, HOUSE, [BERRY, FLINT, SKIN], RED),
        2 => new CardType(2, 2, HOUSE, [BERRY, SKIN], RED),
        3 => new CardType(1, 4, STORAGE, [BERRY, BERRY], MEAT),
        4 => new CardType(2, 3, STORAGE, [FLINT], MEAT),
        5 => new CardType(1, 2, STORAGE, [], MEAT),
        6 => new CardType(3, 10, HUMAN, [DISCARD, FLINT, FLINT]),
        7 => new CardType(2, 7, HUMAN, [DISCARD, SKIN]),
        8 => new CardType(1, 13, HUMAN, [DISCARD, BERRY, FLINT]),
        9 => new CardType(3, 11, HUMAN, [DISCARD, BERRY, BERRY, FLINT]),
        10 => new CardType(1, 18, HUMAN, [DISCARD, BERRY, BERRY, FLINT, SKIN]),
        11 => new CardType(2, 16, HUMAN, [DISCARD, FLINT, SKIN, SKIN]),
        12 => new CardType(3, 2, TOOL, [BERRY, BERRY, SKIN], HUMAN),

    ],

    PURPLE => [
        1 => new CardType(2, 4, HOUSE, [BERRY, MEAT, FLINT, SKIN], PURPLE),
        2 => new CardType(1, 3, HOUSE, [BERRY, FLINT], PURPLE),
        3 => new CardType(3, 4, HOUSE, [SKIN, SKIN], YELLOW),
        4 => new CardType(2, 4, HOUSE, [FLINT, FLINT], BLUE),
        5 => new CardType(3, 4, HOUSE, [MEAT, MEAT, MEAT], RED),
        6 => new CardType(2, 4, HOUSE, [BERRY, BERRY, BERRY], GREEN),
        7 => new CardType(1, 7, HUMAN, [BERRY, BERRY, SKIN, SKIN]),
        8 => new CardType(1, 9, HUMAN, [MEAT, MEAT, FLINT]),
        9 => new CardType(2, 3, HUMAN, [BERRY]),
        10 => new CardType(1, 6, HUMAN, [FLINT]),
        11 => new CardType(3, 2, HUMAN, [DISCARD]),
        12 => new CardType(2, 2, TOOL, [BERRY, MEAT, MEAT], TOOL),
    ],
];
