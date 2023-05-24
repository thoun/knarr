<?php

/*
 * Destination types
 */
define('A', 'A');
define('B', 'B');

/*
 * Color
 */
define('EQUAL', -1);
define('DIFFERENT', 0);
define('RED', 1);
define('YELLOW', 2);
define('GREEN', 3);
define('BLUE', 4);
define('PURPLE', 5);

/*
 * Gain
 */
define('VP', 1);
define('BRACELET', 2);
define('RECRUIT', 3);
define('REPUTATION', 4);
define('CARD', 5);

/*
 * Artifacts
 */
define('ARTIFACT_HYDROMEL_CUP', 1);
define('ARTIFACT_SILVER_COINS', 2);
define('ARTIFACT_CALDRON', 3);
define('ARTIFACT_GOLDEN_BRACELET', 4);
define('ARTIFACT_HELMET', 5);
define('ARTIFACT_AMULET', 6);
define('ARTIFACT_WEATHERCLOCK', 7);

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_SCORE_REPUTATION', 10);

define('ST_PLAYER_PLAY_ACTION', 20);
define('ST_PLAYER_CHOOSE_NEW_CARD', 25);
define('ST_PLAYER_PAY_DESTINATION', 30);

define('ST_PLAYER_RESERVE_DESTINATION', 40);

define('ST_PLAYER_DISCARD_TABLE_CARD', 45);

define('ST_PLAYER_TRADE', 50);

define('ST_MULTIPLAYER_DISCARD_CARD', 70);
define('ST_AFTER_DISCARD_CARD', 71);

define('ST_NEXT_PLAYER', 80);

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Constants
 */
define('LAST_TURN', 10);
define('RECRUIT_DONE', 11);
define('EXPLORE_DONE', 12);
define('TRADE_DONE', 15);
define('GO_DISCARD_TABLE_CARD', 16);
define('GO_RESERVE', 17);
define('PLAYED_CARD_COLOR', 20);
define('SELECTED_DESTINATION', 21);

/*
 * Options
 */
define('BOAT_SIDE_OPTION', 100);
define('VARIANT_OPTION', 110);

/*
 * Global variables
 */
define('ARTIFACTS', 'Artifacts');
define('REMAINING_CARDS_TO_TAKE', 'RemainingCardsToTake');
//define('UNDO', 'undo');

?>
