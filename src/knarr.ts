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
            case 'takeCard':
            case 'takeCardPower':
            case 'takeCardChiefPower':
                this.onEnteringTakeCard(args.args);
                break;
            case 'playCard':
                this.onEnteringPlayCard(args.args);
                break;
            case 'discardCard':
                this.onEnteringDiscardCard(args.args);
                break;
            case 'discardTokens':
                    if ((this as any).isCurrentPlayerActive()) {
                        //this.getCurrentPlayerTable()?.setStoreButtons(false);
                        //this.getCurrentPlayerTable()?.setFreeTokensSelectable(true);
                    }
                    break;
        }

        if (['playCard', 'chooseOneLess', 'discardCard'].includes(stateName)) {
            if ((this as any).isCurrentPlayerActive()) {
                //this.getCurrentPlayerTable()?.setStoreButtons(true);
            }
        }
    }

    private onEnteringTakeCard(args: EnteringTakeCardArgs) {
        //this.getPlayerTable(args.playerId).freeResources();
        if ((this as any).isCurrentPlayerActive()) {
            //this.tableCenter.setCardsSelectable(true);
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }

    private onEnteringPlayCard(args: EnteringPlayCardArgs) {
        if (args.canStore) {
            this.setGamestateDescription('Storage');
        }

        if ((this as any).isCurrentPlayerActive()) {
            //this.getCurrentPlayerTable()?.setCardsSelectable(true, args.playableCards);
        }
    }

    private onEnteringDiscardCard(args: EnteringDiscardCardArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            //this.getCurrentPlayerTable()?.setCardsSelectable(true, args.playableCards);
            const selectedCardDiv = this.getCurrentPlayerTable().hand.getCardElement(args.selectedCard);
            selectedCardDiv.classList.add('selected-discard');
        }
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'takeCard':
            case 'takeCardPower':
            case 'takeCardChiefPower':
                this.onLeavingTakeCard();
                break;
            case 'playCard':
                this.onLeavingPlayCard();
                break;
            case 'discardCard':
                this.onLeavingDiscardCard();
                break;
           case 'discardTokens':
                if ((this as any).isCurrentPlayerActive()) {
                    //this.getCurrentPlayerTable()?.setFreeTokensSelectable(false);
                }
                break;
        }
    }

    private onLeavingTakeCard() {
        //this.tableCenter.setCardsSelectable(false);
    }

    private onLeavingPlayCard() {
        //this.getCurrentPlayerTable()?.setCardsSelectable(false);
    }

    private onLeavingDiscardCard() {
        document.querySelectorAll('.selected-discard').forEach(elem => elem.classList.remove('selected-discard'));
    }

    private onLeavingStoreTokens() {
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'skipResource':
                    const skipResourceArgs = args as EnteringSkipResourceArgs;
                    for (let i=0; i < skipResourceArgs.resources.length; i++) {
                        let label = '';
                        if (i == 0) {
                            label = _("Don't skip resource, take ${resources}").replace('${resources}', skipResourceArgs.resources.slice(0, skipResourceArgs.resources.length - 1).map(type => `<div class="token-icon" data-type="${type}"></div>`).join(''));
                        } else {
                            const resources = skipResourceArgs.resources.slice();
                            const resource = resources.splice(i-1, 1)[0];
                            label = _("Skip ${resource}, take ${resources}").replace('${resource}', `<div class="token-icon" data-type="${resource}"></div>`).replace('${resources}', resources.map(type => `<div class="token-icon" data-type="${type}"></div>`).join(''));
                        }
                        (this as any).addActionButton(`skipResource${i}_button`, label, () => this.skipResource(i));
                        const skipResourceButton = document.getElementById(`skipResource${i}_button`);
                        skipResourceButton.addEventListener('mouseenter', () => this.tableCenter.showLinkedTokens(skipResourceArgs.pile, skipResourceArgs.resources.length - 1, i));
                        skipResourceButton.addEventListener('mouseleave', () => this.tableCenter.showLinkedTokens(skipResourceArgs.pile, 0));
                    }
                    break;

                case 'playCard':
                    (this as any).addActionButton(`endTurn_button`, _("End turn"), () => this.endTurn());
                    break;
                case 'chooseOneLess':
                    const chooseOneLessArgs = args as EnteringChooseOneLessArgs;
                    if (chooseOneLessArgs.canSkipDiscard) {
                        (this as any).addActionButton(`chooseOneLess0_button`, _("Ignore sacrifice"), () => this.chooseOneLess(0));
                    }
                    chooseOneLessArgs.tokens.forEach(token => {
                        if (!document.getElementById(`chooseOneLess${token}_button`)) {
                            (this as any).addActionButton(`chooseOneLess${token}_button`, _("Ignore ${resource}").replace('${resource}', `<div class="token-icon" data-type="${token}"></div>`), () => this.chooseOneLess(token));
                        }
                    });

                    (this as any).addActionButton(`cancel_button`, _("Cancel"), () => this.cancel(), null, null, 'gray');
                    break;

                case 'discardCard':
                    (this as any).addActionButton(`cancel_button`, _("Cancel"), () => this.cancel(), null, null, 'gray');
                    break;
                case 'discardTokens':
                    (this as any).addActionButton(`keepSelectedTokens_button`, _("Keep selected resources"), () => this.keepSelectedTokens());
                    const button = document.getElementById(`keepSelectedTokens_button`);
                    button.classList.add('disabled');
                    button.dataset.max = args.number;
                    break;
                    
            }
        }

        if (['playCard', 'chooseOneLess', 'discardCard', 'discardTokens'].includes(stateName)) {
            (this as any).addActionButton(`cancelLastMoves_button`, _("Cancel last moves"), () => this.cancelLastMoves(), null, null, 'gray');
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
            </div><div class="counters">
            
                <div id="fame-counter-wrapper-${player.id}" class="fame-counter">
                    <div class="fame icon"></div>
                    <span id="fame-counter-${player.id}"></span> ${_('VP / round')}
                </div>
            
                <div id="recruit-counter-wrapper-${player.id}" class="recruit-counter">
                    <div class="recruit icon"></div>
                    <span id="recruit-counter-${player.id}"></span>
                </div>
            
                <div id="bracelet-counter-wrapper-${player.id}" class="bracelet-counter">
                    <div class="bracelet icon"></div>
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

    public onCenterCardClick(pile: number): void {
        this.takeCard(pile);
    }

    public onHandCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'discardCard') {
            this.discardCard(card.id);
        } else {
            this.playCard(card.id);
        }
    }

    public onTokenSelectionChange(selection: Destination[]): void {
        if (this.gamedatas.gamestate.name !== 'discardTokens') {
            return;
        }

        const button = document.getElementById(`keepSelectedTokens_button`);
        button.classList.toggle('disabled', selection.length != Number(button.dataset.max));
    }
  	
    public takeCard(pile: number) {
        if(!(this as any).checkAction('takeCard')) {
            return;
        }

        this.takeAction('takeCard', {
            pile
        });
    }
  	
    public playCard(id: number) {
        if(!(this as any).checkAction('playCard')) {
            return;
        }

        this.takeAction('playCard', {
            id
        });
    }
  	
    public skipResource(number: number) {
        if(!(this as any).checkAction('skipResource')) {
            return;
        }

        this.takeAction('skipResource', {
            number
        });
    }
  	
    public pass() {
        if(!(this as any).checkAction('pass')) {
            return;
        }

        this.takeAction('pass');
    }
  	
    public endTurn() {
        if(!(this as any).checkAction('endTurn')) {
            return;
        }

        this.takeAction('endTurn');
    }
  	
    public discardCard(id: number) {
        if(!(this as any).checkAction('discardCard')) {
            return;
        }

        this.takeAction('discardCard', {
            id
        });
    }
  	
    public chooseOneLess(type: number) {
        if(!(this as any).checkAction('chooseOneLess')) {
            return;
        }

        this.takeAction('chooseOneLess', {
            type
        });
    }    
  	
    public cancel() {
        if(!(this as any).checkAction('cancel')) {
            return;
        }

        this.takeAction('cancel');
    }
  	
    public storeToken(cardId: number, tokenType: number) {
        if(!(this as any).checkAction('storeToken')) {
            return;
        }

        this.takeAction('storeToken', {
            cardId, 
            tokenType,
        });
    }
  	
    public unstoreToken(tokenId: number) {
        if(!(this as any).checkAction('unstoreToken')) {
            return;
        }

        this.takeAction('unstoreToken', {
            tokenId,
        });
    }
  	
    public keepSelectedTokens() {
        if(!(this as any).checkAction('keepSelectedTokens')) {
            return;
        }

        this.takeAction('keepSelectedTokens', {
            ids: this.getCurrentPlayerTable().tokensFree.getSelection().map(token => token.id).join(','),
        });
    }
  	
    public cancelLastMoves() {
        /*if(!(this as any).checkAction('cancelLastMoves')) {
            return;
        }*/

        this.takeAction('cancelLastMoves');
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
            ['takeCard', ANIMATION_MS],
            ['takeToken', ANIMATION_MS],
            ['playCard', ANIMATION_MS],
            ['discardCard', 1],
            ['storedToken', ANIMATION_MS],
            ['unstoredToken', ANIMATION_MS],
            ['confirmStoredTokens', ANIMATION_MS],
            ['discardTokens', 1],
            ['refillTokens', 1],
            ['updateScore', 1],
            ['cancelLastMoves', ANIMATION_MS],
            ['lastTurn', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_takeCard(notif: Notif<NotifTakeCardArgs>) {
        const currentPlayer = this.getPlayerId() == notif.args.playerId;
        const playerTable = this.getPlayerTable(notif.args.playerId);
        (currentPlayer ? playerTable.hand : playerTable.voidStock).addCard(notif.args.card);
        this.tableCenter.setNewCard(notif.args.pile, notif.args.newCard, notif.args.newCount);
    }

    notif_takeToken(notif: Notif<NotifTakeTokenArgs>) {
        const playerId = notif.args.playerId;
        const token = notif.args.token;
        const fromCenter = notif.args.pile == -1;
        if (fromCenter) {
            this.tokensManager.flipCard(token, {
                updateData: true,
                updateFront: true,
                updateBack: false,
            });
        }
        this.getPlayerTable(playerId).tokensFree.addCard(token, {
            fromElement: fromCenter ? document.getElementById(`center-stock`) : undefined,
        });
        if (notif.args.pile != -2) {
            this.notif_refillTokens(notif);
        }
        this.fameCounters[playerId][token.type].incValue(1);
    }

    notif_refillTokens(notif: Notif<NotifTakeTokenArgs>) {
        this.tableCenter.setNewToken(notif.args.pile, notif.args.newToken, notif.args.newCount);
    }

    notif_playCard(notif: Notif<NotifPlayCardArgs>) {
        const playerId = notif.args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        const currentPlayer = this.getPlayerId() == playerId;
        playerTable.played.addCard(notif.args.card, {
            fromElement: currentPlayer ? undefined : document.getElementById(`player-table-${playerId}-name`)
        });
        notif.args.discardedTokens.forEach(token => {
            playerTable.tokensFree.removeCard(token);
            this.fameCounters[playerId][token.type].incValue(-1);
        });
        this.handCounters[playerId].toValue(notif.args.newCount);
    }

    notif_discardCard(notif: Notif<NotifDiscardCardArgs>) {
        this.getPlayerTable(notif.args.playerId).hand.removeCard(notif.args.card);
    }

    notif_storedToken(notif: Notif<NotifStoredTokenArgs>) {
        const playerId = notif.args.playerId;
        const token = notif.args.token;
        this.getPlayerTable(playerId).storeToken(notif.args.cardId, token);
        this.fameCounters[playerId][token.type].incValue(-1);
    }

    notif_unstoredToken(notif: Notif<NotifUnstoredTokenArgs>) {
        const playerId = notif.args.playerId;
        const token = notif.args.token;
        this.getPlayerTable(playerId).unstoreToken(token);
        this.fameCounters[playerId][token.type].incValue(+1);
    }

    notif_confirmStoredTokens(notif: Notif<NotifConfirmStoredTokensArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).confirmStoreTokens(notif.args.tokens);
    }

    notif_discardTokens(notif: Notif<NotifDiscardTokensArgs>) {
        const playerId = notif.args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        notif.args.discardedTokens.forEach(token => {
            playerTable.tokensFree.removeCard(token);
            this.fameCounters[playerId][token.type].incValue(-1);
        });
        notif.args.keptTokens.forEach((token, index) => playerTable.tokensChief.addCard(token, undefined, { slot: index }));
    }

    notif_updateScore(notif: Notif<NotifUpdateScoreArgs>) {
        this.setScore(notif.args.playerId, notif.args.playerScore);
    }

    notif_cancelLastMoves(notif: Notif<NotifCancelLastMovesArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).cancelLastMoves(notif.args.cards, notif.args.tokens);
        [1,2,3,4,5].forEach(type => 
            this.fameCounters[playerId][type].toValue(notif.args.tokens.filter(token => token.type == type).length)
        );
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

                if (args.type && (typeof args.type !== 'string' || args.type[0] !== '<')) {
                    args.type = `<div class="token-icon" data-type="${args.type}"></div>`;
                }

                if (args.types && (typeof args.types !== 'string' || args.types[0] !== '<')) {
                    args.types = args.types.map(type => `<div class="token-icon" data-type="${type}"></div>`).join('');
                }

                for (const property in args) {
                    if (['left', 'card_color', 'card_type'].includes(property) && args[property][0] != '<') {
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