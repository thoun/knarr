declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'Knarr-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'Knarr-jump-to-folded';

const VP_BY_REPUTATION = {
    0: 0,
    3: 1,
    6: 2,
    10: 3,
    14: 5,
};

const EQUAL = -1;
const DIFFERENT = 0;

const VP = 1;
const BRACELET = 2;
const RECRUIT = 3;
const REPUTATION = 4;
const CARD = 5;

function getVpByReputation(reputation: number) {
    return Object.entries(VP_BY_REPUTATION).findLast(entry => reputation >= Number(entry[0]))[1];
}

class Knarr implements KnarrGame {
    public cardsManager: CardsManager;
    public destinationsManager: DestinationsManager;
    public artifactsManager: ArtifactsManager;

    private zoomManager: ZoomManager;
    private animationManager: AnimationManager;
    private gamedatas: KnarrGamedatas;
    private tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    //private handCounters: Counter[] = [];
    private reputationCounters: Counter[] = [];
    private recruitCounters: Counter[] = [];
    private braceletCounters: Counter[] = [];
    private crewCounters: Counter[] = [];
    
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
        this.artifactsManager = new ArtifactsManager(this);
        this.animationManager = new AnimationManager(this);
        new JumpToManager(this, {
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            topEntries: [
                new JumpToEntry(_('Main board'), 'table-center', { 'color': '#224757' })
            ],
            entryClasses: 'triangle-point',
            defaultFolded: true,
        });

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
                const clientWidth = tablesAndCenter.clientWidth;
                tablesAndCenter.classList.toggle('double-column', clientWidth > 1478);
                const wasDoublePlayerColumn = tablesAndCenter.classList.contains('double-player-column');
                const isDoublePlayerColumn = clientWidth > 1798;
                if (wasDoublePlayerColumn != isDoublePlayerColumn) {
                    tablesAndCenter.classList.toggle('double-player-column', isDoublePlayerColumn);
                    this.playersTables.forEach(table => table.setDoubleColumn(isDoublePlayerColumn));
                }
            },
        });

        if (gamedatas.lastTurn) {
            this.notif_lastTurn(false);
        }

        new HelpManager(this, { 
            buttons: [
                new BgaHelpPopinButton({
                    title: _("Card help").toUpperCase(),
                    html: this.getHelpHtml(),
                    onPopinCreated: () => this.populateHelp(),
                    buttonBackground: '#5890a9',
                }),
                new BgaHelpExpandableButton({
                    unfoldedHtml: this.getColorAddHtml(),
                    foldedContentExtraClasses: 'color-help-folded-content',
                    unfoldedContentExtraClasses: 'color-help-unfolded-content',
                    expandedWidth: '120px',
                    expandedHeight: '210px',
                }),
            ]
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
            case 'playAction':
                this.onEnteringPlayAction(args.args);
                break;
            case 'chooseNewCard':
                this.onEnteringChooseNewCard(args.args);
                break;
            case 'payDestination':
                this.onEnteringPayDestination(args.args);
                break;
            case 'discardTableCard':
                this.onEnteringDiscardTableCard();
                break;
            case 'reserveDestination':
                this.onEnteringReserveDestination();
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
        if (!args.canExplore && !args.canRecruit) {
            this.setGamestateDescription('TradeOnly');
        } else if (!args.canExplore) {
            this.setGamestateDescription('RecruitOnly');
        } else if (!args.canRecruit) {
            this.setGamestateDescription('ExploreOnly');
        }

        if ((this as any).isCurrentPlayerActive()) {
            if (args.canExplore) {
                this.tableCenter.setDestinationsSelectable(true, args.possibleDestinations);
                this.getCurrentPlayerTable()?.setDestinationsSelectable(true, args.possibleDestinations);
            }
            if (args.canRecruit) {
                this.getCurrentPlayerTable()?.setHandSelectable(true);
            }
        }
    }

    private onEnteringChooseNewCard(args: EnteringChooseNewCardArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, args.allFree ? null : args.freeColor, args.recruits);
        }
    }

    private onEnteringDiscardTableCard() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, null, 0);
        }
    }

    private onEnteringDiscardCard(args: EnteringPayDestinationArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setCardsSelectable(true, [0]);
        }
    }

    private onEnteringPayDestination(args: EnteringPayDestinationArgs) {
        const selectedCardDiv = this.destinationsManager.getCardElement(args.selectedDestination);
        selectedCardDiv.classList.add('selected-pay-destination');

        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setCardsSelectable(true, args.selectedDestination.cost);
        }
    }

    private onEnteringReserveDestination() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setDestinationsSelectable(true, this.tableCenter.getVisibleDestinations());
        }
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'playAction':
                this.onLeavingPlayAction();
                break;
            case 'chooseNewCard':
                this.onLeavingChooseNewCard();
                break;
            case 'payDestination':
                this.onLeavingPayDestination();
                break;
            case 'discardTableCard':
                this.onLeavingDiscardTableCard();
                break;
            case 'discardCard':
                this.onLeavingDiscardCard();
                break;
            case 'reserveDestination':
                this.onLeavingReserveDestination();
                break;
        }
    }

    private onLeavingPlayAction() {
        this.tableCenter.setDestinationsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
        this.getCurrentPlayerTable()?.setDestinationsSelectable(false);
    }
    
    private onLeavingChooseNewCard() {
        this.tableCenter.setCardsSelectable(false);
    }

    private onLeavingPayDestination() {
        document.querySelectorAll('.selected-pay-destination').forEach(elem => elem.classList.remove('selected-pay-destination'));
        this.getCurrentPlayerTable()?.setCardsSelectable(false);
    }
    
    private onLeavingDiscardTableCard() {
        this.tableCenter.setCardsSelectable(false);
    }

    private onLeavingDiscardCard() {
        this.getCurrentPlayerTable()?.setCardsSelectable(false);
    }

    private onLeavingReserveDestination() {
        this.tableCenter.setDestinationsSelectable(false);
    }

    private setPayDestinationLabelAndState(args?: EnteringPayDestinationArgs) {
        if (!args) {
            args = this.gamedatas.gamestate.args;
        }

        const selectedCards = this.getCurrentPlayerTable().getSelectedCards();

        const button = document.getElementById(`payDestination_button`);

        const total = Object.values(args.selectedDestination.cost).reduce((a, b) => a + b, 0);
        const cards = selectedCards.length;
        const recruits = total - cards;
        let message = '';
        if (recruits > 0 && cards > 0) {
            message = _("Pay the ${cards} selected card(s) and ${recruits} recruit(s)")
        } else if (cards > 0) {
            message = _("Pay the ${cards} selected card(s)");
        } else if (recruits > 0) {
            message = _("Pay ${recruits} recruit(s)");
        }

        button.innerHTML = message.replace('${recruits}', ''+recruits).replace('${cards}', ''+cards);
        button.classList.toggle('disabled', args.recruits < recruits);
        button.dataset.recruits = ''+recruits;
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
                    if (!playActionArgs.canExplore || !playActionArgs.canRecruit) {
                        (this as any).addActionButton(`endTurn_button`, _("End turn"), () => this.endTurn());
                    }
                    break;
                case 'chooseNewCard':
                    const chooseNewCardArgs = args as EnteringChooseNewCardArgs;
                    [1, 2, 3, 4, 5].forEach(color => {
                        const free = chooseNewCardArgs.allFree || color == chooseNewCardArgs.freeColor;
                        (this as any).addActionButton(`chooseNewCard${color}_button`, _("Take ${color}").replace('${color}', `<div class="color" data-color="${color}"></div>`) + ` (${free ? _('free') : `1 <div class="recruit icon"></div>`})`, () => this.chooseNewCard(chooseNewCardArgs.centerCards.find(card => card.locationArg == color).id), null, null, free ? undefined : 'gray');
                        if (!free && chooseNewCardArgs.recruits < 1) {
                            document.getElementById(`chooseNewCard${color}_button`).classList.add('disabled');
                        }
                    });
                    break;
                case 'payDestination':
                    (this as any).addActionButton(`payDestination_button`, '', () => this.payDestination());
                    this.setPayDestinationLabelAndState(args);

                    (this as any).addActionButton(`cancel_button`, _("Cancel"), () => this.cancel(), null, null, 'gray');
                    break;
                case 'trade':
                    const tradeArgs = args as EnteringTradeArgs;
                    [1, 2, 3].forEach(number => {
                        (this as any).addActionButton(`trade${number}_button`, _("Trade ${number} bracelet(s)").replace('${number}', number), () => this.trade(number, tradeArgs.gainsByBracelets));
                        const button = document.getElementById(`trade${number}_button`);
                        if (tradeArgs.bracelets < number) {
                            button.classList.add('disabled');
                        } else {
                            button.addEventListener('mouseenter', () => this.getCurrentPlayerTable().showColumns(number));
                            button.addEventListener('mouseleave', () => this.getCurrentPlayerTable().showColumns(0));
                        }
                    });
                    (this as any).addActionButton(`cancel_button`, _("Cancel"), () => this.cancel(), null, null, 'gray');
                    break;

                case 'discardTableCard':
                case 'reserveDestination':
                    (this as any).addActionButton(`pass_button`, _("Pass"), () => this.pass(), null, null, 'gray');

                // multiplayer state    
                case 'discardCard':
                    this.onEnteringDiscardCard(args);
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

            document.getElementById(`player_score_${player.id}`).insertAdjacentHTML('beforebegin', `<div id="icon_point_${player.id}_knarr" class="vp icon"></div>`);
            document.getElementById(`icon_point_${player.id}`).remove();
            this.setTooltip(`player_score_${player.id}`, _('Victory Point'));
            this.setTooltip(`icon_point_${player.id}_knarr`, _('Victory Point'));

            if (player.color == 'd6d6d7') {
                document.getElementById(`player_name_${player.id}`).classList.add('name-shadow');
            }

            /*
                <div id="playerhand-counter-wrapper-${player.id}" class="playerhand-counter">
                    <div class="player-hand-card"></div> 
                    <span id="playerhand-counter-${player.id}"></span>
                </div>*/
            let html = `<div class="counters">
            
                <div id="reputation-counter-wrapper-${player.id}" class="reputation-counter">
                    <div class="reputation icon"></div>
                    <span id="reputation-counter-${player.id}"></span> <span class="reputation-legend"><div class="vp icon"></div> / ${_('round')}</span>
                </div>

            </div>
            <div class="counters">
            
                <div id="recruit-counter-wrapper-${player.id}" class="recruit-counter">
                    <div class="recruit icon"></div>
                    <span id="recruit-counter-${player.id}"></span>
                </div>
            
                <div id="bracelet-counter-wrapper-${player.id}" class="bracelet-counter">
                    <div class="bracelet icon"></div>
                    <span id="bracelet-counter-${player.id}"></span>
                </div>
            
                <div id="crew-counter-wrapper-${player.id}" class="crew-counter">
                    <div class="player-crew-cards"></div>
                    <span id="crew-counter-${player.id}"></span>
                </div>

            </div>
            <div>${playerId == gamedatas.firstPlayerId ? `<div id="first-player">${_('First player')}</div>` : ''}</div>`;

            dojo.place(html, `player_board_${player.id}`);

            /*const handCounter = new ebg.counter();
            handCounter.create(`playerhand-counter-${playerId}`);
            handCounter.setValue(player.handCount);
            this.handCounters[playerId] = handCounter;*/

            this.reputationCounters[playerId] = new ebg.counter();
            this.reputationCounters[playerId].create(`reputation-counter-${playerId}`);
            this.reputationCounters[playerId].setValue(getVpByReputation(player.reputation));

            this.recruitCounters[playerId] = new ebg.counter();
            this.recruitCounters[playerId].create(`recruit-counter-${playerId}`);
            this.recruitCounters[playerId].setValue(player.recruit);

            this.braceletCounters[playerId] = new ebg.counter();
            this.braceletCounters[playerId].create(`bracelet-counter-${playerId}`);
            this.braceletCounters[playerId].setValue(player.bracelet);

            this.crewCounters[playerId] = new ebg.counter();
            this.crewCounters[playerId].create(`crew-counter-${playerId}`);
            this.crewCounters[playerId].setValue(Object.values(player.playedCards).map(cards => cards.length).reduce((a, b) => a + b, 0));
        });

        this.setTooltipToClass('reputation-counter', `
            ${_('Reputation (Victory Point you will earn at each round start)')}<br><br>
            ${_('Check the Reputation track on the main board for more details')}`);
        this.setTooltipToClass('recruit-counter', _('Recruits'));
        this.setTooltipToClass('bracelet-counter', _('Bracelets'));
        this.setTooltipToClass('crew-counter', _('Cards in the Crew Zone'));
    }

    private createPlayerTables(gamedatas: KnarrGamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: KnarrGamedatas, playerId: number) {
        const table = new PlayerTable(this, gamedatas.players[playerId], gamedatas.reservePossible);
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
                    case REPUTATION:
                        this.setReputation(playerId, this.tableCenter.getReputation(playerId) + amount);
                        break;
                }
            }
        });
    }

    private setScore(playerId: number, score: number) {
        (this as any).scoreCtrl[playerId]?.toValue(score);
        this.tableCenter.setScore(playerId, score);
    }

    private setReputation(playerId: number, count: number) {
        this.reputationCounters[playerId].toValue(getVpByReputation(count));
        this.tableCenter.setReputation(playerId, count);
    }

    private setRecruits(playerId: number, count: number) {
        this.recruitCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('recruits', count);
    }

    private setBracelets(playerId: number, count: number) {
        this.braceletCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('bracelets', count);
    }

    public highlightPlayerTokens(playerId: number | null): void {
        this.tableCenter.highlightPlayerTokens(playerId);
    }

    private getColorAddHtml() {
        return [1, 2, 3, 4, 5].map(number => `
            <div class="color" data-color="${number}"></div>
            <span class="label"> ${this.getColor(number)}</span>
        `).join('');
    }

    private getHelpHtml() {
        let html = `
        <div id="help-popin">
            <h1>${_("Assets")}</h2>
            <div class="help-section">
                <div class="icon vp"></div>
                <div class="help-label">${_("Gain 1 <strong>Victory Point</strong>. The player moves their token forward 1 space on the Score Track.")}</div>
            </div>
            <div class="help-section">
                <div class="icon recruit"></div>
                <div class="help-label">${_("Gain 1 <strong>Recruit</strong>: The player adds 1 Recruit token to their ship.")} ${_("It is not possible to have more than 3.")} ${_("A recruit allows a player to draw the Viking card of their choice when Recruiting or replaces a Viking card during Exploration.")}</div>
            </div>
            <div class="help-section">
                <div class="icon bracelet"></div>
                <div class="help-label">${_("Gain 1 <strong>Silver Bracelet</strong>: The player adds 1 Silver Bracelet token to their ship.")} ${_("It is not possible to have more than 3.")} ${_("They are used for Trading.")}</div>
            </div>
            <div class="help-section">
                <div class="icon reputation"></div>
                <div class="help-label">${_("Gain 1 <strong>Reputation Point</strong>: The player moves their token forward 1 space on the Reputation Track.")}</div>
            </div>
            <div class="help-section">
                <div class="icon take-card"></div>
                <div class="help-label">${_("Draw <strong>the first Viking card</strong> from the deck: It is placed in the player’s Crew Zone (without taking any assets).")}</div>
            </div>

            <h1>${_("Powers of the artifacts (variant option)")}</h1>
        `;

        for (let i = 1; i <=7; i++) {
            html += `
            <div class="help-section">
                <div id="help-artifact-${i}"></div>
                <div>${this.artifactsManager.getTooltip(i)}</div>
            </div> `;
        }
        html += `</div>`;

        return html;
    }

    private populateHelp() {
        for (let i = 1; i <=7; i++) {
            this.artifactsManager.setForHelp(i, `help-artifact-${i}`);
        }
    }
    
    public onTableDestinationClick(destination: Destination): void {
        if (this.gamedatas.gamestate.name == 'reserveDestination') {
            this.reserveDestination(destination.id);
        } else {
            this.takeDestination(destination.id);
        }
    }

    public onHandCardClick(card: Card): void {
        this.playCard(card.id);
    }

    public onTableCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'discardTableCard') {
            this.discardTableCard(card.id);
        } else {
            this.chooseNewCard(card.id);
        }
    }

    public onPlayedCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'discardCard') {
            this.discardCard(card.id);
        } else {
            this.setPayDestinationLabelAndState();
        }
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
  	
    public reserveDestination(id: number) {
        if(!(this as any).checkAction('reserveDestination')) {
            return;
        }

        this.takeAction('reserveDestination', {
            id
        });
    }
  	
    public chooseNewCard(id: number) {
        if(!(this as any).checkAction('chooseNewCard')) {
            return;
        }

        this.takeAction('chooseNewCard', {
            id
        });
    }
  	
    public payDestination() {
        if(!(this as any).checkAction('payDestination')) {
            return;
        }

        const ids = this.getCurrentPlayerTable().getSelectedCards().map(card => card.id);
        const recruits = Number(document.getElementById(`payDestination_button`).dataset.recruits);

        this.takeAction('payDestination', {
            ids: ids.join(','),
            recruits
        });
    }
  	
    public trade(number: number, gainsByBracelets: { [bracelets: number]: number } | null) {
        if(!(this as any).checkAction('trade')) {
            return;
        }

        let warning = null;
        if (gainsByBracelets != null) {
            if (gainsByBracelets[number] == 0) {
                warning = _("Are you sure you want to trade ${bracelets} bracelet(s) ?").replace('${bracelets}', number) + ' '+ _("There is nothing to gain yet with this number of bracelet(s)");
            } else if (number > 1 && gainsByBracelets[number] == gainsByBracelets[number - 1]) {
                warning = _("Are you sure you want to trade ${bracelets} bracelet(s) ?").replace('${bracelets}', number) + ' '+ _("You would gain the same with one less bracelet");
            }
        }

        if (warning != null) {
            (this as any).confirmationDialog(warning, () => this.trade(number, null));
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
  	
    public discardTableCard(id: number) {
        if(!(this as any).checkAction('discardTableCard')) {
            return;
        }

        this.takeAction('discardTableCard', {
            id
        });
    }
  	
    public discardCard(id: number) {
        if(!(this as any).checkAction('discardCard')) {
            return;
        }

        this.takeAction('discardCard', {
            id
        });
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
            ['playCard', undefined],
            ['takeCard', undefined],
            ['newTableCard', undefined],
            ['takeDestination', undefined],
            ['discardCards', undefined],
            ['newTableDestination', undefined],
            ['trade', ANIMATION_MS],
            ['takeDeckCard', undefined],
            ['discardTableCard', undefined],
            ['reserveDestination', undefined],
            ['score', ANIMATION_MS],
            ['bracelet', ANIMATION_MS],
            ['recruit', ANIMATION_MS],
            ['cardDeckReset', undefined],
            ['lastTurn', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, (notifDetails: Notif<any>) => {
                log(`notif_${notif[0]}`, notifDetails.args);

                const promise = this[`notif_${notif[0]}`](notifDetails.args);

                // tell the UI notification ends, if the function returned a promise
                promise?.then(() => {
                    log(`promise for end of notif_${notif[0]} received`, notifDetails.args);
                    (this as any).notifqueue.onSynchronousNotificationEnd()
                });
            });
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        if (isDebug) {
            notifs.forEach((notif) => {
                if (!this[`notif_${notif[0]}`]) {
                    console.warn(`notif_${notif[0]} function is not declared, but listed in setupNotifications`);
                }
            });

            Object.getOwnPropertyNames(Knarr.prototype).filter(item => item.startsWith('notif_')).map(item => item.slice(6)).forEach(item => {
                if (!notifs.some(notif => notif[0] == item)) {
                    console.warn(`notif_${item} function is declared, but not listed in setupNotifications`);
                }
            });
        }
    }

    notif_playCard(args: NotifPlayCardArgs) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);

        const promise = playerTable.playCard(args.card);
        this.crewCounters[args.playerId].incValue(1);

        this.updateGains(playerId, args.effectiveGains);

        return promise;
    }

    notif_takeCard(args: NotifNewCardArgs) {
        const playerId = args.playerId;
        const currentPlayer = this.getPlayerId() == playerId;
        const playerTable = this.getPlayerTable(playerId);
        
        return (currentPlayer ? playerTable.hand : playerTable.voidStock).addCard(args.card);
    }

    notif_newTableCard(args: NotifNewCardArgs) {
        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);
        return this.tableCenter.newTableCard(args.card);
    }

    notif_takeDestination(args: NotifTakeDestinationArgs) {
        const playerId = args.playerId;
        const promise = this.getPlayerTable(playerId).destinations.addCard(args.destination);

        this.updateGains(playerId, args.effectiveGains);

        return promise;
    }

    async notif_discardCards(args: NotifDiscardCardsArgs) {
        await this.tableCenter.discardCards(args.cards, args.cardDiscardCount);
        this.crewCounters[args.playerId].incValue(-args.cards.length);
    }

    notif_newTableDestination(args: NotifNewTableDestinationArgs) {
        return this.tableCenter.newTableDestination(args.destination, args.letter, args.destinationDeckCount, args.destinationDeckTop);
    }

    notif_score(args: NotifScoreArgs) {
        this.setScore(args.playerId, +args.newScore);
    }

    notif_bracelet(args: NotifScoreArgs) {
        this.setBracelets(args.playerId, +args.newScore);
    }

    notif_recruit(args: NotifScoreArgs) {
        this.setRecruits(args.playerId, +args.newScore);
    }

    notif_trade(args: NotifTradeArgs) {
        const playerId = args.playerId;

        this.updateGains(playerId, args.effectiveGains);
    }

    notif_takeDeckCard(args: NotifNewCardArgs) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);

        const promise = playerTable.playCard(args.card, document.getElementById('board'));  
        this.crewCounters[args.playerId].incValue(1);

        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);

        return promise;
    }

    notif_discardTableCard(args: NotifDiscardTableCardArgs) {
        return this.tableCenter.discardCards([args.card], args.cardDiscardCount);
    }

    notif_reserveDestination(args: NotifReserveDestinationArgs) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);

        return playerTable.reserveDestination(args.destination);
    }

    notif_cardDeckReset(args: NotifCardDeckResetArgs) {
        return this.tableCenter.cardDeck.reset(args);
    }
    
    /** 
     * Show last turn banner.
     */ 
    notif_lastTurn(animate: boolean = true) {
        dojo.place(`<div id="last-round">
            <span class="last-round-text ${animate ? 'animate' : ''}">${_("This is the final round!")}</span>
        </div>`, 'page-title');
    }

    public getGain(type: number): string {
        switch (type) {
            case 1: return _("Victory Point");
            case 2: return _("Bracelet");
            case 3: return _("Recruit");
            case 4: return _("Reputation");
            case 5: return _("Card");
        }
    }

    public getTooltipGain(type: number): string {
        return `${this.getGain(type)} (<div class="icon" data-type="${type}"></div>)`;
    }

    public getColor(color: number): string {
        switch (color) {
            case 1: return _("Red");
            case 2: return _("Yellow");
            case 3: return _("Green");
            case 4: return _("Blue");
            case 5: return _("Purple");
        }
    }

    public getTooltipColor(color: number): string {
        return `${this.getColor(color)} (<div class="color" data-color="${color}"></div>)`;
    }

    public getDestinationType(type: number): string {
        switch (type) {
            case 1: return _("Trading Lands");
            case 2: return _("Lands of Influence");
        }
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (args.gains && (typeof args.gains !== 'string' || args.gains[0] !== '<')) {
                    const entries = Object.entries(args.gains);
                    args.gains = entries.length ? entries.map(entry => `<strong>${entry[1]}</strong> <div class="icon" data-type="${entry[0]}"></div>`).join(' ') : `<strong>${_('nothing')}</strong>`;
                }

                if (args.line_letter && args.line_letter[0] !== '<') {
                    args.line_letter = `<strong>${args.line_letter}</strong> (${this.getDestinationType(args.line_letter.charCodeAt(0) - 64)})`;
                }

                for (const property in args) {
                    if (['number', 'color', 'card_color', 'card_type', 'artifact_name'].includes(property) && args[property][0] != '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                }

                ['you', 'actplayer', 'player_name'].forEach(field => {
                    if (typeof args[field] === 'string' && args[field].indexOf('#d6d6d7;') !== -1 && args[field].indexOf('text-shadow') === -1) {
                        args[field] = args[field].replace('#d6d6d7;', '#d6d6d7; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;');
                    }
                });
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}