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
  * knarr.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once(APP_GAMEMODULE_PATH.'module/table/table.game.php');

require_once('modules/php/objects/card.php');
require_once('modules/php/objects/token.php');
require_once('modules/php/objects/player.php');
require_once('modules/php/objects/undo.php');
require_once('modules/php/constants.inc.php');
require_once('modules/php/utils.php');
require_once('modules/php/actions.php');
require_once('modules/php/states.php');
require_once('modules/php/args.php');
require_once('modules/php/debug-util.php');

class Knarr extends Table {
    use UtilTrait;
    use ActionTrait;
    use StateTrait;
    use ArgsTrait;
    use DebugUtilTrait;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels([
            LAST_TURN => LAST_TURN,
            SELECTED_CARD => SELECTED_CARD,

            VARIANT_OPTION => VARIANT_OPTION,
        ]);   
		
        $this->cards = $this->getNew("module.common.deck");
        $this->cards->init("card");
        $this->cards->autoreshuffle = false;     
		
        $this->tokens = $this->getNew("module.common.deck");
        $this->tokens->init("token");
        $this->tokens->autoreshuffle = true;   
	}
	
    protected function getGameName() {
		// Used for translations and stuff. Please do not modify.
        return "knarr";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = []) {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_chief) VALUES ";
        $values = [];

        $affectedChiefs = [];
        $chiefs = [1, 2, 3, 4];

        for ($i = 0; $i < count($players); $i++) {
            $index = bga_rand(1, count($chiefs)) - 1;
            $affectedChiefs[] = $chiefs[$index];
            array_splice($chiefs, $index, 1);
        }
        $chiefsInPlay = $affectedChiefs;

        $startingPlayerId = null;
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );
            $chief = array_shift( $affectedChiefs );

            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."', $chief)";
            if ($chief == min($chiefsInPlay)) {
                $startingPlayerId = $player_id;
            }
        }
        $sql .= implode(',', $values);
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue(LAST_TURN, 0);
        $this->setGameStateInitialValue(SELECTED_CARD, -1);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'roundNumber', 0);
        foreach(['table', 'player'] as $type) {
            foreach([
                "playedCards", "playedCards1", "playedCards2", "playedCards3", "playedCards4",
                "collectedResources", "collectedResources1", "collectedResources2", "collectedResources3", "collectedResources4", "collectedResources5",
                "pointCards1", "pointCards2", "pointCards3", "pointCards4",
                "sacrifices", "discardedResourcesEndOfTurn", "collectedResourcesFromFire",
            ] as $name) {
                $this->initStat($type, $name, 0);
            }
        }

        // setup the initial game situation here
        $this->setupCards(count($players));
        $this->setupTokens(count($players));
       

        // Activate first player (which is in general a good idea :) )
        $this->gamestate->changeActivePlayer($startingPlayerId);

        // TODO TEMP
        //$this->debugSetup();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas() {
        $result = [];
    
        $currentPlayerId = intval(self::getCurrentPlayerId());    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_chief chief FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );
  
        // Gather all information about current game situation (visible by player $current_player_id).

        $isEndScore = intval($this->gamestate->state_id()) >= ST_END_SCORE;
        
        foreach($result['players'] as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
            $player['chief'] = intval($player['chief']);
            $player['played'] = $this->getPlayedCardWithStoredResources($playerId);
            $player['tokens'] = $this->getTokensByLocation('player', $playerId);
            $player['handCount'] = intval($this->cards->countCardInLocation('hand', $playerId));

            if ($currentPlayerId == $playerId) {
                $player['hand'] = $this->getCardsByLocation('hand', $playerId);
            }
        }
        
        $centerTokens = [];
        $centerTokensCount = [];
        for ($pile=0; $pile<6; $pile++) {
            $centerCards[$pile] = $this->getCardFromDb($this->cards->getCardOnTop('pile'.$pile));
            $centerCardsCount[$pile] = intval($this->cards->countCardInLocation('pile'.$pile));
            $centerTokens[$pile] = $this->getTokenFromDb($this->tokens->getCardOnTop('pile'.$pile));
            $centerTokensCount[$pile] = intval($this->tokens->countCardInLocation('pile'.$pile));
        }
        $result['centerCards'] = $this->getCardsByLocation('slot');
        $result['centerTokens'] = $centerTokens;
        $result['centerTokensCount'] = $centerTokensCount;
        $result['fireToken'] = Token::onlyId($this->getTokenFromDb($this->tokens->getCardOnTop('center')));
        $result['fireTokenCount'] = intval($this->tokens->countCardInLocation('center'));
        $result['chieftainOption'] = $this->getVariantOption();

        $result['lastTurn'] = !$isEndScore && boolval($this->getGameStateValue(LAST_TURN));
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        $max = $this->CENTER_RESOURCES_BY_PLAYER_COUNT[count($this->getPlayersIds())];
        $current = intval($this->tokens->countCardInLocation('center'));
        return ($max - $current) * 100 / $max;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player )
    {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState( "next" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            $playerId = intval($active_player);
            // randomly play a card
            $playerHand = $this->getCardsByLocation('hand', $playerId);
            $id = $playerHand[bga_rand(0, count($playerHand) - 1)]->id;

            $this->setPlayerSelectedCard($playerId, $id);

            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, 'next');
            
            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb( $from_version )
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
