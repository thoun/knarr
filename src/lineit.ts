declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'Knarr-zoom';

class Knarr implements KnarrGame {
    public cardsManager: CardsManager;

    private zoomManager: ZoomManager;
    private animationManager: AnimationManager;
    private gamedatas: KnarrGamedatas;
    private tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    private handCounters: Counter[] = [];
    private scoredCounters: Counter[] = [];
    private selectedCardId: number;
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() {
    }
    
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */

    public setup(gamedatas: KnarrGamedatas) {
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.cardsManager = new CardsManager(this);
        this.animationManager = new AnimationManager(this);
        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);

        
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            smooth: false,
            zoomControls: {
                color: 'white',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
        });

        this.setupNotifications();
        this.setupPreferences();

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        log('Entering state: ' + stateName, args.args);

        switch (stateName) {
            case 'chooseMarketCard':
                this.onEnteringChooseMarketCard(args.args);
                break;
            case 'playCard':
            case 'playHandCard':
                this.onEnteringPlayCard(args.args);
                break;
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }
    
    private onEnteringChooseMarketCard(args: EnteringChooseMarketCardArgs) {
        if (args.mustClose) {
            this.setGamestateDescription(`Forced`);
        }
        if ((this as any).isCurrentPlayerActive()) {
            this.selectedCardId = null;
            this.tableCenter.setSelectable(true, args.canAddToHand ? null : args.canPlaceOnLine);
            this.getCurrentPlayerTable()?.setSelectable(true, args.canPlaceOnLine);
        }
    }
    
    private onEnteringPlayCard(args: EnteringPlayCardArgs) {
        if (args.onlyClose) {
            this.setGamestateDescription(`OnlyClose`);
        }
        
        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setSelectable(true, args.canPlaceOnLine);
        }
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
           case 'chooseMarketCard':
                this.selectedCardId = null;
                this.tableCenter.setSelectable(false);
                this.getCurrentPlayerTable()?.setSelectable(false);
                this.getCurrentPlayerTable()?.addCardsPlaceholders(false, false);
                break;
            case 'playCard':
            case 'playHandCard':
                this.getCurrentPlayerTable()?.setSelectable(false);
                break;
        }
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseMarketCard':
                    this.selectedCardId = null;
                    const chooseMarketCardArgs = args as EnteringChooseMarketCardArgs;
                    if (!chooseMarketCardArgs.mustClose) {
                        (this as any).addActionButton(`addLine_button`, `<div class="player-line-card"></div> ` + _("Add selected card to line"), () => this.chooseMarketCardLine());
                        (this as any).addActionButton(`addHand_button`, `<div class="player-hand-card"></div> ` + _("Add selected card to hand"), () => this.chooseMarketCardHand());
                        [`addLine_button`, `addHand_button`].forEach(id => document.getElementById(id).classList.add('disabled'));
                    }

                    if (chooseMarketCardArgs.canClose) {
                        (this as any).addActionButton(`closeLine_button`, _("Close the line"), () => this.closeLine(), null, null, 'red');
                    }
                    break;
                case 'playCard':
                    const playCardArgs = args as EnteringPlayCardArgs;
                    (this as any).addActionButton(`pass_button`, _("Pass"), () => this.pass());
                    if (playCardArgs.canClose) {
                        (this as any).addActionButton(`closeLine_button`, _("Close the line"), () => this.closeLine(), null, null, 'red');
                    }
                    break;
                case 'playHandCard':
                    (this as any).addActionButton(`pass_button`, _("Pass"), () => this.pass());
                    break;
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public setTooltip(id: string, html: string) {
        (this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    public setTooltipToClass(className: string, html: string) {
        (this as any).addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    private getPlayer(playerId: number): KnarrPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }

    private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );
    }

    private getOrderedPlayers(gamedatas: KnarrGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }

    private createPlayerPanels(gamedatas: KnarrGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);   

            // hand + scored cards counter
            dojo.place(`<div class="counters">
                <div id="playerhand-counter-wrapper-${player.id}" class="playerhand-counter">
                    <div class="player-hand-card"></div> 
                    <span id="playerhand-counter-${player.id}"></span> / 2
                </div>
                <div id="scored-counter-wrapper-${player.id}" class="scored-counter">
                    <div class="player-scored-card"></div> 
                    <span id="scored-counter-${player.id}"></span>
                </div>
            </div>`, `player_board_${player.id}`);

            const handCounter = new ebg.counter();
            handCounter.create(`playerhand-counter-${playerId}`);
            handCounter.setValue(player.hand.length);
            this.handCounters[playerId] = handCounter;

            const scoredCounter = new ebg.counter();
            scoredCounter.create(`scored-counter-${playerId}`);
            scoredCounter.setValue(player.scored);
            this.scoredCounters[playerId] = scoredCounter;

            // first player
            dojo.place(`
            <div id="bet-tokens-${player.id}" class="bet-tokens"></div>
            <div id="first-player-token-wrapper-${player.id}" class="first-player-token-wrapper"></div>
            `, `player_board_${player.id}`);

            Object.keys(player.betTokens).forEach(key => {
                const value = Number(key);
                for (let i = 0; i < player.betTokens[key]; i++) {
                    this.addBetToken(playerId, value);
                }
            });

            if (gamedatas.firstPlayerId == playerId) {
                dojo.place(`<div id="first-player-token" class="first-player-token"></div>`, `first-player-token-wrapper-${player.id}`);
            }
        });

        this.setTooltipToClass('playerhand-counter', _('Number of cards in hand'));
        this.setTooltipToClass('scored-counter', _('Number of cards in the score pile'));
    }

    private createPlayerTables(gamedatas: KnarrGamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: KnarrGamedatas, playerId: number) {
        const table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    }

    private addBetToken(playerId: number, value: number) {
        document.getElementById(`bet-tokens-${playerId}`).insertAdjacentHTML('beforeend', `
            <div class="bet-token" data-value="${value}" style="order: ${value}"></div>
        `);
    }

    private incScore(playerId: number, inc: number) {
        (this as any).scoreCtrl[playerId]?.incValue(inc);
    }

    private incScored(playerId: number, inc: number) {
        this.scoredCounters[playerId].incValue(inc);
        this.incScore(playerId, inc);
    }
    

    public onMarketCardClick(card: Card): void {
        const args: EnteringChooseMarketCardArgs = this.gamedatas.gamestate.args;
        if (!args.canAddToHand && !args.canPlaceOnLine.some(s => s.id == card.id)) {
            return;
        }

        this.selectedCardId = card.id;
        const canPlaceCardOnLine = args.canAddToLine && args.canPlaceOnLine.some(s => s.id == card.id);
        const canPlaceCardOnHand = args.canAddToHand;
        document.getElementById(`addLine_button`).classList.toggle('disabled', !canPlaceCardOnLine);
        document.getElementById(`addHand_button`).classList.toggle('disabled', !canPlaceCardOnHand);

        this.getCurrentPlayerTable()?.addCardsPlaceholders(canPlaceCardOnLine, canPlaceCardOnHand);
    }

    public onHandCardClick(card: Card): void {
        if (card.id < 0) {
            this.chooseMarketCardHand();
        } else {
            this.playCardFromHand(card.id);
        }
    }

    public onLineCardClick(card: Card): void {
        if (card.id < 0) {
            this.chooseMarketCardLine();
        }
    }
  	
    public playCardFromHand(id: number) {
        if(!(this as any).checkAction('playCardFromHand')) {
            return;
        }

        this.takeAction('playCardFromHand', {
            id
        });
    }
  	
    public chooseMarketCardLine() {
        if(!(this as any).checkAction('chooseMarketCardLine')) {
            return;
        }
        this.getCurrentPlayerTable()?.addCardsPlaceholders(false, false);

        this.takeAction('chooseMarketCardLine', {
            id: this.selectedCardId,
        });
    }
  	
    public chooseMarketCardHand() {
        if(!(this as any).checkAction('chooseMarketCardHand')) {
            return;
        }
        this.getCurrentPlayerTable()?.addCardsPlaceholders(false, false);

        this.takeAction('chooseMarketCardHand', {
            id: this.selectedCardId,
        });
    }
  	
    public closeLine(confirmed: boolean = false) {
        if (!confirmed && !this.gamedatas.gamestate.args.mustClose) {
            (this as any).confirmationDialog(
                _("Are you sure you want to close this line ?"), 
                () => this.closeLine(true)
            );
            return;
        }

        if(!(this as any).checkAction('closeLine')) {
            return;
        }

        this.takeAction('closeLine');
    }
  	
    public pass() {
        if(!(this as any).checkAction('pass')) {
            return;
        }

        this.takeAction('pass');
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/knarr/knarr/${action}.html`, data, this, () => {});
    }

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );

        const notifs = [
            ['newMarket', ANIMATION_MS],
            ['chooseMarketCardHand', ANIMATION_MS],
            ['jackpotRemaining', 100],
            ['discardRemaining', 100],
            ['newFirstPlayer', ANIMATION_MS],
            ['playCard', ANIMATION_MS],
            ['applyJackpot', ANIMATION_MS * 4],
            ['betResult', ANIMATION_MS],
            ['closeLine', ANIMATION_MS],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_newMarket(notif: Notif<NotifNewMarketArgs>) {
        this.tableCenter.newMarket(notif.args.cards);
        this.tableCenter.setDeck(notif.args.deck);
    }

    notif_chooseMarketCardHand(notif: Notif<NotifChooseMarketCardHandArgs>) {
        if (notif.args.playerId == this.getPlayerId()) {
            this.getPlayerTable(notif.args.playerId).hand.addCard(notif.args.card);
        } else {
            this.tableCenter.market.removeCard(notif.args.card);
        }
        this.handCounters[notif.args.playerId].incValue(1);
    }

    notif_jackpotRemaining(notif: Notif<NotifJackpotRemainingArgs>) {
        this.tableCenter.addJackpotCard(notif.args.card);
    }

    notif_discardRemaining(notif: Notif<NotifJackpotRemainingArgs>) {
        this.tableCenter.market.removeCard(notif.args.card);
    }

    notif_newFirstPlayer(notif: Notif<NotifNewFirstPlayerArgs>) {
        const firstPlayerToken = document.getElementById('first-player-token');
        const destinationId = `first-player-token-wrapper-${notif.args.playerId}`;
        const originId = firstPlayerToken.parentElement.id;
        if (destinationId !== originId) {
            this.animationManager.attachWithSlideAnimation(
                firstPlayerToken,
                document.getElementById(destinationId),
                { zoom: 1 },
            );
        }
    }

    notif_playCard(notif: Notif<NotifPlayCardArgs>) {
        this.getPlayerTable(notif.args.playerId).line.addCard(notif.args.card);
        if (notif.args.fromHand) {
            this.handCounters[notif.args.playerId].incValue(-1);
        }
    }

    notif_applyJackpot(notif: Notif<NotifApplyJackpotArgs>) {
        this.incScored(notif.args.playerId, Number(notif.args.count));
        this.tableCenter.setJackpot(notif.args.color, 0);
        notif.args.lineColorCard.forEach(card => this.cardsManager.getCardElement(card).classList.add('jackpot-animation'));
    }

    notif_betResult(notif: Notif<NotifBetResultArgs>) {
        this.addBetToken(notif.args.playerId, notif.args.value);
        this.incScore(notif.args.playerId, Number(notif.args.value));
    }

    notif_closeLine(notif: Notif<NotifApplyJackpotArgs>) {
        this.getPlayerTable(notif.args.playerId).line.removeAll();
        this.incScored(notif.args.playerId, Number(notif.args.count));
    }


    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (args.cardValue == '' && args.card) {
                    args.cardValue = `<strong data-color="${args.card.color}">${args.card.type == 2 && args.card.number > 0 ? '+' : ''}${args.card.number}</strong>`;
                }
                if (typeof args.colorName == 'string' && args.colorName[0] !== '<' && args.color) {
                    args.colorName = `<div class="jackpot-icon" data-color="${args.color}"></div>`;
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}