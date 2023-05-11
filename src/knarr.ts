declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'Knarr-zoom';

const VP_BY_FAME = {
    0: 0,
    3: 1,
    6: 2,
    10: 3,
    14: 5,
};

const VP = 1;
const BRACELET = 2;
const RECRUIT = 3;
const FAME = 4;
const CARD = 5;

function getVpByFame(fame: number) {
    return Object.entries(VP_BY_FAME).find(entry => Number(entry[0]) >= fame)[1];
}

class Knarr implements KnarrGame {
    public cardsManager: CardsManager;
    public destinationsManager: DestinationsManager;

    private zoomManager: ZoomManager;
    private animationManager: AnimationManager;
    private gamedatas: KnarrGamedatas;
    private tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    private handCounters: Counter[] = [];
    private fameCounters: Counter[] = [];
    private recruitCounters: Counter[] = [];
    private braceletCounters: Counter[] = [];
    
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
        if (!gamedatas.variantOption) {
            (this as any).dontPreloadImage('artefacts.jpg');
        }
        if (gamedatas.boatSideOption == 2) {
            (this as any).dontPreloadImage('boats-normal.png');
        } else {
            (this as any).dontPreloadImage('boats-advanced.png');
        }

        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);


        this.cardsManager = new CardsManager(this);
        this.destinationsManager = new DestinationsManager(this);
        this.animationManager = new AnimationManager(this);
        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            smooth: false,
            zoomControls: {
                color: 'black',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            onDimensionsChange: () => {
                const tablesAndCenter = document.getElementById('tables-and-center');
                tablesAndCenter.classList.toggle('double-column', tablesAndCenter.clientWidth > 1600);
            },
        });

        if (gamedatas.lastTurn) {
            this.notif_lastTurn(false);
        }

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
            case 'playAction':
                this.onEnteringPlayAction(args.args);
                break;
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }

    private onEnteringPlayAction(args: EnteringPlayActionArgs) {
        if (!args.canDoAction) {
            this.setGamestateDescription('TradeOnly');
        }

        if ((this as any).isCurrentPlayerActive()) {
            //this.getCurrentPlayerTable()?.setCardsSelectable(true, args.playableCards);
        }
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'playAction':
                this.onLeavingPlayAction();
                break;
        }
    }

    private onLeavingPlayAction() {
        //this.getCurrentPlayerTable()?.setCardsSelectable(false);
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'playAction':
                    const playActionArgs = args as EnteringPlayActionArgs;
                    (this as any).addActionButton(`goTrade_button`, _("Trade"), () => this.goTrade());
                    if (!playActionArgs.canTrade) {
                        document.getElementById(`goTrade_button`).classList.add('disabled');
                    }
                    if (!args.canDoAction) {
                        (this as any).addActionButton(`endTurn_button`, _("End turn"), () => this.endTurn());
                    }
                    break;
                case 'trade':
                    const tradeArgs = args as EnteringTradeArgs;
                    [1, 2, 3].forEach(number => {
                        (this as any).addActionButton(`trade${number}_button`, _("Trade ${number} bracelets").replace('${number}', number), () => this.trade(number));
                        if (tradeArgs.bracelets < number) {
                            document.getElementById(`trade${number}_button`).classList.add('disabled');
                        }
                    });
                    (this as any).addActionButton(`cancel_button`, _("Cancel"), () => this.cancel(), null, null, 'gray');
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

    public getPlayer(playerId: number): KnarrPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    public getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }

    public getBoatSide(): number {
        return this.gamedatas.boatSideOption;
    }

    public getVariantOption(): number {
        return this.gamedatas.variantOption;
    }

    public getGameStateName(): string {
        return this.gamedatas.gamestate.name;
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

            let html = `<div class="counters">
                <div id="playerhand-counter-wrapper-${player.id}" class="playerhand-counter">
                    <div class="player-hand-card"></div> 
                    <span id="playerhand-counter-${player.id}"></span>
                </div>
            
                <div id="fame-counter-wrapper-${player.id}" class="fame-counter">
                    <div class="fame icon"></div>
                    <span id="fame-counter-${player.id}"></span> <span class="fame-legend">${_('VP / round')}</span>
                </div>

            </div><div class="counters">
            
                <div id="recruit-counter-wrapper-${player.id}" class="recruit-counter">
                    <div class="recruit token"></div>
                    <span id="recruit-counter-${player.id}"></span>
                </div>
            
                <div id="bracelet-counter-wrapper-${player.id}" class="bracelet-counter">
                    <div class="bracelet token"></div>
                    <span id="bracelet-counter-${player.id}"></span>
                </div>
                
            </div>`;

            dojo.place(html, `player_board_${player.id}`);

            const handCounter = new ebg.counter();
            handCounter.create(`playerhand-counter-${playerId}`);
            handCounter.setValue(player.handCount);
            this.handCounters[playerId] = handCounter;

            this.fameCounters[playerId] = new ebg.counter();
            this.fameCounters[playerId].create(`fame-counter-${playerId}`);
            this.fameCounters[playerId].setValue(getVpByFame(player.fame));

            this.recruitCounters[playerId] = new ebg.counter();
            this.recruitCounters[playerId].create(`recruit-counter-${playerId}`);
            this.recruitCounters[playerId].setValue(player.recruit);

            this.braceletCounters[playerId] = new ebg.counter();
            this.braceletCounters[playerId].create(`bracelet-counter-${playerId}`);
            this.braceletCounters[playerId].setValue(player.bracelet);
        });

        this.setTooltipToClass('playerhand-counter', _('Number of cards in hand'));
        this.setTooltipToClass('fame-counter', _('Fame'));
        this.setTooltipToClass('recruit-counter', _('Recruits'));
        this.setTooltipToClass('bracelet-counter', _('Bracelets'));
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

    private updateGains(playerId: number, gains: { [type: number]: number }) {
        Object.entries(gains).forEach(entry => {
            const type = Number(entry[0]);
            const amount = entry[1];

            if (amount != 0) {
                switch (type) {
                    case VP:
                        this.setScore(playerId, (this as any).scoreCtrl[playerId].getValue() + amount);
                        break;
                    case BRACELET:
                        this.setBracelets(playerId, this.braceletCounters[playerId].getValue() + amount);
                        break;
                    case RECRUIT:
                        this.setRecruits(playerId, this.recruitCounters[playerId].getValue() + amount);
                        break;
                    case FAME:
                        this.setFame(playerId, this.fameCounters[playerId].getValue() + amount);
                        break;
                    case CARD:
                        // TODO
                        break;
                }
            }
        });
    }

    private setScore(playerId: number, score: number) {
        (this as any).scoreCtrl[playerId]?.toValue(score);
        // TODO move on board
    }

    private setFame(playerId: number, count: number) {
        this.fameCounters[playerId].toValue(getVpByFame(count));
        // TODO move on board
    }

    private setRecruits(playerId: number, count: number) {
        this.recruitCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('recruits', count);
    }

    private setBracelets(playerId: number, count: number) {
        this.braceletCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('bracelets', count);
    }

    
    public onTableDestinationClick(destination: Destination): void {
        this.takeDestination(destination.id);
    }

    public onHandCardClick(card: Card): void {
        this.playCard(card.id);
    }
  	
    public goTrade() {
        if(!(this as any).checkAction('goTrade')) {
            return;
        }

        this.takeAction('goTrade');
    }
  	
    public playCard(id: number) {
        if(!(this as any).checkAction('playCard')) {
            return;
        }

        this.takeAction('playCard', {
            id
        });
    }
  	
    public takeDestination(id: number) {
        if(!(this as any).checkAction('takeDestination')) {
            return;
        }

        this.takeAction('takeDestination', {
            id
        });
    }
  	
    public trade(number: number) {
        if(!(this as any).checkAction('trade')) {
            return;
        }

        this.takeAction('trade', {
            number
        });
    }
  	
    public cancel() {
        if(!(this as any).checkAction('cancel')) {
            return;
        }

        this.takeAction('cancel');
    }
  	
    public endTurn() {
        if(!(this as any).checkAction('endTurn')) {
            return;
        }

        this.takeAction('endTurn');
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
            ['playCard', ANIMATION_MS],
            ['takeCard', ANIMATION_MS],
            ['newTableCard', ANIMATION_MS],
            ['score', 1],
            ['lastTurn', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_playCard(notif: Notif<NotifPlayCardArgs>) {
        const playerId = notif.args.playerId;
        const playerTable = this.getPlayerTable(playerId);

        playerTable.playCard(notif.args.playedCard);

        this.updateGains(playerId, notif.args.effectiveGains);
    }

    notif_takeCard(notif: Notif<NotifNewCardArgs>) {
        const playerId = notif.args.playerId;
        const currentPlayer = this.getPlayerId() == playerId;
        const playerTable = this.getPlayerTable(playerId);
        
        (currentPlayer ? playerTable.hand : playerTable.voidStock).addCard(notif.args.card);
    }

    notif_newTableCard(notif: Notif<NotifNewCardArgs>) {
        this.tableCenter.newTableCard(notif.args.card);
    }

    notif_score(notif: Notif<NotifScoreArgs>) {
        this.setScore(notif.args.playerId, +notif.args.newScore);
    }
    
    /** 
     * Show last turn banner.
     */ 
    notif_lastTurn(animate: boolean = true) {
        dojo.place(`<div id="last-round">
            <span class="last-round-text ${animate ? 'animate' : ''}">${_("This is the final round!")}</span>
        </div>`, 'page-title');
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (args.gains && (typeof args.gains !== 'string' || args.gains[0] !== '<')) {
                    args.gains = Object.entries(args.gains).map(entry => `<strong>${entry[0]}<strong> <div class="token-icon" data-type="${entry[1]}"></div>`).join(', ');
                }

                for (const property in args) {
                    if (['color', 'card_color', 'card_type'].includes(property) && args[property][0] != '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}