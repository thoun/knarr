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
 * gameoptions.inc.php
 *
 * Knarr game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in knarr.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

require_once("modules/php/constants.inc.php");

 $game_options = [

    BOAT_SIDE_OPTION => [
        'name' => totranslate('Boat side'),
        'values' => [
            1 => [
                'name' => totranslate('Normal'),
            ],
            2 => [
                'name' => totranslate('Advanced'),
                'tmdisplay' => totranslate('Advanced board side'),
            ],
        ],
        'default' => 1,
    ],

    VARIANT_OPTION => [
        'name' => totranslate('Artefact variant'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled (with Mead Cup for 2-players mode)'),
                'tmdisplay' => totranslate('Artefact variant (with Mead Cup for 2-players mode)'),
            ],
            3 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Artefact variant'),
            ],
        ],
        'default' => 1,
    ],
];