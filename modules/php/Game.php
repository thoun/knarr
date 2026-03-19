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
//declare(strict_types=1);

namespace Bga\Games\Knarr;

use Bga\GameFramework\Components\Counters\PlayerCounter;
use Bga\GameFramework\NotificationMessage;
use Bga\GameFramework\Table;
use Destination;
use KnarrPlayer;

require_once('objects/card.php');
require_once('objects/destination.php');
require_once('objects/player.php');
require_once('objects/undo.php');
require_once('constants.inc.php');

class Game extends Table {
    use DebugUtilTrait;

    public VikingManager $vikingManager;
    public DestinationManager $destinationManager;
    public PlayerCounter $playerCoin;

    public array $VP_BY_REPUTATION;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        $this->playerCoin = $this->bga->counterFactory->createPlayerCounter('coin', 0, 3);
        
        $this->initGameStateLabels([
            LAST_TURN => LAST_TURN,
            RECRUIT_DONE => RECRUIT_DONE,
            EXPLORE_DONE => EXPLORE_DONE,
            TRADE_DONE => TRADE_DONE,
            GO_DISCARD_TABLE_CARD => GO_DISCARD_TABLE_CARD,
            GO_RESERVE => GO_RESERVE,
            PLAYED_CARD_COLOR => PLAYED_CARD_COLOR,
            SELECTED_DESTINATION => SELECTED_DESTINATION,
            COMPLETED_LINES => COMPLETED_LINES,

            BOAT_SIDE_OPTION => BOAT_SIDE_OPTION,
        ]);   
		
        $this->vikingManager = new VikingManager($this);
        $this->destinationManager = new DestinationManager($this);

        $this->VP_BY_REPUTATION = [
            3 => 1,
            6 => 2,
            10 => 3,
            14 => 5,
        ];
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
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_name) VALUES ";
        $values = [];

        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );

            $values[] = "('".$player_id."','$color','".addslashes( $player['player_name'] )."')";
        }
        $sql .= implode(',', $values);
        $this->DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        $this->reloadPlayersBasicInfos();
        $playerIds = array_keys($players);
        
        /************ Start the game initialization *****/
        $variantOption = $this->getVariantOption();
        $skaliExpansion = $this->isSkaliExpansion();
        $this->playerCoin->initDb($playerIds, $skaliExpansion ? 1 : 0);

        if ($this->getBoatSideOption() == 3) {
            $this->setGameStateValue(BOAT_SIDE_OPTION, bga_rand(1, 2));
        }

        // Init global values with their initial values
        $this->setGameStateInitialValue(LAST_TURN, 0);
        $this->setGameStateInitialValue(RECRUIT_DONE, 0);
        $this->setGameStateInitialValue(EXPLORE_DONE, 0);
        $this->setGameStateInitialValue(TRADE_DONE, 0);
        $this->setGameStateInitialValue(PLAYED_CARD_COLOR, 0);
        $this->setGameStateInitialValue(GO_DISCARD_TABLE_CARD, 0);
        $this->setGameStateInitialValue(GO_RESERVE, 0);
        
        // Init game statistics
        $this->tableStats->init('roundNumber', 0);
        $this->playerStats->init([
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
            ], 0, updateTableStat: true);
        if ($variantOption >= 2) {
            $this->playerStats->init([
                // artifacts
                "activatedArtifacts",
            ], 0, updateTableStat: true);
        }
        if ($skaliExpansion) {
            $this->playerStats->init(["assetsCollectedByPlayedCards6", "assetsCollectedByDestination6", "assetsCollectedByTrade6", "coinsMissed",], 0, updateTableStat: true);
        }

        // setup the initial game situation here
        $this->vikingManager->setupCards($playerIds);
        $this->destinationManager->setupDestinations();
        if ($variantOption >= 2) {
            $this->setupArtifacts($variantOption, count($players));
        }

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        return \ST_SCORE_REPUTATION;
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas(int $currentPlayerId): array {
        $result = [];
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_reputation reputation, player_recruit recruit, player_bracelet bracelet FROM player ";
        $result['players'] = $this->getCollectionFromDb( $sql );
        $this->playerCoin->fillResult($result, 'coin');
  
        // Gather all information about current game situation (visible by player $current_player_id).

        $firstPlayerId = null;
        $isEndScore = $this->gamestate->getCurrentMainStateId() >= ST_END_SCORE;

        $result['skaliExpansion'] = $this->isSkaliExpansion();
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
            $player['coin'] = intval($player['coin']);
            $player['playedCards'] = [];
            foreach ([1,2,3,4,5] as $color) {
                $player['playedCards'][$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
            }
            $player['destinations'] = $this->getDestinationsByLocation('played'.$playerId);
            //$player['handCount'] = intval($this->vikingManager->cards->countCardInLocation('hand', $playerId));

            if ($currentPlayerId == $playerId) {
                $player['hand'] = $this->getCardsByLocation('hand', $playerId);
            }

            if ($result['reservePossible']) {
                $player['reservedDestinations'] = $this->getDestinationsByLocation('reserved', $playerId);
            }
        }

        $result['cardDeckTop'] = $this->vikingManager->getCardDeckTop();
        $result['cardDeckCount'] = $this->vikingManager->getCardDeckCount();
        $result['cardDiscardCount'] = $this->vikingManager->getCardDiscardCount();
        $result['centerCards'] = $this->getCardsByLocation('slot');
        $result['centerDestinationsDeckTop'] = [];
        $result['centerDestinationsDeckCount'] = [];
        $result['centerDestinations'] = [];

        foreach (['A', 'B'] as $letter) {
            $result['centerDestinationsDeckTop'][$letter] = $this->destinationManager->getDestinationDeckTop($letter);
            $result['centerDestinationsDeckCount'][$letter] = $this->destinationManager->getDestinationDeckCount($letter);
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

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_findIndex(array $array, callable $fn) {
        $index = 0;
        foreach ($array as $value) {
            if($fn($value)) {
                return $index;
            }
            $index++;
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function deleteGlobalVariables(array $names) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` in (".implode(',', array_map(fn($name) => "'$name'", $names)).")");
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getRoundCardCount() {
        return count($this->getPlayersIds()) + 2;
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayer(int $id) {
        $sql = "SELECT * FROM player WHERE player_id = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new KnarrPlayer($dbResult, $this->playerCoin->get($id)), array_values($dbResults))[0];
    }

    function isSkaliExpansion(): bool {
        return $this->bga->tableOptions->get(101) === 1;
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->bga->playerScore->inc($playerId, $amount, null);
        }
            
        $this->bga->notify->all('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->score,
            'incScore' => $amount,
        ] + $args);

        $this->checkMaxScore($playerId);
    }

    function checkMaxScore(int $playerId) {
        if (!boolval($this->getGameStateValue(LAST_TURN)) && $this->getPlayer($playerId)->score >= 40) {
            $this->setGameStateValue(LAST_TURN, 1);

            $this->bga->notify->all('lastTurn', clienttranslate('${player_name} reached 40 Victory Points, triggering the end of the game!'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);
        }
    }

    function incPlayerRecruit(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_recruit` = `player_recruit` + $amount WHERE player_id = $playerId");
        }

        $this->bga->notify->all('recruit', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->recruit,
            'incScore' => $amount,
        ] + $args);
    }

    function incPlayerBracelet(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_bracelet` = `player_bracelet` + $amount WHERE player_id = $playerId");
        }

        $this->bga->notify->all('bracelet', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->bracelet,
            'incScore' => $amount,
        ] + $args);
    }

    function incPlayerCoin(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $notificationMessage = $message !== '' ? new NotificationMessage($message, [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ] + $args) : null;
            $this->playerCoin->inc($playerId, $amount, $notificationMessage);
        }
    }

    function getCardsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        return $this->vikingManager->getCardsByLocation($location, $location_arg, $type, $number);
    }

    function getDestinationsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        return $this->destinationManager->getDestinationsByLocation($location, $location_arg, $type, $number);
    }

    function getBoatSideOption(): int {
        return $this->bga->tableOptions->get(BOAT_SIDE_OPTION);
    }

    function getVariantOption(): int {
        return $this->bga->tableOptions->get(VARIANT_OPTION);
    }

    function getBoatGain() {
        return $this->getBoatSideOption() == 2 ? [VP, null, BRACELET] : [null, RECRUIT, null];
    } 
    
    function argPlayAction(int $activePlayerId): array {
        $player = $this->getPlayer($activePlayerId);

        $bracelets = $player->bracelet;
        $recruits = $player->recruit;

        $playedCardsColors = $this->getPlayedCardsColor($activePlayerId);

        $recruitDone = boolval($this->getGameStateValue((string)RECRUIT_DONE));
        $exploreDone = boolval($this->getGameStateValue((string)EXPLORE_DONE));
        $tradeDone = boolval($this->getGameStateValue((string)TRADE_DONE));

        $possibleDestinations = [];
        if (!$exploreDone) {
            $possibleDestinations = array_merge(
                $this->getDestinationsByLocation('slotA'),
                $this->getDestinationsByLocation('slotB'),
                $this->getDestinationsByLocation('reserved', $activePlayerId),
            );

            $possibleDestinations = array_values(array_filter($possibleDestinations, fn($destination) => $this->canTakeDestination($destination, $playedCardsColors, $recruits, false)));
        }

        return [
            'possibleDestinations' => $possibleDestinations,
            'canRecruit' => !$recruitDone,
            'canExplore' => !$exploreDone,
            'canTrade' => !$tradeDone && $bracelets > 0,
        ];
    }
    
    function redirectAfterAction(int $playerId, bool $checkArtifacts) {
        if ($checkArtifacts && $this->getVariantOption() >= 2) {
            $this->checkArtifacts($playerId);
        }

        if (boolval($this->getGameStateValue(GO_RESERVE))) {
            $this->incGameStateValue(GO_RESERVE, -1);
            $this->setGameStateValue(PLAYED_CARD_COLOR, 0);
            $reserved = $this->getDestinationsByLocation('reserved', $playerId);
            if (count($reserved) >= 2) {
                $this->bga->notify->all('log', clienttranslate('${player_name} cannot reserve a destination because he already has 2'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                ]);
            } else {
                $this->gamestate->nextState('reserve');
                return;
            }
        }
        if (boolval($this->getGameStateValue(GO_DISCARD_TABLE_CARD))) {
            $this->incGameStateValue(GO_DISCARD_TABLE_CARD, -1);
            $this->gamestate->nextState('discardTableCard');
            return;
        }

        $args = $this->argPlayAction($playerId);

        $canPlay = $args['canRecruit'] || $args['canExplore'] || $args['canTrade'];

        if ($canPlay) {
            $this->gamestate->nextState('next');
        } else {
            $endTurn = $this->checkEndTurnArtifacts($playerId);

            $this->gamestate->nextState(!$endTurn ? 'next' : 'endTurn');
        }
    }
    
    function groupGains(array $gains) {
        $groupGains = [];

        foreach ($gains as $gain) {
            if (array_key_exists($gain, $groupGains)) {
                $groupGains[$gain] += 1;
            } else {
                $groupGains[$gain] = 1;
            }
        }

        return $groupGains;
    }
    
    function gainResources(int $playerId, array $groupGains, string $phase) {
        $player = $this->getPlayer($playerId);

        $effectiveGains = [];

        foreach ($groupGains as $type => $amount) {
            switch ($type) {
                case VP: 
                    $effectiveGains[VP] = $amount;
                    $this->bga->playerScore->inc($playerId, $effectiveGains[VP], null);
                    $this->checkMaxScore($playerId);
                    break;
                case BRACELET: 
                    $effectiveGains[BRACELET] = min($amount, 3 - $player->bracelet);
                    $this->DbQuery("UPDATE player SET `player_bracelet` = `player_bracelet` + ".$effectiveGains[BRACELET]." WHERE player_id = $playerId");

                    if ($effectiveGains[BRACELET] < $amount) {
                        $this->bga->playerStats->inc('braceletsMissed', $amount - $effectiveGains[BRACELET], $playerId, updateTableStat: true);
                    }
                    break;
                case RECRUIT:
                    $effectiveGains[RECRUIT] = min($amount, 3 - $player->recruit);
                    $this->DbQuery("UPDATE player SET `player_recruit` = `player_recruit` + ".$effectiveGains[RECRUIT]." WHERE player_id = $playerId");

                    if ($effectiveGains[RECRUIT] < $amount) {
                        $this->bga->playerStats->inc('recruitsMissed', $amount - $effectiveGains[RECRUIT], $playerId, updateTableStat: true);
                    }
                    break;
                case COIN:
                    $effectiveGains[COIN] = min($amount, 3 - $player->coin);
                    if ($effectiveGains[COIN] > 0) {
                        $this->playerCoin->inc($playerId, $effectiveGains[COIN], null);
                    }

                    if ($effectiveGains[COIN] < $amount) {
                        $this->bga->playerStats->inc('coinsMissed', $amount - $effectiveGains[COIN], $playerId, updateTableStat: true);
                    }
                    break;
                case REPUTATION:
                    $effectiveGains[REPUTATION] = min($amount, 14 - $player->reputation);
                    $this->DbQuery("UPDATE player SET `player_reputation` = `player_reputation` + ".$effectiveGains[REPUTATION]." WHERE player_id = $playerId");
                    break;
                case CARD: 
                    $available = $this->getAvailableDeckCards();
                    $effectiveGains[CARD] = min($amount, $available);
                    for ($i = 0; $i < $effectiveGains[CARD]; $i++) {
                        $this->powerTakeCard($playerId);
                    }
                    if ($effectiveGains[CARD] < $amount) {
                        $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, [
                            'playerId' => $playerId,
                            'phase' => $phase,
                            'remaining' => $amount - $effectiveGains[CARD],
                        ]);
                    }
                    break;
            }
        }

        return $effectiveGains;
    }

    function argChooseNewCard(int $playerId) {
        $player = $this->getPlayer($playerId);

        $freeColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
        $centerCards = $this->getCardsByLocation('slot');

        $allFree = false;
        if ($this->getVariantOption() >= 2) {
            $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];
            if (in_array(ARTIFACT_CAULDRON, $artifacts)) {
                $playedCardColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->getPlayedCardsColor($playerId);
                    $allFree = $playedCardsColors[$playedCardColor] == 2;

                    $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                }
            }
        }

        return [
            'centerCards' => $centerCards,
            'freeColor' => $freeColor,
            'recruits' => $player->recruit,
            'allFree' => $allFree,
        ];
    }

    function canTakeDestination(Destination $destination, array $playedCardsColors, int $recruits, bool $strict) {
        $missingCards = 0;

        foreach ($destination->cost as $color => $required) {
            $available = 0;
            if ($color == EQUAL) {
                $available = max($playedCardsColors);
            } else if ($color == DIFFERENT) {
                $available = count(array_filter($playedCardsColors, fn($count) => $count > 0));
            } else {
                $available = ($playedCardsColors[$color] ?? 0); 
            }

            if ($available < $required) {
                $missingCards += ($required - $available);
            }
        }

        return $strict ? $recruits == $missingCards : $recruits >= $missingCards;
    }

    function getGainName(int $gain) {
        switch ($gain) {
            case VP: return clienttranslate("Victory Point");
            case BRACELET: return clienttranslate("Bracelet");
            case RECRUIT: return clienttranslate("Recruit");
            case REPUTATION: return clienttranslate("Reputation");
            case CARD: return clienttranslate("Card");
            case COIN: return clienttranslate("Coin");
        }
    }

    function getColorName(int $color) {
        switch ($color) {
            case BLUE: return clienttranslate("Blue");
            case YELLOW: return clienttranslate("Yellow");
            case GREEN: return clienttranslate("Green");
            case RED: return clienttranslate("Red");
            case PURPLE: return clienttranslate("Purple");
        }
    }

    function getArtifactName(int $artifact) {
        switch ($artifact) {
            case ARTIFACT_MEAD_CUP: return clienttranslate("Mead Cup");
            case ARTIFACT_SILVER_COIN: return clienttranslate("Silver coin");
            case ARTIFACT_CAULDRON: return clienttranslate("Cauldron");
            case ARTIFACT_GOLDEN_BRACELET: return clienttranslate("Golden bracelet");
            case ARTIFACT_HELMET: return clienttranslate("Helmet");
            case ARTIFACT_AMULET: return clienttranslate("Amulet");
            case ARTIFACT_WEATHERVANE: return clienttranslate("Weathervane");
        }
    }

    function powerTakeCard(int $playerId) {
        $card = $this->vikingManager->pickDeckCard();
        $this->vikingManager->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->vikingManager->cards->countCardInLocation('played'.$playerId.'-'.$card->color)));

        $this->bga->notify->all('takeDeckCard', clienttranslate('${player_name} takes a ${card_color} ${card_type} card from the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardDeckTop' => $this->vikingManager->getCardDeckTop(),
            'cardDeckCount' => $this->vikingManager->getCardDeckCount(),
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

    }

    function getPlayedCardsByColor(int $playerId) {
        $playedCardsByColor = [];
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
        }
        return $playedCardsByColor;
    }

    function getPlayedCardsColor(int $playerId, /*array | null*/ $playedCardsByColor = null) {
        if ($playedCardsByColor === null) {
            $playedCardsByColor = $this->getPlayedCardsByColor($playerId);
        }
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
        }
        return array_map(fn($cards) => count($cards), $playedCardsByColor);
    }

    function setupArtifacts(int $option, int $playerCount) {
        $availableArtifacts = [1, 2, 3, 4, 5, 6, 7];
        $artifacts = [];

        if ($option == 2 && $playerCount == 2) {
            $artifacts[] = array_shift($availableArtifacts);
        }

        $index = bga_rand(1, count($availableArtifacts)) - 1;
        $artifacts[] = $availableArtifacts[$index];
        array_splice($availableArtifacts, $index, 1);

        $this->setGlobalVariable(ARTIFACTS, $artifacts);
    }

    function checkArtifacts(int $playerId) {
        $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];

        foreach ($artifacts as $artifact) {
            $this->checkArtifact($playerId, $artifact);
        }
    }

    function checkEndTurnArtifacts(int $playerId) {
        $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];

        $endTurn = true;

        foreach ($artifacts as $artifact) {
            $result = $this->checkEndTurnArtifact($playerId, $artifact);
            if (!$result) {
                $endTurn = false;
            }
        }

        return $endTurn;
    }

    function getCompletedLines(int $playerId) {
        $playedCardsColors = $this->getPlayedCardsColor($playerId);
        return min($playedCardsColors);
    }

    function completedAPlayedLine(int $playerId) {
        $completedLines = intval($this->getGameStateValue(COMPLETED_LINES));
        return $this->getCompletedLines($playerId) > $completedLines; // completed a line during the turn
    }

    function checkArtifact(int $playerId, int $artifact) {
        switch ($artifact) {
            case ARTIFACT_SILVER_COIN:
                $playedCardColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->getPlayedCardsColor($playerId);
                    if ($playedCardsColors[$playedCardColor] > 3) {
                        $groupGains = [
                            VP => 1,
                        ];
                        $effectiveGains = $this->gainResources($playerId, $groupGains, 'artifact:silver-coins');
    
                        $this->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with artifact ${artifact_name} effect'), [
                            'playerId' => $playerId,
                            'player_name' => $this->getPlayerName($playerId),
                            'effectiveGains' => $effectiveGains,
                            'gains' => $effectiveGains, // for logs
                            'artifact_name' => $this->getArtifactName($artifact), // for logs
                            'i18n' => ['artifact_name'],
                        ]);

                        $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                    }
                }
                break;
            case ARTIFACT_GOLDEN_BRACELET:
                $playedCardColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->getPlayedCardsColor($playerId);
                    if ($playedCardsColors[$playedCardColor] == 3) {
                        $this->setGameStateValue(GO_RESERVE, 1);

                        $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                    }
                }
                break;
        }
        $this->checkEndTurnArtifact($playerId, $artifact);
    }

    function checkEndTurnArtifact(int $playerId, int $artifact) {
        $endTurn = true;
        switch ($artifact) {
            case ARTIFACT_AMULET:
                if ($this->completedAPlayedLine($playerId)) {
                    $this->setGameStateValue(COMPLETED_LINES, $this->getCompletedLines($playerId)); // make sure the bonus turn doesn't retrigger the effect
                    $groupGains = [
                        BRACELET => 1,
                        RECRUIT => 1,
                        REPUTATION => 1,
                    ];
                    $effectiveGains = $this->gainResources($playerId, $groupGains, 'artifact:amulet');

                    $this->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with artifact ${artifact_name} effect'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                        'effectiveGains' => $effectiveGains,
                        'gains' => $effectiveGains, // for logs
                        'artifact_name' => $this->getArtifactName($artifact), // for logs
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                }
                break;
            case ARTIFACT_WEATHERVANE:
                if ($this->completedAPlayedLine($playerId)) {
                    $this->setGameStateValue(EXPLORE_DONE, 0);
                    $this->setGameStateValue(COMPLETED_LINES, $this->getCompletedLines($playerId)); // make sure the bonus turn doesn't retrigger the effectrId)]);

                    $this->bga->notify->all('log', clienttranslate('${player_name} can explore with artifact ${artifact_name} effect'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                        'artifact_name' => $this->getArtifactName($artifact), // for logs
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                    
                    $endTurn = false;
                }
                break;
        }
        return $endTurn;
    }

    function getAvailableDeckCards() {
        return $this->vikingManager->getAvailableDeckCards();
    }

    function getTradeGains(int $playerId, int $bracelets) {
        $destinations = $this->getDestinationsByLocation('played'.$playerId);

        $gains = [];

        $rows = array_merge(
            [$this->getBoatGain()],
            array_map(fn($destination) => $destination->gains, $destinations),
        );
        foreach ($rows as $row) {
            for ($i = 0; $i < $bracelets; $i++) {
                if ($row[$i] !== null) {
                    $gains[] = $row[$i];
                }
            }
        }

        return $gains;
    }

    public function cardDeckAutoReshuffle() {
        $this->bga->notify->all('cardDeckReset', clienttranslate('The card deck has been reshuffled'), [            
            'cardDeckTop' => $this->vikingManager->getCardDeckTop(),
            'cardDeckCount' => $this->vikingManager->getCardDeckCount(),
            'cardDiscardCount' => $this->vikingManager->getCardDiscardCount(),
        ]);
    }

    public function endOfRecruit(int $playerId, int $slotColor) {
        $newTableCard = $this->vikingManager->pickCardToSlot($slotColor);

        $this->bga->notify->all('newTableCard', '', [
            'card' => $newTableCard,
            'cardDeckTop' => $this->vikingManager->getCardDeckTop(),
            'cardDeckCount' => $this->vikingManager->getCardDeckCount() + 1, // to count the new card
        ]);

        $this->setGameStateValue(RECRUIT_DONE, 1);
        $this->setGameStateValue(EXPLORE_DONE, 1);

        $this->redirectAfterAction($playerId, true);
    }    

    public function endExplore(int $playerId, bool $fromReserve, object $destination, int $destinationIndex) {
        if (!$fromReserve) {
            $type = $destination->type == 2 ? 'B' : 'A';
            $newDestination = $this->destinationManager->pickDestinationToSlot($type, $destination->locationArg);

            $this->bga->notify->all('newTableDestination', '', [
                'destination' => $newDestination,
                'letter' => $type,
                'destinationDeckTop' => $this->destinationManager->getDestinationDeckTop($type),
                'destinationDeckCount' => $this->destinationManager->getDestinationDeckCount($type),
            ]);
        }

        $this->setGameStateValue(RECRUIT_DONE, 1);
        $this->setGameStateValue(EXPLORE_DONE, 1);

        if ($this->getVariantOption() >= 2) {
            $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];
            if (in_array(ARTIFACT_HELMET, $artifacts) && $destinationIndex > 0 && $destination->type == 2) {
                $previousDestination = $this->getDestinationsByLocation('played'.$playerId)[$destinationIndex - 1];
                if ($previousDestination->type == 1) {
                    $this->setGameStateValue(RECRUIT_DONE, 0);
                    $this->bga->notify->all('log', clienttranslate('${player_name} can do the recruit action thanks to ${artifact_name} effect'), [
                        'player_name' => $this->getPlayerName($playerId),
                        'artifact_name' => $this->getArtifactName(ARTIFACT_HELMET), // for logs
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                }
            }

            if (in_array(ARTIFACT_MEAD_CUP, $artifacts)) {
                $this->setGameStateValue(GO_DISCARD_TABLE_CARD, 1);

                $this->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
            }
        }

        $this->redirectAfterAction($playerId, true);
    }    

    public function endTrade(int $playerId) {
        $this->setGameStateValue(TRADE_DONE, 1);
        $this->redirectAfterAction($playerId, false);
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
            $this->applyDbUpgradeToAllDB("ALTER TABLE DBPREFIX_player CHANGE COLUMN `player_fame` `player_reputation` tinyint UNSIGNED NOT NULL DEFAULT 0");
        }*/
    }    
}
