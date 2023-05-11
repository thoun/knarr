<?php

/*
 * Destination types
 */
define('A', 'A');
define('B', 'B');

/*
 * Color
 */
define('DIFFERENT', 0);
define('BLUE', 1);
define('YELLOW', 2);
define('GREEN', 3);
define('RED', 4);
define('PURPLE', 5);

/*
 * Gain
 */
define('VP', 1);
define('BRACELET', 2);
define('RECRUIT', 3);
define('FAME', 4);
define('CARD', 5);

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_SCORE_FAME', 10);

define('ST_PLAYER_PLAY_ACTION', 20);

define('ST_PLAYER_TRADE', 50);

define('ST_NEXT_PLAYER', 80);

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Constants
 */
define('LAST_TURN', 10);
define('ACTION_DONE', 11);
define('TRADE_DONE', 12);

/*
 * Options
 */
define('BOAT_SIDE_OPTION', 100);
define('VARIANT_OPTION', 110);

/*
 * Global variables
 */
define('UNDO', 'undo');
define('POWER_SKIP_RESSOURCE', 'skipResource');
define('POWER_EMPTY_PILE', 'emptyPileTakeCard');
define('POWER_PAY_ONE_LESS', 'payOneLess');

?>
