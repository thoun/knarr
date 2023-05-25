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
require_once('modules/php/objects/destination.php');
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
            RECRUIT_DONE => RECRUIT_DONE,
            EXPLORE_DONE => EXPLORE_DONE,
            TRADE_DONE => TRADE_DONE,
            GO_DISCARD_TABLE_CARD => GO_DISCARD_TABLE_CARD,
            GO_RESERVE => GO_RESERVE,
            PLAYED_CARD_COLOR => PLAYED_CARD_COLOR,
            SELECTED_DESTINATION => SELECTED_DESTINATION,

            BOAT_SIDE_OPTION => BOAT_SIDE_OPTION,
            VARIANT_OPTION => VARIANT_OPTION,
        ]);   
		
        $this->cards = $this->getNew("module.common.deck");
        $this->cards->init("card");
        $this->cards->autoreshuffle = true;     
        $this->cards->autoreshuffle_trigger = ['obj' => $this, 'method' => 'cardDeckAutoReshuffle'];
		
        $this->destinations = $this->getNew("module.common.deck");
        $this->destinations->init("destination");
        $this->destinations->autoreshuffle = false;   
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
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = [];

        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );

            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode(',', $values);
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/
        $variantOption = $this->getVariantOption();

        // Init global values with their initial values
        $this->setGameStateInitialValue(LAST_TURN, 0);
        $this->setGameStateInitialValue(RECRUIT_DONE, 0);
        $this->setGameStateInitialValue(EXPLORE_DONE, 0);
        $this->setGameStateInitialValue(TRADE_DONE, 0);
        $this->setGameStateInitialValue(PLAYED_CARD_COLOR, 0);
        $this->setGameStateInitialValue(GO_DISCARD_TABLE_CARD, 0);
        $this->setGameStateInitialValue(GO_RESERVE, 0);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'roundNumber', 0);
        foreach(['table', 'player'] as $type) {
            foreach([
                "reputationPoints", 
                // cards
                "playedCards", 
                "assetsCollectedByPlayedCards", "assetsCollectedByPlayedCards1", "assetsCollectedByPlayedCards2", "assetsCollectedByPlayedCards3", "assetsCollectedByPlayedCards4", 
                "recruitsUsedToChooseCard", "discardedCards",
                // destinations
                "discoveredDestinations", "discoveredDestinations1", "discoveredDestinations2",
                "assetsCollectedByDestination", "assetsCollectedByDestination1", "assetsCollectedByDestination2", "assetsCollectedByDestination3", "assetsCollectedByDestination4", "assetsCollectedByDestination5",
                "recruitsUsedToPayDestination",
                // trade
                "tradeActions", "tradeActions1", "tradeActions2", "tradeActions3", "braceletsUsed",
                "assetsCollectedByTrade", "assetsCollectedByTrade1", "assetsCollectedByTrade2", "assetsCollectedByTrade3", "assetsCollectedByTrade4", "assetsCollectedByTrade5",
                //	miscellaneous
                "recruitsMissed", "braceletsMissed",
            ] as $name) {
                $this->initStat($type, $name, 0);
            }
        }
        if ($variantOption >= 2) {
            foreach(['table', 'player'] as $type) {
                foreach([
                    // artifacts
                    "activatedArtifacts",
                ] as $name) {
                    $this->initStat($type, $name, 0);
                }
            }
        }

        // setup the initial game situation here
        $this->setupCards(array_keys($players));
        $this->setupDestinations();
        if ($variantOption >= 2) {
            $this->setupArtifacts($variantOption, count($players));
        }

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        // TODO TEMP
        $this->debugSetup();

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
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_reputation reputation, player_recruit recruit, player_bracelet bracelet FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );
  
        // Gather all information about current game situation (visible by player $current_player_id).

        $firstPlayerId = null;
        $isEndScore = intval($this->gamestate->state_id()) >= ST_END_SCORE;

        $result['boatSideOption'] = $this->getBoatSideOption();
        $result['variantOption'] = $this->getVariantOption();
        $result['reservePossible'] = false;
        if ($result['variantOption'] >= 2) {
            $result['artifacts'] = $this->getGlobalVariable(ARTIFACTS, true);
            $result['reservePossible'] = in_array(ARTIFACT_GOLDEN_BRACELET, $result['artifacts']);
        }
        
        foreach($result['players'] as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
            if ($player['playerNo'] == 1) {
                $firstPlayerId = $playerId;
            }

            $player['reputation'] = intval($player['reputation']);
            $player['recruit'] = intval($player['recruit']);
            $player['bracelet'] = intval($player['bracelet']);
            $player['playedCards'] = [];
            foreach ([1,2,3,4,5] as $color) {
                $player['playedCards'][$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
            }
            $player['destinations'] = $this->getDestinationsByLocation('played'.$playerId);
            //$player['handCount'] = intval($this->cards->countCardInLocation('hand', $playerId));

            if ($currentPlayerId == $playerId) {
                $player['hand'] = $this->getCardsByLocation('hand', $playerId);
            }

            if ($result['reservePossible']) {
                $player['reservedDestinations'] = $this->getDestinationsByLocation('reserved', $playerId);
            }
        }

        $result['cardDeckTop'] = Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck')));
        $result['cardDeckCount'] = intval($this->cards->countCardInLocation('deck'));
        $result['cardDiscardCount'] = intval($this->cards->countCardInLocation('discard'));
        $result['centerCards'] = $this->getCardsByLocation('slot');
        $result['centerDestinationsDeckTop'] = [];
        $result['centerDestinationsDeckCount'] = [];
        $result['centerDestinations'] = [];

        foreach (['A', 'B'] as $letter) {
            $result['centerDestinationsDeckTop'][$letter] = Destination::onlyId($this->getDestinationFromDb($this->destinations->getCardOnTop('deck'.$letter)));
            $result['centerDestinationsDeckCount'][$letter] = intval($this->destinations->countCardInLocation('deck'.$letter));
            $result['centerDestinations'][$letter] = $this->getDestinationsByLocation('slot'.$letter);
        }

        $result['firstPlayerId'] = $firstPlayerId;
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
        $maxScore = intval($this->getUniqueValueFromDB("SELECT max(`player_score`) FROM player"));
        return $maxScore * 100 / 40;
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
                    $this->gamestate->jumpToState(ST_NEXT_PLAYER);
                    break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
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
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345

        /*if ($from_version <= 2305241900) {
            // ! important ! Use DBPREFIX_<table_name> for all tables
            self::applyDbUpgradeToAllDB("ALTER TABLE DBPREFIX_player CHANGE COLUMN `player_fame` `player_reputation` tinyint UNSIGNED NOT NULL DEFAULT 0");
        }*/
    }    
}
