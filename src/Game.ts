import { ArtifactsManager } from './artifacts';
import { BuildingsManager } from './buildings';
import { CardsManager } from './cards';
import { DestinationsManager } from './destinations';
import { Building, Card, Destination, EnteringChooseNewCardArgs, EnteringPayDestinationArgs, EnteringPlayActionArgs, EnteringTradeArgs, KnarrGame, KnarrGamedatas, KnarrPlayer, NotifBuildingArgs, NotifCardDeckResetArgs, NotifDiscardCardsArgs, NotifDiscardTableCardArgs, NotifNewCardArgs, NotifNewTableBuildingArgs, NotifNewTableDestinationArgs, NotifPlayCardArgs, NotifRemoveTableBuildingsArgs, NotifReserveDestinationArgs, NotifResetRaidTokensArgs, NotifScoreArgs, NotifTakeDestinationArgs, NotifTradeArgs } from './knarr';
import { BgaAnimations, BgaJumpTo, BgaHelp, BgaZoom } from "./libs";
import { PlayerTable } from './player-table';
import { RaidTokenManager } from './raid-tokens';
import { RenewBuildings } from './states/RenewBuildings';
import { TableCenter } from './table-center';

export const ANIMATION_MS = 500;

const LOCAL_STORAGE_ZOOM_KEY = 'Knarr-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'Knarr-jump-to-folded';

const VP_BY_REPUTATION = {
    0: 0,
    3: 1,
    6: 2,
    10: 3,
    14: 5,
};

export const EQUAL = -1;
export const DIFFERENT = 0;

const VP = 1;
const BRACELET = 2;
const RECRUIT = 3;
const REPUTATION = 4;
const CARD = 5;
const COIN = 6;
const RAID = 7;

function getVpByReputation(reputation: number) {
    return Object.entries(VP_BY_REPUTATION).findLast(entry => reputation >= Number(entry[0]))[1];
}

export class Game implements KnarrGame {
    public cardsManager: CardsManager;
    public destinationsManager: DestinationsManager;
    public artifactsManager: ArtifactsManager;
    public buildingsManager: BuildingsManager;
    public raidTokenManager: RaidTokenManager;

    private zoomManager: InstanceType<typeof BgaZoom.Manager>;
    // @ts-ignore
    public animationManager: BgaAnimations.AnimationManager;
    private gamedatas: KnarrGamedatas;
    public tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    //private handCounters: Counter[] = [];
    private reputationCounters: Counter[] = [];
    private recruitCounters: Counter[] = [];
    private braceletCounters: Counter[] = [];
    private coinCounters: Counter[] = [];
    private raidCounters: Counter[] = [];
    private crewCounters: Counter[] = [];
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    public bga: Bga<KnarrPlayer, KnarrGamedatas>;

    public RenewBuildings: RenewBuildings;

    constructor(bga: Bga<KnarrPlayer, KnarrGamedatas>) {
        this.bga = bga;

        this.RenewBuildings = new RenewBuildings(this, bga);
        this.bga.states.register('RenewBuildings', this.RenewBuildings);
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
            this.bga.images.dontPreloadImage('artefacts.jpg');
        }
        if (gamedatas.boatSideOption == 2) {
            this.bga.images.dontPreloadImage('boats-normal.png');
        } else {
            this.bga.images.dontPreloadImage('boats-advanced.png');
        }
        if (gamedatas.skaliExpansion) {
            this.bga.images.preloadImages(['skali/skalis.png', 'skali/buildings.jpg', 'skali/destinations.jpg', ]);
        }

        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="table">
                <div id="tables-and-center">
                    <div id="table-center-wrapper">
                        <div id="table-center">
                        </div>
                    </div>
                    <div id="tables"></div>
                </div>
            </div>
        `);

        console.log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        console.log('gamedatas', gamedatas);


        this.cardsManager = new CardsManager(this);
        this.destinationsManager = new DestinationsManager(this);        
        this.artifactsManager = new ArtifactsManager(this);
        this.animationManager = new BgaAnimations.AnimationManager(this);  
        this.buildingsManager = new BuildingsManager(this);
        this.raidTokenManager = new RaidTokenManager(this);
        new BgaJumpTo.JumpToManager(this, {
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            topEntries: [
                new BgaJumpTo.JumpToEntry(_('Main board'), 'table-center', { 'color': '#224757' })
            ],
            entryClasses: 'triangle-point',
            defaultFolded: true,
        });

        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        
        this.zoomManager = new BgaZoom.Manager({
            element: document.getElementById('table'),
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

        new BgaHelp.HelpManager(this, { 
            buttons: [
                new BgaHelp.BgaHelpPopinButton({
                    title: _("Card help").toUpperCase(),
                    html: this.getHelpHtml(),
                    onPopinCreated: () => this.populateHelp(),
                    buttonBackground: '#5890a9',
                }),
                new BgaHelp.BgaHelpExpandableButton({
                    unfoldedHtml: this.getColorAddHtml(),
                    foldedContentExtraClasses: 'color-help-folded-content',
                    unfoldedContentExtraClasses: 'color-help-unfolded-content',
                    expandedWidth: '120px',
                    expandedHeight: '210px',
                }),
            ]
        });
        this.setupNotifications();

        console.log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        console.log('Entering state: ' + stateName, args.args);

        switch (stateName) {
            case 'PlayAction':
                this.onEnteringPlayAction(args.args);
                break;
            case 'ChooseNewCard':
                this.onEnteringChooseNewCard(args.args);
                break;
            case 'PayDestination':
                this.onEnteringPayDestination(args.args);
                break;
            case 'DiscardTableCard':
                this.onEnteringDiscardTableCard();
                break;
            case 'ReserveDestination':
                this.onEnteringReserveDestination();
                break;
        }
    }

    private onEnteringPlayAction(args: EnteringPlayActionArgs) {
        const isCurrentPlayerActive = this.bga.players.isCurrentPlayerActive();

        if (!args.canExplore && !args.canRecruit) {
            this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can trade') :  _('${actplayer} can trade'));
        } else if (!args.canExplore) {
            this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can recruit (play a card)') : _('${actplayer} can recruit (play a card)'));
        } else if (!args.canRecruit) {
            this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can explore (take a destination)') : _('${actplayer} can explore (take a destination)'));
        }

        if (isCurrentPlayerActive) {
            if (args.canExplore) {
                this.tableCenter.setDestinationsSelectable(true, args.possibleDestinations);
                this.getCurrentPlayerTable()?.setDestinationsSelectable(true, args.possibleDestinations);
            }
            if (args.canRecruit) {
                this.getCurrentPlayerTable()?.setHandSelectable(true);
            }
            if (args.canDevelopVillage) {
                this.tableCenter.setBuildingsSelectable(true, args.possibleBuildings);
            }
        }
    }

    private onEnteringChooseNewCard(args: EnteringChooseNewCardArgs) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, args.allFree ? null : args.freeColor, args.recruits);
        }
    }

    private onEnteringDiscardTableCard() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, null, 0);
        }
    }

    private onEnteringDiscardCard(args: EnteringPayDestinationArgs) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setCardsSelectable(true, [0]);
        }
    }

    private onEnteringPayDestination(args: EnteringPayDestinationArgs) {
        // @ts-ignore
        const selectedCardDiv = this.destinationsManager.getCardElement(args.selectedDestination);
        selectedCardDiv.classList.add('selected-pay-destination');

        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setCardsSelectable(true, args.selectedDestination.cost);
        }
    }

    private onEnteringReserveDestination() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setDestinationsSelectable(true, this.tableCenter.getVisibleDestinations());
        }
    }

    public onLeavingState(stateName: string) {
        console.log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'PlayAction':
                this.onLeavingPlayAction();
                break;
            case 'ChooseNewCard':
                this.onLeavingChooseNewCard();
                break;
            case 'PayDestination':
                this.onLeavingPayDestination();
                break;
            case 'DiscardTableCard':
                this.onLeavingDiscardTableCard();
                break;
            case 'DiscardCard':
                this.onLeavingDiscardCard();
                break;
            case 'ReserveDestination':
                this.onLeavingReserveDestination();
                break;
        }
    }

    private onLeavingPlayAction() {
        this.tableCenter.setDestinationsSelectable(false);
        this.tableCenter.setBuildingsSelectable(false);
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
        
        if (this.bga.players.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'PlayAction':
                    const playActionArgs = args as EnteringPlayActionArgs;
                    this.bga.statusBar.addActionButton(_("Trade"), () => this.bga.actions.performAction('actGoTrade'), { disabled: !playActionArgs.canTrade });

                    if (args.canRenewBuildings) {
                        this.bga.statusBar.addActionButton(_("Renew some building cards"), () => this.bga.actions.performAction('actGoRenewBuildings'), { color: 'secondary', });
                    }
                    
                    if (!playActionArgs.canExplore || !playActionArgs.canRecruit) {
                        if (!playActionArgs.canExplore && playActionArgs.canRecruit) {
                            const warning = _("Are you sure you want to skip Helmet effect ? You can carry out a Recruit action");
                            this.bga.statusBar.addActionButton(
                                _("End turn without recruiting"), 
                                () => this.bga.gameui.confirmationDialog(warning, () => this.endTurn()), 
                                { color: 'alert' },
                            );
                        } else {
                            this.bga.statusBar.addActionButton(_("End turn"), () => this.endTurn());
                        }
                    }
                    break;
                case 'ChooseNewCard':
                    const chooseNewCardArgs = args as EnteringChooseNewCardArgs;
                    [1, 2, 3, 4, 5].forEach(color => {
                        const free = chooseNewCardArgs.allFree || color == chooseNewCardArgs.freeColor;
                        this.bga.statusBar.addActionButton(
                            _("Take ${color}").replace('${color}', `<div class="color" data-color="${color}"></div>`) + ` (${free ? _('free') : `1 <div class="recruit icon"></div>`})`, 
                            () => this.chooseNewCard(chooseNewCardArgs.centerCards.find(card => card.locationArg == color).id), 
                            { color: free ? undefined : 'secondary', disabled: (!free && chooseNewCardArgs.recruits < 1) }
                        );
                    });
                    break;
                case 'PayDestination':
                    this.bga.statusBar.addActionButton('', () => this.payDestination(), { id: `payDestination_button` });
                    this.setPayDestinationLabelAndState(args);

                    this.bga.statusBar.addActionButton(_("Cancel"), () => this.cancel(), { color: 'secondary' });
                    break;
                case 'Trade':
                    const tradeArgs = args as EnteringTradeArgs;
                    [1, 2, 3].forEach(number => {
                        const button = this.bga.statusBar.addActionButton(
                            _("Trade ${number} bracelet(s)").replace('${number}', `${number}`), 
                            () => this.trade(number, tradeArgs.gainsByBracelets),
                            { disabled: tradeArgs.bracelets < number },
                        );
                        if (tradeArgs.bracelets >= number) {
                            button.addEventListener('mouseenter', () => this.getCurrentPlayerTable().showColumns(number));
                            button.addEventListener('mouseleave', () => this.getCurrentPlayerTable().showColumns(0));
                        }
                    });
                    this.bga.statusBar.addActionButton(_("Cancel"), () => this.cancel(), { color: 'secondary' });
                    break;

                case 'DiscardTableCard':
                case 'ReserveDestination':
                    this.bga.statusBar.addActionButton(_("Pass"), () => this.pass(), { color: 'secondary' });

                // multiplayer state    
                case 'DiscardCard':
                    this.onEnteringDiscardCard(args);
                    break;
                    
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public setTooltip(id: string, html: string) {
        this.bga.gameui.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    public setTooltipToClass(className: string, html: string) {
        this.bga.gameui.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }

    public getPlayerCount(): number {
        return Object.values(this.gamedatas.players).length;
    }

    public getPlayer(playerId: number): KnarrPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    public getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.bga.players.getCurrentPlayerId());
    }

    public getBoatSide(): number {
        return this.gamedatas.boatSideOption;
    }

    public getVariantOption(): number {
        return this.gamedatas.variantOption;
    }

    public isSkaliExpansion(): boolean {
        return this.gamedatas.skaliExpansion;
    }

    public getGameStateName(): string {
        return this.gamedatas.gamestate.name;
    }

    private getOrderedPlayers(gamedatas: KnarrGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) == this.bga.players.getCurrentPlayerId());
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }

    private createPlayerPanels(gamedatas: KnarrGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);   

            document.getElementById(`player_name_${player.id}`).querySelector('a').insertAdjacentHTML('afterbegin', `<span class="name-marker" data-color="${player.color}"></span> `);

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
            
                <div id="crew-counter-wrapper-${player.id}" class="crew-counter">
                    <div class="player-crew-cards"></div>
                    <span id="crew-counter-${player.id}"></span>
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
                ${gamedatas.skaliExpansion ? `
                <div id="coin-counter-wrapper-${player.id}" class="coin-counter">
                    <div class="coin icon"></div>
                    <span id="coin-counter-${player.id}"></span>
                </div>
                <div id="raid-counter-wrapper-${player.id}" class="raid-counter">
                    <div class="raid icon"></div>
                    <span id="raid-counter-${player.id}"></span>
                </div>` : ''}

            </div>
            <div>${playerId == gamedatas.firstPlayerId ? `<div id="first-player">${_('First player')}</div>` : ''}</div>`;

            this.bga.playerPanels.getElement(playerId).insertAdjacentHTML('beforeend', html);

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

            if (gamedatas.skaliExpansion) {
                this.coinCounters[playerId] = new ebg.counter();
                this.coinCounters[playerId].create(`coin-counter-${playerId}`, {
                    playerCounter: 'coin',
                    playerId,
                    value: player.coin,
                });

                this.raidCounters[playerId] = new ebg.counter();
                this.raidCounters[playerId].create(`raid-counter-${playerId}`, {
                    value: player.raidTokens?.length,
                });
            }

            this.crewCounters[playerId] = new ebg.counter();
            this.crewCounters[playerId].create(`crew-counter-${playerId}`);
            this.crewCounters[playerId].setValue(Object.values(player.playedCards).map(cards => cards.length).reduce((a, b) => a + b, 0));
        });

        this.setTooltipToClass('reputation-counter', `
            ${_('Reputation (Victory Point you will earn at each round start)')}<br><br>
            ${_('Check the Reputation track on the main board for more details')}`);
        this.setTooltipToClass('recruit-counter', _('Recruits'));
        this.setTooltipToClass('bracelet-counter', _('Bracelets'));
        if (gamedatas.skaliExpansion) {
            this.setTooltipToClass('coin-counter', _('Coins'));
            this.setTooltipToClass('raid-counter', _('Raid tokens'));
        }
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
                        this.setScore(playerId, this.bga.playerPanels.getScoreCounter(playerId).getValue() + amount);
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
                    case COIN:
                        this.setCoins(playerId, this.coinCounters[playerId].getValue() + amount);
                        break;
                    case RAID:
                        this.raidCounters[playerId].incValue(amount);
                        break;
                }
            }
        });
    }

    private setScore(playerId: number, score: number) {
        this.bga.playerPanels.getScoreCounter(playerId).toValue(score);
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

    private setCoins(playerId: number, count: number) {
        this.coinCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('coins', count);
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
                <div class="icon coin"></div>
                <div class="help-label">${_("Gain 1 <strong>Coin</strong>: The player adds 1 Coin token to their ship.")} ${_("It is not possible to have more than 3.")}</div>
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
        if (this.gamedatas.gamestate.name == 'ReserveDestination') {
            this.reserveDestination(destination.id);
        } else {
            this.takeDestination(destination.id);
        }
    }

    public onTableBuildingClick(building: Building): void {
        if (this.gamedatas.gamestate.name == 'PlayAction') {
            this.bga.actions.performAction('actTakeBuilding', {
                id: building.id
            });
        } else if (this.gamedatas.gamestate.name == 'RenewBuildings') {
            this.RenewBuildings.onTableBuildingSelectionChange();
        }
    }

    public onHandCardClick(card: Card): void {
        this.playCard(card.id);
    }

    public onTableCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'DiscardTableCard') {
            this.discardTableCard(card.id);
        } else {
            this.chooseNewCard(card.id);
        }
    }

    public onPlayedCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'DiscardCard') {
            this.discardCard(card.id);
        } else {
            this.setPayDestinationLabelAndState();
        }
    }
  	
    public playCard(id: number) {
        this.bga.actions.performAction('actPlayCard', {
            id
        });
    }
  	
    public takeDestination(id: number) {
        this.bga.actions.performAction('actTakeDestination', {
            id
        });
    }
  	
    public reserveDestination(id: number) {
        this.bga.actions.performAction('actReserveDestination', {
            id
        });
    }
  	
    public chooseNewCard(id: number) {
        this.bga.actions.performAction('actChooseNewCard', {
            id
        });
    }
  	
    public payDestination() {
        const ids = this.getCurrentPlayerTable().getSelectedCards().map(card => card.id);
        const recruits = Number(document.getElementById(`payDestination_button`).dataset.recruits);

        this.bga.actions.performAction('actPayDestination', {
            ids: ids.join(','),
            recruits
        });
    }
  	
    public trade(number: number, gainsByBracelets: { [bracelets: number]: number } | null) {
        let warning = null;
        if (gainsByBracelets != null) {
            if (gainsByBracelets[number] == 0) {
                warning = _("Are you sure you want to trade ${bracelets} bracelet(s) ?").replace('${bracelets}', `${number}`) + ' '+ _("There is nothing to gain yet with this number of bracelet(s)");
            } else if (number > 1 && gainsByBracelets[number] == gainsByBracelets[number - 1]) {
                warning = _("Are you sure you want to trade ${bracelets} bracelet(s) ?").replace('${bracelets}', `${number}`) + ' '+ _("You would gain the same with one less bracelet");
            }
        }

        if (warning != null) {
            this.bga.gameui.confirmationDialog(warning, () => this.trade(number, null));
            return;
        }

        this.bga.actions.performAction('actTrade', {
            number
        });
    }
  	
    public cancel() {
        this.bga.actions.performAction('actCancel');
    }
  	
    public endTurn() {
        this.bga.actions.performAction('actEndTurn');
    }
  	
    public discardTableCard(id: number) {
        this.bga.actions.performAction('actDiscardTableCard', {
            id
        });
    }
  	
    public discardCard(id: number) {
        this.bga.actions.performAction('actDiscardCard', {
            id
        });
    }
  	
    public pass() {
        this.bga.actions.performAction('actPass');
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
        //console.log( 'notifications subscriptions setup' );

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
            ['takeBuilding', undefined],
            ['removeTableBuildings', undefined],
            ['newTableBuilding', undefined],
            ['resetRaidTokens', undefined],
            ['setPlayerCounter', undefined],
            ['lastTurn', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, (notifDetails: Notif<any>) => {
                console.log(`notif_${notif[0]}`, notifDetails.args);

                const promise = this[`notif_${notif[0]}`](notifDetails.args);

                // tell the UI notification ends, if the function returned a promise
                promise?.then(() => {
                    console.log(`promise for end of notif_${notif[0]} received`, notifDetails.args);
                    (this.bga.gameui as any).notifqueue.onSynchronousNotificationEnd()
                });
            });
            (this.bga.gameui as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        /*if (isDebug) {
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
        }*/
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
        const currentPlayer = this.bga.players.getCurrentPlayerId() == playerId;
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

    async notif_setPlayerCounter(args) {
        const { name, value, playerId } = args;
        if (name === 'coin') {
            this.setCoins(playerId, value);
        } else if (name === 'renewal') {
            this.getPlayerTable(playerId).setRenewal(value);
        }
    }

    notif_trade(args: NotifTradeArgs) {
        const playerId = args.playerId;

        this.updateGains(playerId, args.effectiveGains);

        if (args.raidTokens) {
            this.getPlayerTable(playerId).gainRaidTokens(args.raidTokens);
        }
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

    notif_takeBuilding(args: NotifBuildingArgs) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);

        return playerTable.takeBuilding(args.building);        
    }

    notif_removeTableBuildings(args: NotifRemoveTableBuildingsArgs) {
        return this.tableCenter.removeTableBuildings(args.buildings, args.buildingDeckCount, args.buildingDeckTop);        
    }

    notif_newTableBuilding(args: NotifNewTableBuildingArgs) {
        return this.tableCenter.newTableBuilding(args.building, args.buildingDeckCount, args.buildingDeckTop);        
    }

    async notif_resetRaidTokens(args: NotifResetRaidTokensArgs) {
        await this.tableCenter.resetRaidTokens(args.raidTokens); 
        this.playersTables.forEach(playerTable => this.raidCounters[playerTable.playerId].toValue(playerTable.raidTokens.getCards().length));
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
            case 6: return _("Coin");
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
    public bgaFormatText(log: string, args: any) {
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
        return { log, args };
    }
}
