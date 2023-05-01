<?php

/*
 * Color
 */
define('BLUE', 1);
define('YELLOW', 2);
define('GREEN', 3);
define('RED', 4);
define('PURPLE', 5);

/*
 * Card type
 */
define('HOUSE', 1);
define('STORAGE', 2);
define('HUMAN', 3);
define('TOOL', 4);

define('POWER_CARD', 10);
define('POWER_RESSOURCE', 11);

/*
 * Tokens
 */
define('DISCARD', 0); // special type, only for card resources array
define('DIFFERENT', 0); // special type, only for storage

define('BERRY', 1);
define('MEAT', 2);
define('FLINT', 3);
define('SKIN', 4);
define('BONE', 5);

/*
 * Chief powers
 */

define('CHIEF_POWER_SKIP_RESOURCE', 1);
define('CHIEF_POWER_PAY_ONE_LESS_RESOURCE', 2);
define('CHIEF_POWER_TAKE_CARD', 3);
define('CHIEF_POWER_ADDITIONAL_RESOURCE', 4);

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_PLAYER_TAKE_CARD', 10);
define('ST_PLAYER_SKIP_RESOURCE', 15);
define('ST_PLAYER_TAKE_CARD_CHIEF_POWER', 16);

define('ST_PLAYER_PLAY_CARD', 20);
define('ST_PLAYER_DISCARD_CARD', 21);
define('ST_PLAYER_TAKE_CARD_POWER', 25);
define('ST_PLAYER_CHOOSE_ONE_LESS', 30);

define('ST_PLAYER_DISCARD_TOKENS', 70);

define('ST_NEXT_PLAYER', 80);

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Constants
 */
define('LAST_TURN', 10);
define('SELECTED_CARD', 11);

/*
 * Options
 */
define('CHIEFTAIN_OPTION', 100);

/*
 * Global variables
 */
define('UNDO', 'undo');
define('POWER_SKIP_RESSOURCE', 'skipResource');
define('POWER_EMPTY_PILE', 'emptyPileTakeCard');
define('POWER_PAY_ONE_LESS', 'payOneLess');

?>
