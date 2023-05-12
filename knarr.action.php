<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Knarr implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * knarr.action.php
 *
 * Knarr main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/knarr/knarr/myAction.html", ...)
 *
 */
  
  
  class action_knarr extends APP_GameAction
  { 
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "knarr_knarr";
            self::trace( "Complete reinitialization of board game" );
      }
  	} 

    public function goTrade() {
        self::setAjaxMode();     

        $this->game->goTrade();

        self::ajaxResponse();
    } 

    public function playCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->playCard($id);

        self::ajaxResponse();
    }

    public function takeDestination() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->takeDestination($id);

        self::ajaxResponse();
    }

    public function payDestination() {
        self::setAjaxMode();   

        $idsStr = self::getArg( "ids", AT_numberlist, true );
        $ids = array_map(fn($str) => intval($str), explode(',', $idsStr));
        $recruits = self::getArg("recruits", AT_posint, true);
        $this->game->payDestination($ids, $recruits);

        self::ajaxResponse();
    }

    public function trade() {
        self::setAjaxMode();     

        $number = self::getArg("number", AT_posint, true);
        $this->game->trade($number);

        self::ajaxResponse();
    }

    public function cancel() {
        self::setAjaxMode();     

        $this->game->cancel();

        self::ajaxResponse();
    }

    public function endTurn() {
        self::setAjaxMode();     

        $this->game->endTurn();

        self::ajaxResponse();
    }
  }
  

