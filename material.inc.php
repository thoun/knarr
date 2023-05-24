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
require_once(__DIR__.'/modules/php/objects/destination.php');
require_once(__DIR__.'/modules/php/objects/card.php');

$this->VP_BY_REPUTATION = [
    3 => 1,
    6 => 2,
    10 => 3,
    14 => 5,
];

$this->DESTINATIONS = [
    // A
    1 => new DestinationType([DIFFERENT => 3], [RECRUIT => 1, REPUTATION => 1, CARD => 1], [null, VP, null]),
    2 => new DestinationType([DIFFERENT => 3], [BRACELET => 1, REPUTATION => 1, CARD => 1], [null, VP, null]),
    3 => new DestinationType([DIFFERENT => 3], [BRACELET => 1, RECRUIT => 1, CARD => 1], [null, VP, null]),
    4 => new DestinationType([DIFFERENT => 3], [BRACELET => 1], [VP, REPUTATION, RECRUIT]),
    5 => new DestinationType([DIFFERENT => 3], [BRACELET => 1], [VP, REPUTATION, RECRUIT]),
    6 => new DestinationType([PURPLE => 2], [BRACELET => 1, CARD => 1], [null, VP, CARD]),
    7 => new DestinationType([PURPLE => 2], [CARD => 1], [CARD, null, VP]),
    8 => new DestinationType([PURPLE => 2], [CARD => 1], [VP, CARD, null]),
    9 => new DestinationType([BLUE => 2], [REPUTATION => 2], [null, VP, REPUTATION]),
    10 => new DestinationType([BLUE => 2], [RECRUIT => 1, REPUTATION => 1], [REPUTATION, null, VP]),
    11 => new DestinationType([BLUE => 2], [BRACELET => 1, REPUTATION => 1], [null, REPUTATION, VP]),
    12 => new DestinationType([GREEN => 2], [BRACELET => 1, RECRUIT => 1], [VP, null, RECRUIT]),
    13 => new DestinationType([GREEN => 2], [RECRUIT => 1], [RECRUIT, VP, null]),
    14 => new DestinationType([GREEN => 2], [RECRUIT => 2], [null, RECRUIT, null]),
    15 => new DestinationType([YELLOW => 2], [], [VP, VP, VP]),
    16 => new DestinationType([YELLOW => 2], [REPUTATION => 1], [VP, VP, null]),
    17 => new DestinationType([YELLOW => 2], [RECRUIT => 1], [VP, VP, null]),
    18 => new DestinationType([RED => 2], [BRACELET => 1, CARD => 1], [VP, null, VP]),
    19 => new DestinationType([RED => 2], [BRACELET => 1, REPUTATION => 1], [VP, null, VP]),
    20 => new DestinationType([RED => 2], [BRACELET => 1], [VP, VP, null]),
    // B
    21 => new DestinationType([EQUAL => 4], [VP => 5, RECRUIT => 1], [null, null, VP]),
    22 => new DestinationType([EQUAL => 4], [VP => 5, REPUTATION => 1], [null, null, VP]),
    23 => new DestinationType([EQUAL => 4], [VP => 5, BRACELET => 1], [null, null, VP]),
    24 => new DestinationType([RED => 1, YELLOW => 1, GREEN => 1, BLUE => 1, PURPLE => 1], [VP => 4, BRACELET => 1, RECRUIT => 1, REPUTATION => 1, CARD => 1], [null, null, VP]),
    25 => new DestinationType([RED => 1, YELLOW => 1, GREEN => 1, BLUE => 1, PURPLE => 1], [VP => 4, BRACELET => 1, RECRUIT => 1, REPUTATION => 1, CARD => 1], [null, null, VP]),
    26 => new DestinationType([PURPLE => 2, YELLOW => 2], [VP => 6], [null, VP, null]),
    27 => new DestinationType([PURPLE => 3, RED => 2], [VP => 8, CARD => 1], [null, null, VP]),
    28 => new DestinationType([BLUE => 2, RED => 2], [VP => 6], [null, VP, null]),
    29 => new DestinationType([BLUE => 3, PURPLE => 2], [VP => 7, REPUTATION => 2], [null, null, VP]),
    30 => new DestinationType([GREEN => 2, PURPLE => 2], [VP => 6], [null, VP, null]),
    31 => new DestinationType([GREEN => 3, BLUE => 2], [VP => 8, RECRUIT => 1], [null, null, VP]),
    32 => new DestinationType([YELLOW => 2, BLUE => 2], [VP => 6], [null, VP, null]),
    33 => new DestinationType([YELLOW => 3, GREEN => 2], [VP => 9], [null, null, VP]),
    34 => new DestinationType([RED => 2, GREEN => 2], [VP => 6], [null, VP, null]),
    35 => new DestinationType([RED => 3, YELLOW => 2], [VP => 7, BRACELET => 1], [null, null, VP]),
];

$this->CARDS = [    
    new CardType(BLUE, VP, [2 => 2, 3 => 3, 4 => 4]),
    new CardType(BLUE, BRACELET, [2 => 1, 3 => 2, 4 => 2]),
    new CardType(BLUE, RECRUIT, [2 => 1, 3 => 1, 4 => 1]),
    new CardType(BLUE, REPUTATION, [2 => 2, 3 => 2, 4 => 3]),

    new CardType(YELLOW, VP, [2 => 3, 3 => 4, 4 => 5]),
    new CardType(YELLOW, BRACELET, [2 => 1, 3 => 1, 4 => 2]),
    new CardType(YELLOW, RECRUIT, [2 => 0, 3 => 1, 4 => 1]),
    new CardType(YELLOW, REPUTATION, [2 => 2, 3 => 2, 4 => 2]),

    new CardType(PURPLE, VP, [2 => 1, 3 => 2, 4 => 4]),
    new CardType(PURPLE, BRACELET, [2 => 2, 3 => 2, 4 => 2]),
    new CardType(PURPLE, RECRUIT, [2 => 2, 3 => 2, 4 => 2]),
    new CardType(PURPLE, REPUTATION, [2 => 1, 3 => 2, 4 => 2]),

    new CardType(GREEN, VP, [2 => 2, 3 => 3, 4 => 4]),
    new CardType(GREEN, BRACELET, [2 => 1, 3 => 1, 4 => 2]),
    new CardType(GREEN, RECRUIT, [2 => 2, 3 => 3, 4 => 3]),
    new CardType(GREEN, REPUTATION, [2 => 1, 3 => 1, 4 => 1]),

    new CardType(RED, VP, [2 => 3, 3 => 3, 4 => 4]),
    new CardType(RED, BRACELET, [2 => 2, 3 => 3, 4 => 3]),
    new CardType(RED, RECRUIT, [2 => 1, 3 => 1, 4 => 2]),
    new CardType(RED, REPUTATION, [2 => 0, 3 => 1, 4 => 1]),
];
