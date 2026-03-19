<?php
namespace Bga\Games\Knarr;

use Bga\GameFramework\Bga;

function debug(...$debugData) {
    if (Game::getBgaEnvironment() != 'studio') { 
        return;
    }die('debug data : <pre>'.substr(json_encode($debugData, JSON_PRETTY_PRINT), 1, -1).'</pre>');
}

trait DebugUtilTrait {
    public VikingManager $vikingManager;
    public DestinationManager $destinationManager;

    public Bga $bga;

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //$this->debug_SetPlayerScore(2343492, 10);
        //$this->debug_SetScore(39);
        //$this->debug_SetReputation(8);

        //$this->debug_AddDestinations(2343492, 'A', 15);
        //$this->debug_AddDestinations(2343492, 'B', 10);

        //$this->vikingManager->cards->pickCardsForLocation(13, 'deck', 'void');
        //$this->setGlobalVariable(ARTIFACTS, [ARTIFACT_HELMET]);
        
        //$this->debug_LastTurn();

        $playerId = 2343492;
        for ($i = 0; $i < 5; $i++) {
            $card = $this->vikingManager->getCardOnTopOfDeck();
            $this->vikingManager->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->destinationManager->destinations->countCardInLocation('played'.$playerId.'-'.$card->color)));
        }
        /*$this->debug_Empty();*/
    }

    function debug_SetScore($score) {
		$this->bga->playerScore->setAll($score);
    }
    
    function debug_SetPlayerScore(int $playerId, int $score) {
		$this->bga->playerScore->set($playerId, $score);
    }

    function debug_SetReputation(int $score) {
		$this->DbQuery("UPDATE player SET `player_reputation` = $score");
    }
    
    function debug_SetPlayerReputation(int $playerId, int $score) {
		$this->DbQuery("UPDATE player SET `player_reputation` = $score WHERE player_id = $playerId");
    }

    function debug_LastTurn() {
        $this->setGameStateValue(LAST_TURN, 1);
    }
    
    function debug_Empty() {
		$this->vikingManager->cards->moveAllCardsInLocation('deck', 'void');
        $this->vikingManager->cards->moveAllCardsInLocation('discard', 'void');
    }

    function debug_AddDestinations($playerId, $letter, $number) {
        for ($i = 0; $i < $number; $i++) {
            $destinationIndex = intval($this->destinationManager->destinations->countCardInLocation('played'.$playerId));
            $this->destinationManager->destinations->pickCardForLocation('deck'.$letter, 'played'.$playerId, $destinationIndex);
        }
    }
}
