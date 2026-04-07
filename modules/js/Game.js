const BgaZoom = await globalThis.importEsmLib('bga-zoom', '1.0.0');
const [BgaHelp, BgaAnimations, BgaCards, BgaJumpTo] = await globalThis.importDojoLibs([
    g_gamethemeurl + "modules/js/bga-help.js",
    g_gamethemeurl + "modules/js/bga-animations.js",
    g_gamethemeurl + "modules/js/bga-cards.js",
    g_gamethemeurl + "modules/js/bga-jump-to.js",
]);

class ArtifactsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `artifact-${card}`,
            setupDiv: (card, div) => {
                div.classList.add('artifact');
            },
            setupFrontDiv: (card, div) => this.setupFrontDiv(card, div),
            isCardVisible: () => true,
        });
        this.game = game;
    }
    setupFrontDiv(card, div, ignoreTooltip = false) {
        div.dataset.number = '' + card;
        if (!ignoreTooltip) {
            this.game.setTooltip(div.id, this.getTooltip(card));
        }
    }
    getArtifactName(number) {
        switch (number) {
            case 1: return _("Mead Cup");
            case 2: return _("Silver coin");
            case 3: return _("Cauldron");
            case 4: return _("Golden bracelet");
            case 5: return _("Helmet");
            case 6: return _("Amulet");
            case 7: return _("Weathervane");
        }
    }
    getArtifactEffect(number) {
        switch (number) {
            case 1: return _("If a player takes an Explore action, they may discard a viking from the board and replace them with the first card from the deck.");
            case 2: return _("For each viking of the same color a player Recruits beyond their 3rd viking of that color, they gain 1 Victory Point.");
            case 3: return _("If a player Recruits a 2nd viking of the same color, they may take the Viking card of their choice instead of the one imposed by the card they played.");
            case 4: return _("If a player recruits a 3rd viking of the same color, they can reserve a Destination card of their choice. It is taken from the available cards and placed next to their playing area. When that player takes an Explore action, they may choose to Explore a destination they have reserved instead of an available destination. Each player can have up to 2 reserved Destination cards at a time.");
            case 5: return _("If a player places a Lands of Influence card which they have just Explored directly onto a Trading Lands card, they may immediately carry out a Recruit action.");
            case 6: return _("If a player completes a line of vikings with all 5 different colors, they can take 1 silver bracelet and 1 recruit, and gains 1 Reputation Point.");
            case 7: return _("If a player completes a line of vikings with all 5 different colors, they can immediately carry out an Explore action. They still have to pay the exploration cost.");
        }
    }
    getTooltip(number) {
        return `
            <div class="artifact-tooltip">
                <div class="title">${this.getArtifactName(number)}</div>
                <div class="effect">${this.getArtifactEffect(number)}</div>
            </div>
        `;
    }
    setForHelp(card, divId) {
        const div = document.getElementById(divId);
        div.classList.add('card', 'artifact');
        div.dataset.side = 'front';
        div.innerHTML = `
        <div class="card-sides">
            <div class="card-side front">
            </div>
            <div class="card-side back">
            </div>
        </div>`;
        this.setupFrontDiv(card, div.querySelector('.front'), true);
    }
}

class BuildingsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `building-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('knarr-building');
                div.dataset.cardId = '' + card.id;
                div.dataset.type = '' + card.number;
            },
            setupFrontDiv: (card, div) => {
                div.dataset.number = '' + card.number;
                if (card.number) {
                    game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: (card) => Boolean(card.number),
            cardWidth: 111,
            cardHeight: 173,
        });
        this.game = game;
    }
    getGains(gains) {
        return Object.entries(gains).map(entry => `<strong>${entry[1]}</strong> ${this.game.getTooltipGain(Number(entry[0]))}`).join(', ');
    }
    getTooltip(building) {
        if (building.number === -1) {
            return `<strong>${_('Special Building')}</strong>`;
        }
        let message = `<strong>${_("Cost:")}</strong> ${this.getGains(building.cost)}`;
        if (building.mostRaid) {
            message += `<br><strong>${_("Most raid tokens gains:")}</strong> ${this.getGains(building.mostRaid)}`;
        }
        if (building.fewestRaid) {
            message += `<br><strong>${_("Fewest raid tokens penalties:")}</strong> ${this.getGains(building.fewestRaid)}`;
        }
        message += `<br><hr>`;
        building.gains.forEach((gain, index) => {
            if (gain !== null) {
                let label = '';
                switch (index) {
                    case 0:
                        label = _('When you explore a Land of Influence (B):');
                        break;
                    case 1:
                        label = _('When you explore a Trading Land (A):');
                        break;
                    case 2:
                        label = _('When you recruit a viking of a color you already have:');
                        break;
                    case 3:
                        label = _('When you recruit a viking of a new color:');
                        break;
                }
                message += `<br><strong>${label}</strong> ${this.getGains(gain)}`;
            }
        });
        return message;
    }
}

class CardsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('knarr-card');
                div.dataset.cardId = '' + card.id;
            },
            setupFrontDiv: (card, div) => {
                div.dataset.color = '' + card.color;
                div.dataset.gain = '' + card.gain;
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: card => Boolean(card.color),
            cardWidth: 120,
            cardHeight: 221,
        });
        this.game = game;
    }
    getTooltip(card) {
        let message = `
        <strong>${_("Color:")}</strong> ${this.game.getTooltipColor(card.color)}
        <br>
        <strong>${_("Gain:")}</strong> <strong>1</strong> ${this.game.getTooltipGain(card.gain)}
        `;
        return message;
    }
}

class DestinationsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `destination-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('knarr-destination');
                div.dataset.cardId = '' + card.id;
                div.dataset.type = '' + card.type;
            },
            setupFrontDiv: (card, div) => {
                div.dataset.number = '' + card.number;
                if (card.number) {
                    game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.number),
            cardWidth: 221,
            cardHeight: 120,
        });
        this.game = game;
    }
    getCost(cost) {
        const keys = Object.keys(cost).map(c => Number(c));
        if (keys.length == 1 && keys[0] == DIFFERENT) {
            return _("${number} different color cards").replace('${number}', `<strong>${cost[keys[0]]}</strong>`);
        }
        else if (keys.length == 1 && keys[0] == EQUAL) {
            return _("${number} cards of the same color").replace('${number}', `<strong>${cost[keys[0]]}</strong>`);
        }
        else {
            return keys.map(color => _("${number} ${color} cards").replace('${number}', `<strong>${cost[color]}</strong>`).replace('${color}', this.game.getTooltipColor(color))).join(', ');
        }
    }
    getGains(gains) {
        return Object.entries(gains).map(entry => `<strong>${entry[1]}</strong> ${this.game.getTooltipGain(Number(entry[0]))}`).join(', ');
    }
    getDestinationType(type) {
        switch (type) {
            case 1: return _("Trading Lands");
            case 2: return _("Lands of Influence");
        }
    }
    getLetter(type) {
        switch (type) {
            case 1: return "A";
            case 2: return "B";
        }
    }
    getTooltip(destination) {
        let message = `
        <strong>${_("Exploration cost:")}</strong> ${this.getCost(destination.cost)} (${_("recruits can be used as jokers")})
        <br>
        <strong>${_("Immediate gains:")}</strong> ${this.getGains(destination.immediateGains)}
        <br>
        <strong>${_("Type:")}</strong> ${this.game.getDestinationType(destination.type)} (${this.getLetter(destination.type)})
        `;
        return message;
    }
}

class PlayerTable {
    constructor(game, player, reservePossible) {
        this.game = game;
        // @ts-ignore
        this.played = [];
        this.limitSelection = null;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.bga.players.getCurrentPlayerId();
        const twoPlayersGame = this.game.getPlayerCount() === 2;
        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper ${player.color == 'd6d6d7' ? 'name-shadow' : ''}"><span class="name-marker" data-color="${player.color}"></span>&nbsp;${player.name}</div>
        `;
        if (this.game.isSkaliExpansion()) {
            html += `
                <div class="skali-row">
                    <div id="player-table-${this.playerId}-skali" class="skali" data-color="${player.color}" data-recruits="${player.recruit}" data-bracelets="${player.bracelet}" data-coins="${player.coin}">`;
            for (let i = 1; i <= 3; i++) {
                html += `
                <div class="icon coin" data-number="${i}"></div>
                `;
            }
            html += `
                        ${twoPlayersGame ? `<div id="player-table-${this.playerId}-renewal" class="icon renewal"></div>` : ``}
                        <div id="player-table-${this.playerId}-raid-tokens" class="raid-tokens"></div>
                    </div>
                    <div id="player-table-${this.playerId}-buildings" class="buildings"></div>
                </div>`;
        }
        html += `
            <div class="cols">
            <div class="col col1">
        `;
        if (this.currentPlayer) {
            html += `
            <div class="block-with-text hand-wrapper">
                <div class="block-label">${_('Your hand')}</div>
                <div id="player-table-${this.playerId}-hand" class="hand cards"></div>
            </div>`;
        }
        html += `
            <div id="player-table-${this.playerId}-destinations" class="destinations"></div>
            <div id="player-table-${this.playerId}-boat" class="boat ${this.game.getBoatSide() == 2 ? 'advanced' : 'normal'}" data-color="${player.color}" data-recruits="${player.recruit}" data-bracelets="${player.bracelet}" data-coins="${player.coin}">`;
        for (let i = 1; i <= 3; i++) {
            if (this.currentPlayer) {
                html += `<div id="player-table-${this.playerId}-column${i}" class="column" data-number="${i}"></div>`;
            }
            html += `
            <div class="icon bracelet" data-number="${i}"></div>
            <div class="icon recruit" data-number="${i}"></div>
            `;
        }
        html += `
            </div>
            <div class="visible-cards">`;
        for (let i = 1; i <= 5; i++) {
            html += `
                <div id="player-table-${this.playerId}-played-${i}" class="cards"></div>
                `;
        }
        html += `
            </div>
        `;
        if (reservePossible) {
            html += `
            <div id="player-table-${this.playerId}-reserved-destinations-wrapper" class="block-with-text hand-wrapper">
                <div class="block-label">${_('Reserved destinations')}</div>
                <div id="player-table-${this.playerId}-reserved-destinations"></div>
            </div>`;
        }
        html += `
            </div>
            
            <div class="col col2"></div>
            </div>
        </div>
        `;
        document.getElementById('tables').insertAdjacentHTML('beforeend', html);
        if (this.currentPlayer) {
            const handDiv = document.getElementById(`player-table-${this.playerId}-hand`);
            this.hand = new BgaCards.LineStock /*<Card>*/(this.game.cardsManager, handDiv, {
                sort: (a, b) => a.color == b.color ? a.gain - b.gain : a.color - b.color,
            });
            this.hand.onCardClick = (card) => this.game.onHandCardClick(card);
            this.hand.addCards(player.hand);
        }
        this.voidStock = new BgaCards.VoidStock /*<Card>*/(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
        for (let i = 1; i <= 5; i++) {
            const playedDiv = document.getElementById(`player-table-${this.playerId}-played-${i}`);
            this.played[i] = new BgaCards.LineStock /*<Card>*/(this.game.cardsManager, playedDiv, {
                direction: 'column',
                center: false,
            });
            this.played[i].onCardClick = card => {
                this.game.onPlayedCardClick(card);
                if (this.limitSelection !== null) {
                    this.updateSelectable();
                }
            };
            this.played[i].addCards(player.playedCards[i]);
            playedDiv.style.setProperty('--card-overlap', '195px');
        }
        const destinationsDiv = document.getElementById(`player-table-${this.playerId}-destinations`);
        this.destinations = new BgaCards.LineStock /*<Destination>*/(this.game.destinationsManager, destinationsDiv, {
            center: false,
        });
        destinationsDiv.style.setProperty('--card-overlap', '94px');
        this.destinations.addCards(player.destinations);
        if (reservePossible) {
            this.reservedDestinations = new BgaCards.LineStock /*<Destination>*/(this.game.destinationsManager, document.getElementById(`player-table-${this.playerId}-reserved-destinations`), {
                center: false,
            });
            this.reservedDestinations.addCards(player.reservedDestinations);
            this.reservedDestinations.onCardClick = (card) => this.game.onTableDestinationClick(card);
        }
        if (this.game.isSkaliExpansion()) {
            this.raidTokens = new BgaCards.LineStock /*<RaidToken>*/(this.game.raidTokenManager, document.getElementById(`player-table-${this.playerId}-raid-tokens`));
            this.raidTokens.addCards(player.raidTokens);
            this.buildings = new BgaCards.LineStock /*<Building>*/(this.game.buildingsManager, document.getElementById(`player-table-${this.playerId}-buildings`), {
                center: false,
            });
            if (twoPlayersGame) { // special 2-players building
                this.buildings.addCard({ id: -this.playerId, number: -1 });
            }
            this.buildings.addCards(player.buildings);
            if (player.renewal !== undefined) {
                this.setRenewal(player.renewal);
            }
        }
        [document.getElementById(`player-table-${this.playerId}-name`), document.getElementById(`player-table-${this.playerId}-boat`)].forEach(elem => {
            elem.addEventListener('mouseenter', () => this.game.highlightPlayerTokens(this.playerId));
            elem.addEventListener('mouseleave', () => this.game.highlightPlayerTokens(null));
        });
    }
    updateCounter(type, count) {
        document.getElementById(`player-table-${this.playerId}-${type === 'coins' ? 'skali' : 'boat'}`).dataset[type] = '' + count;
    }
    playCard(card, fromElement) {
        return this.played[card.color].addCard(card, {
            fromElement
        });
    }
    setHandSelectable(selectable) {
        this.hand.setSelectionMode(selectable ? 'single' : 'none');
    }
    setCardsSelectable(selectable, cost = null) {
        const colors = cost == null ? [] : Object.keys(cost).map(key => Number(key));
        const equalOrDifferent = cost == null ? false : [EQUAL, DIFFERENT].includes(colors[0]);
        this.limitSelection = equalOrDifferent ? colors[0] : null;
        for (let i = 1; i <= 5; i++) {
            this.played[i].setSelectionMode(selectable ? 'multiple' : 'none');
            if (selectable) {
                const selectableCards = this.played[i].getCards().filter(card => {
                    let disabled = !selectable || cost == null;
                    if (!disabled) {
                        if (colors.length != 1 || (colors.length == 1 && !equalOrDifferent)) {
                            disabled = !colors.includes(card.color);
                        }
                    }
                    return !disabled;
                });
                this.played[i].setSelectableCards(selectableCards);
            }
        }
    }
    getSelectedCards() {
        const cards = [];
        for (let i = 1; i <= 5; i++) {
            cards.push(...this.played[i].getSelection());
        }
        return cards;
    }
    reserveDestination(destination) {
        return this.reservedDestinations.addCard(destination);
    }
    setDestinationsSelectable(selectable, selectableCards = null) {
        if (!this.reservedDestinations) {
            return;
        }
        this.reservedDestinations.setSelectionMode(selectable ? 'single' : 'none');
        this.reservedDestinations.setSelectableCards(selectableCards);
    }
    showColumns(number) {
        if (number > 0) {
            document.getElementById(`player-table-${this.playerId}-boat`).style.setProperty('--column-height', `${35 * (this.destinations.getCards().length + 1)}px`);
        }
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`player-table-${this.playerId}-column${i}`).classList.toggle('highlight', i <= number);
        }
    }
    updateSelectable() {
        const selectedCards = this.getSelectedCards();
        const selectedColors = selectedCards.map(card => card.color);
        const color = selectedCards.length ? selectedCards[0].color : null;
        for (let i = 1; i <= 5; i++) {
            const selectableCards = this.played[i].getCards().filter(card => {
                let disabled = false;
                if (this.limitSelection === DIFFERENT) {
                    disabled = selectedColors.includes(card.color) && !selectedCards.includes(card);
                }
                else if (this.limitSelection === EQUAL) {
                    disabled = color !== null && card.color != color;
                }
                return !disabled;
            });
            this.played[i].setSelectableCards(selectableCards);
        }
    }
    setDoubleColumn(isDoublePlayerColumn) {
        const destinations = document.getElementById(`player-table-${this.playerId}-destinations`);
        const boat = document.getElementById(`player-table-${this.playerId}-boat`);
        const reservedDestinations = document.getElementById(`player-table-${this.playerId}-reserved-destinations-wrapper`);
        if (isDoublePlayerColumn) {
            const col2 = document.getElementById(`player-table-${this.playerId}`).querySelector('.col2');
            col2.appendChild(destinations);
            col2.appendChild(boat);
            if (reservedDestinations) {
                col2.appendChild(reservedDestinations);
            }
        }
        else {
            const visibleCards = document.getElementById(`player-table-${this.playerId}`).querySelector('.visible-cards');
            visibleCards.insertAdjacentElement('beforebegin', destinations);
            visibleCards.insertAdjacentElement('beforebegin', boat);
            if (reservedDestinations) {
                visibleCards.insertAdjacentElement('afterend', reservedDestinations);
            }
        }
    }
    takeBuilding(building) {
        return this.buildings.addCard(building);
    }
    gainRaidTokens(raidTokens) {
        return this.raidTokens.addCards(raidTokens);
    }
    setRenewal(value) {
        document.getElementById(`player-table-${this.playerId}-renewal`).dataset.side = value ? 'front' : 'back';
    }
}

class RaidTokenManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `raid-token-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('knarr-raid-token');
                div.dataset.cardId = '' + card.id;
            },
            isCardVisible: () => true,
            cardWidth: 32,
            cardHeight: 32,
        });
        this.game = game;
    }
}

class RenewBuildings {
    constructor(game, bga) {
        this.game = game;
        this.bga = bga;
    }
    onEnteringState(args, isCurrentPlayerActive) {
        if (isCurrentPlayerActive) {
            this.renewButton = this.bga.statusBar.addActionButton(_('Renew selected Buildings'), () => this.bga.actions.performAction("actRenewBuildings", { ids: this.game.tableCenter.getSelectedBuildings().map(building => building.id) }), { disabled: true });
            this.bga.statusBar.addActionButton(_('Cancel'), () => this.bga.actions.performAction("actCancel"), { color: 'secondary' });
            this.game.tableCenter.setBuildingsSelectable(true, null, true);
        }
    }
    onLeavingState(args, isCurrentPlayerActive) {
        if (isCurrentPlayerActive) {
            this.game.tableCenter.setBuildingsSelectable(false);
        }
    }
    onTableBuildingSelectionChange() {
        const selection = this.game.tableCenter.getSelectedBuildings();
        this.renewButton.disabled = selection.length === 0 || selection.length > 2;
    }
}

const POINT_CASE_SIZE_LEFT = 38.8;
const POINT_CASE_SIZE_TOP = 37.6;
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
// @ts-ignore
class DeckWithDiscard extends BgaCards.Deck {
    constructor(element, game, gamedatas) {
        super(game.cardsManager, element, {
            cardNumber: gamedatas.cardDeckCount,
            topCard: gamedatas.cardDeckTop,
            counter: {
                counterId: 'deck-counter',
            },
        });
        this.game = game;
        element.insertAdjacentHTML('beforeend', `
            <div id="discard-counter" class="bga-cards_deck-counter round">${gamedatas.cardDiscardCount}</div>
        `);
        const deckCounterDiv = document.getElementById('deck-counter');
        const discardCounterDiv = document.getElementById('discard-counter');
        this.game.setTooltip(deckCounterDiv.id, _('Deck size'));
        this.game.setTooltip(discardCounterDiv.id, _('Discard size'));
        this.cardDiscard = new BgaCards.VoidStock /*<Card>*/(game.cardsManager, discardCounterDiv);
    }
    discardCards(cards, newCount) {
        this.setDiscardCount(newCount);
        return this.cardDiscard.addCards(cards, undefined, undefined, 50);
    }
    setDiscardCount(cardDiscardCount) {
        const discardCounterDiv = document.getElementById('discard-counter');
        discardCounterDiv.innerHTML = '' + cardDiscardCount;
    }
    async reset(args) {
        await sleep(ANIMATION_MS * 1.5); // to let discard animation to VoidStock finish
        await this.setCardNumber(args.cardDeckCount, args.cardDeckTop);
        this.setDiscardCount(args.cardDiscardCount);
        const shuffle = await this.shuffle();
        /*if (!shuffle) {
            await sleep(ANIMATION_MS * 1.5);
        }*/
        return shuffle;
    }
}
class TableCenter {
    constructor(game, gamedatas) {
        this.game = game;
        // @ts-ignore
        this.destinationsDecks = [];
        // @ts-ignore
        this.destinations = [];
        this.vp = new Map();
        this.reputation = new Map();
        const players = Object.values(gamedatas.players);
        let html = `
            ${['B', 'A'].map(letter => `<div id="table-destinations-${letter}-deck" class="table-destinations-deck"></div> <div id="table-destinations-${letter}"></div>`).join('')}
            <div id="board-left"></div> <div id="board">
                ${players.map(player => `
                    <div id="player-${player.id}-vp-marker" class="marker" data-player-id="${player.id}" data-player-no="${player.playerNo}" data-color="${player.color}"><div class="inner vp"></div></div>
                    <div id="player-${player.id}-reputation-marker" class="marker" data-player-id="${player.id}" data-player-no="${player.playerNo}" data-color="${player.color}"><div class="inner reputation"></div></div>
                    `).join('')}
            </div>
            <div id="card-deck"></div> <div id="table-cards"></div>
        `;
        if (this.game.isSkaliExpansion()) {
            html = `<div id="table-buildings-deck" class="table-buildings-deck"></div> <div id="table-buildings"></div>${html}`;
        }
        document.getElementById('table-center').insertAdjacentHTML('beforeend', html);
        ['A', 'B'].forEach(letter => {
            this.destinationsDecks[letter] = new BgaCards.Deck /*<Destination>*/(game.destinationsManager, document.getElementById(`table-destinations-${letter}-deck`), {
                cardNumber: gamedatas.centerDestinationsDeckCount[letter],
                topCard: gamedatas.centerDestinationsDeckTop[letter],
                counter: {
                    position: 'right',
                },
            });
            this.destinations[letter] = new BgaCards.SlotStock /*<Destination>*/(game.destinationsManager, document.getElementById(`table-destinations-${letter}`), {
                slotsIds: [1, 2, 3],
                mapCardToSlot: card => card.locationArg,
            });
            this.destinations[letter].addCards(gamedatas.centerDestinations[letter]);
            this.destinations[letter].onCardClick = (card) => this.game.onTableDestinationClick(card);
        });
        this.cardDeck = new DeckWithDiscard(document.getElementById(`card-deck`), game, gamedatas);
        this.cards = new BgaCards.SlotStock /*<Card>*/(game.cardsManager, document.getElementById(`table-cards`), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: card => card.locationArg,
            gap: '12px',
        });
        this.cards.onCardClick = card => this.game.onTableCardClick(card);
        this.cards.addCards(gamedatas.centerCards);
        players.forEach(player => {
            this.game.setTooltip(`player-${player.id}-vp-marker`, player.name);
            this.game.setTooltip(`player-${player.id}-reputation-marker`, player.name);
            this.vp.set(Number(player.id), Number(player.score));
            this.reputation.set(Number(player.id), Math.min(14, Number(player.reputation)));
        });
        this.moveVP();
        this.moveReputation();
        if (gamedatas.variantOption >= 2) {
            document.getElementById('table-center').insertAdjacentHTML('afterbegin', `<div></div><div id="artifacts"></div>`);
            this.artifacts = new BgaCards.LineStock /*<number>*/(this.game.artifactsManager, document.getElementById(`artifacts`));
            this.artifacts.addCards(gamedatas.artifacts);
        }
        if (this.game.isSkaliExpansion()) {
            this.buildingsDeck = new BgaCards.Deck /*<Building>*/(game.buildingsManager, document.getElementById(`table-buildings-deck`), {
                cardNumber: gamedatas.centerBuildingsDeckCount,
                topCard: gamedatas.centerBuildingsDeckTop,
                counter: {
                    position: 'right',
                },
            });
            this.buildings = new BgaCards.SlotStock /*<Building>*/(game.buildingsManager, document.getElementById(`table-buildings`), {
                slotsIds: [1, 2, 3, 4],
                mapCardToSlot: card => card.locationArg,
            });
            this.buildings.addCards(gamedatas.centerBuildings);
            this.buildings.onCardClick = (card) => this.game.onTableBuildingClick(card);
            document.getElementById('board-left').insertAdjacentHTML('beforeend', `<div id="deck-raid-tokens"></div>`);
            document.getElementById('board').insertAdjacentHTML('beforeend', `<div id="board-raid-tokens"></div>`);
            this.deckRaidTokens = new BgaCards.LineStock /*<RaidToken>*/(this.game.raidTokenManager, document.getElementById(`deck-raid-tokens`));
            this.deckRaidTokens.addCards(gamedatas.deckRaidTokens);
            this.boardRaidTokens = new BgaCards.LineStock /*<RaidToken>*/(this.game.raidTokenManager, document.getElementById(`board-raid-tokens`));
            this.boardRaidTokens.addCards(gamedatas.boardRaidTokens);
        }
    }
    newTableCard(card) {
        return this.cards.addCard(card);
    }
    newTableDestination(destination, letter, destinationDeckCount, destinationDeckTop) {
        const promise = this.destinations[letter].addCard(destination);
        this.destinationsDecks[letter].setCardNumber(destinationDeckCount, destinationDeckTop);
        return promise;
    }
    removeTableBuildings(buildings, buildingDeckCount, buildingDeckTop) {
        const promise = this.buildings.removeCards(buildings);
        this.buildingsDeck.setCardNumber(buildingDeckCount, buildingDeckTop);
        return promise;
    }
    newTableBuilding(building, buildingDeckCount, buildingDeckTop) {
        const promise = this.buildings.addCard(building);
        this.buildingsDeck.setCardNumber(buildingDeckCount, buildingDeckTop);
        return promise;
    }
    setDestinationsSelectable(selectable, selectableCards = null) {
        ['A', 'B'].forEach(letter => {
            this.destinations[letter].setSelectionMode(selectable ? 'single' : 'none');
            this.destinations[letter].setSelectableCards(selectableCards);
        });
    }
    setBuildingsSelectable(selectable, selectableCards = null, multiple = false) {
        if (!this.game.isSkaliExpansion()) {
            return;
        }
        this.buildings.setSelectionMode(selectable ? (multiple ? 'multiple' : 'single') : 'none');
        this.buildings.setSelectableCards(selectableCards);
    }
    getSelectedBuildings() {
        return this.buildings.getSelection();
    }
    getVPCoordinates(points) {
        const cases = points % 40;
        const top = cases >= 16 ? (cases > 36 ? (40 - cases) : Math.min(4, cases - 16)) * POINT_CASE_SIZE_TOP : 0;
        const left = cases > 20 ? (36 - Math.min(cases, 36)) * POINT_CASE_SIZE_LEFT : Math.min(16, cases) * POINT_CASE_SIZE_LEFT;
        return [22 + left, 39 + top];
    }
    moveVP() {
        this.vp.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-vp-marker`);
            const coordinates = this.getVPCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
            let topShift = 0;
            let leftShift = 0;
            this.vp.forEach((iPoints, iPlayerId) => {
                if (iPoints % 40 === points % 40 && iPlayerId < playerId) {
                    topShift += 5;
                    //leftShift += 5;
                }
            });
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }
    setScore(playerId, points) {
        this.vp.set(playerId, points);
        this.moveVP();
    }
    getReputationCoordinates(points) {
        const cases = points;
        const top = cases % 2 ? -14 : 0;
        const left = cases * 16.9;
        return [368 + left, 123 + top];
    }
    moveReputation() {
        this.reputation.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-reputation-marker`);
            const coordinates = this.getReputationCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
            let topShift = 0;
            let leftShift = 0;
            this.reputation.forEach((iPoints, iPlayerId) => {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    //leftShift += 5;
                }
            });
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }
    setReputation(playerId, reputation) {
        this.reputation.set(playerId, Math.min(14, reputation));
        this.moveReputation();
    }
    getReputation(playerId) {
        return this.reputation.get(playerId);
    }
    setCardsSelectable(selectable, freeColor = null, recruits = null) {
        this.cards.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            const selectableCards = this.cards.getCards().filter(card => freeColor === null || card.locationArg == freeColor || recruits >= 1);
            this.cards.setSelectableCards(selectableCards);
        }
    }
    getVisibleDestinations() {
        return [
            ...this.destinations['A'].getCards(),
            ...this.destinations['B'].getCards(),
        ];
    }
    highlightPlayerTokens(playerId) {
        document.querySelectorAll('#board .marker').forEach((elem) => elem.classList.toggle('highlight', Number(elem.dataset.playerId) === playerId));
    }
    discardCards(cards, newCount) {
        return this.cardDeck.discardCards(cards, newCount);
    }
    resetRaidTokens(raidTokens) {
        return Promise.all([
            this.deckRaidTokens.addCards(raidTokens.filter(raidToken => raidToken.location === 'deck')),
            this.boardRaidTokens.addCards(raidTokens.filter(raidToken => raidToken.location === 'board')),
        ]);
    }
}

const ANIMATION_MS = 500;
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
const COIN = 6;
const RAID = 7;
function getVpByReputation(reputation) {
    return Object.entries(VP_BY_REPUTATION).findLast(entry => reputation >= Number(entry[0]))[1];
}
class Game {
    constructor(bga) {
        this.playersTables = [];
        //private handCounters: Counter[] = [];
        this.reputationCounters = [];
        this.recruitCounters = [];
        this.braceletCounters = [];
        this.coinCounters = [];
        this.raidCounters = [];
        this.crewCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
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
    setup(gamedatas) {
        if (!gamedatas.variantOption) {
            this.bga.images.dontPreloadImage('artefacts.jpg');
        }
        if (gamedatas.boatSideOption == 2) {
            this.bga.images.dontPreloadImage('boats-normal.png');
        }
        else {
            this.bga.images.dontPreloadImage('boats-advanced.png');
        }
        if (gamedatas.skaliExpansion) {
            this.bga.images.preloadImages(['skali/skalis.png', 'skali/buildings.jpg', 'skali/destinations.jpg',]);
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
        console.log("Starting game setup");
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
        console.log("Ending game setup");
    }
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState(stateName, args) {
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
    onEnteringPlayAction(args) {
        const isCurrentPlayerActive = this.bga.players.isCurrentPlayerActive();
        if (!args.canExplore && !args.canRecruit) {
            if (args.canDevelopVillage && args.canTrade) {
                this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can trade or develop the village') : _('${actplayer} can trade or develop the village'));
            }
            else if (args.canDevelopVillage) {
                this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can develop the village') : _('${actplayer} can develop the village'));
            }
            else {
                this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can trade') : _('${actplayer} can trade'));
            }
        }
        else if (!args.canExplore) {
            this.bga.statusBar.setTitle(isCurrentPlayerActive ? _('${you} can recruit (play a card)') : _('${actplayer} can recruit (play a card)'));
        }
        else if (!args.canRecruit) {
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
    onEnteringChooseNewCard(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, args.allFree ? null : args.freeColor, args.recruits);
        }
    }
    onEnteringDiscardTableCard() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, null, 0);
        }
    }
    onEnteringDiscardCard(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setCardsSelectable(true, [0]);
        }
    }
    onEnteringPayDestination(args) {
        // @ts-ignore
        const selectedCardDiv = this.destinationsManager.getCardElement(args.selectedDestination);
        selectedCardDiv.classList.add('selected-pay-destination');
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable()?.setCardsSelectable(true, args.selectedDestination.cost);
        }
    }
    onEnteringReserveDestination() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setDestinationsSelectable(true, this.tableCenter.getVisibleDestinations());
        }
    }
    onLeavingState(stateName) {
        console.log('Leaving state: ' + stateName);
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
    onLeavingPlayAction() {
        this.tableCenter.setDestinationsSelectable(false);
        this.tableCenter.setBuildingsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
        this.getCurrentPlayerTable()?.setDestinationsSelectable(false);
    }
    onLeavingChooseNewCard() {
        this.tableCenter.setCardsSelectable(false);
    }
    onLeavingPayDestination() {
        document.querySelectorAll('.selected-pay-destination').forEach(elem => elem.classList.remove('selected-pay-destination'));
        this.getCurrentPlayerTable()?.setCardsSelectable(false);
    }
    onLeavingDiscardTableCard() {
        this.tableCenter.setCardsSelectable(false);
    }
    onLeavingDiscardCard() {
        this.getCurrentPlayerTable()?.setCardsSelectable(false);
    }
    onLeavingReserveDestination() {
        this.tableCenter.setDestinationsSelectable(false);
    }
    setPayDestinationLabelAndState(args) {
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
            message = _("Pay the ${cards} selected card(s) and ${recruits} recruit(s)");
        }
        else if (cards > 0) {
            message = _("Pay the ${cards} selected card(s)");
        }
        else if (recruits > 0) {
            message = _("Pay ${recruits} recruit(s)");
        }
        button.innerHTML = message.replace('${recruits}', '' + recruits).replace('${cards}', '' + cards);
        button.classList.toggle('disabled', args.recruits < recruits);
        button.dataset.recruits = '' + recruits;
    }
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons(stateName, args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'PlayAction':
                    const playActionArgs = args;
                    this.bga.statusBar.addActionButton(_("Trade"), () => this.bga.actions.performAction('actGoTrade'), { disabled: !playActionArgs.canTrade });
                    if (args.canRenewBuildings) {
                        this.bga.statusBar.addActionButton(_("Renew some building cards"), () => this.bga.actions.performAction('actGoRenewBuildings'), { color: 'secondary', });
                    }
                    if (!playActionArgs.canExplore || !playActionArgs.canRecruit) {
                        if (!playActionArgs.canExplore && playActionArgs.canRecruit) {
                            const warning = _("Are you sure you want to skip Helmet effect ? You can carry out a Recruit action");
                            this.bga.statusBar.addActionButton(_("End turn without recruiting"), () => this.bga.gameui.confirmationDialog(warning, () => this.endTurn()), { color: 'alert' });
                        }
                        else {
                            this.bga.statusBar.addActionButton(_("End turn"), () => this.endTurn());
                        }
                    }
                    break;
                case 'ChooseNewCard':
                    const chooseNewCardArgs = args;
                    [1, 2, 3, 4, 5].forEach(color => {
                        const free = chooseNewCardArgs.allFree || color == chooseNewCardArgs.freeColor;
                        this.bga.statusBar.addActionButton(_("Take ${color}").replace('${color}', `<div class="color" data-color="${color}"></div>`) + ` (${free ? _('free') : `1 <div class="recruit icon"></div>`})`, () => this.chooseNewCard(chooseNewCardArgs.centerCards.find(card => card.locationArg == color).id), { color: free ? undefined : 'secondary', disabled: (!free && chooseNewCardArgs.recruits < 1) });
                    });
                    break;
                case 'PayDestination':
                    this.bga.statusBar.addActionButton('', () => this.payDestination(), { id: `payDestination_button` });
                    this.setPayDestinationLabelAndState(args);
                    this.bga.statusBar.addActionButton(_("Cancel"), () => this.cancel(), { color: 'secondary' });
                    break;
                case 'Trade':
                    const tradeArgs = args;
                    [1, 2, 3].forEach(number => {
                        const button = this.bga.statusBar.addActionButton(_("Trade ${number} bracelet(s)").replace('${number}', `${number}`), () => this.trade(number, tradeArgs.gainsByBracelets), { disabled: tradeArgs.bracelets < number });
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
    setTooltip(id, html) {
        this.bga.gameui.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    setTooltipToClass(className, html) {
        this.bga.gameui.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }
    getPlayerCount() {
        return Object.values(this.gamedatas.players).length;
    }
    getPlayer(playerId) {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }
    getPlayerTable(playerId) {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }
    getCurrentPlayerTable() {
        return this.playersTables.find(playerTable => playerTable.playerId === this.bga.players.getCurrentPlayerId());
    }
    getBoatSide() {
        return this.gamedatas.boatSideOption;
    }
    getVariantOption() {
        return this.gamedatas.variantOption;
    }
    isSkaliExpansion() {
        return this.gamedatas.skaliExpansion;
    }
    getGameStateName() {
        return this.gamedatas.gamestate.name;
    }
    getOrderedPlayers(gamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) == this.bga.players.getCurrentPlayerId());
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }
    createPlayerPanels(gamedatas) {
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
    createPlayerTables(gamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(player => this.createPlayerTable(gamedatas, Number(player.id)));
    }
    createPlayerTable(gamedatas, playerId) {
        const table = new PlayerTable(this, gamedatas.players[playerId], gamedatas.reservePossible);
        this.playersTables.push(table);
    }
    updateGains(playerId, gains) {
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
    setScore(playerId, score) {
        this.bga.playerPanels.getScoreCounter(playerId).toValue(score);
        this.tableCenter.setScore(playerId, score);
    }
    setReputation(playerId, count) {
        this.reputationCounters[playerId].toValue(getVpByReputation(count));
        this.tableCenter.setReputation(playerId, count);
    }
    setRecruits(playerId, count) {
        this.recruitCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('recruits', count);
    }
    setBracelets(playerId, count) {
        this.braceletCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('bracelets', count);
    }
    setCoins(playerId, count) {
        this.coinCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('coins', count);
    }
    highlightPlayerTokens(playerId) {
        this.tableCenter.highlightPlayerTokens(playerId);
    }
    getColorAddHtml() {
        return [1, 2, 3, 4, 5].map(number => `
            <div class="color" data-color="${number}"></div>
            <span class="label"> ${this.getColor(number)}</span>
        `).join('');
    }
    getHelpHtml() {
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
        for (let i = 1; i <= 7; i++) {
            html += `
            <div class="help-section">
                <div id="help-artifact-${i}"></div>
                <div>${this.artifactsManager.getTooltip(i)}</div>
            </div> `;
        }
        html += `</div>`;
        return html;
    }
    populateHelp() {
        for (let i = 1; i <= 7; i++) {
            this.artifactsManager.setForHelp(i, `help-artifact-${i}`);
        }
    }
    onTableDestinationClick(destination) {
        if (this.gamedatas.gamestate.name == 'ReserveDestination') {
            this.reserveDestination(destination.id);
        }
        else {
            this.takeDestination(destination.id);
        }
    }
    onTableBuildingClick(building) {
        if (this.gamedatas.gamestate.name == 'PlayAction') {
            this.bga.actions.performAction('actTakeBuilding', {
                id: building.id
            });
        }
        else if (this.gamedatas.gamestate.name == 'RenewBuildings') {
            this.RenewBuildings.onTableBuildingSelectionChange();
        }
    }
    onHandCardClick(card) {
        this.playCard(card.id);
    }
    onTableCardClick(card) {
        if (this.gamedatas.gamestate.name == 'DiscardTableCard') {
            this.discardTableCard(card.id);
        }
        else {
            this.chooseNewCard(card.id);
        }
    }
    onPlayedCardClick(card) {
        if (this.gamedatas.gamestate.name == 'DiscardCard') {
            this.discardCard(card.id);
        }
        else {
            this.setPayDestinationLabelAndState();
        }
    }
    playCard(id) {
        this.bga.actions.performAction('actPlayCard', {
            id
        });
    }
    takeDestination(id) {
        this.bga.actions.performAction('actTakeDestination', {
            id
        });
    }
    reserveDestination(id) {
        this.bga.actions.performAction('actReserveDestination', {
            id
        });
    }
    chooseNewCard(id) {
        this.bga.actions.performAction('actChooseNewCard', {
            id
        });
    }
    payDestination() {
        const ids = this.getCurrentPlayerTable().getSelectedCards().map(card => card.id);
        const recruits = Number(document.getElementById(`payDestination_button`).dataset.recruits);
        this.bga.actions.performAction('actPayDestination', {
            ids: ids.join(','),
            recruits
        });
    }
    trade(number, gainsByBracelets) {
        let warning = null;
        if (gainsByBracelets != null) {
            if (gainsByBracelets[number] == 0) {
                warning = _("Are you sure you want to trade ${bracelets} bracelet(s) ?").replace('${bracelets}', `${number}`) + ' ' + _("There is nothing to gain yet with this number of bracelet(s)");
            }
            else if (number > 1 && gainsByBracelets[number] == gainsByBracelets[number - 1]) {
                warning = _("Are you sure you want to trade ${bracelets} bracelet(s) ?").replace('${bracelets}', `${number}`) + ' ' + _("You would gain the same with one less bracelet");
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
    cancel() {
        this.bga.actions.performAction('actCancel');
    }
    endTurn() {
        this.bga.actions.performAction('actEndTurn');
    }
    discardTableCard(id) {
        this.bga.actions.performAction('actDiscardTableCard', {
            id
        });
    }
    discardCard(id) {
        this.bga.actions.performAction('actDiscardCard', {
            id
        });
    }
    pass() {
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
            dojo.subscribe(notif[0], this, (notifDetails) => {
                console.log(`notif_${notif[0]}`, notifDetails.args);
                const promise = this[`notif_${notif[0]}`](notifDetails.args);
                // tell the UI notification ends, if the function returned a promise
                promise?.then(() => {
                    console.log(`promise for end of notif_${notif[0]} received`, notifDetails.args);
                    this.bga.gameui.notifqueue.onSynchronousNotificationEnd();
                });
            });
            this.bga.gameui.notifqueue.setSynchronous(notif[0], notif[1]);
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
    notif_playCard(args) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        const promise = playerTable.playCard(args.card);
        this.crewCounters[args.playerId].incValue(1);
        this.updateGains(playerId, args.effectiveGains);
        return promise;
    }
    notif_takeCard(args) {
        const playerId = args.playerId;
        const currentPlayer = this.bga.players.getCurrentPlayerId() == playerId;
        const playerTable = this.getPlayerTable(playerId);
        return (currentPlayer ? playerTable.hand : playerTable.voidStock).addCard(args.card);
    }
    notif_newTableCard(args) {
        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);
        return this.tableCenter.newTableCard(args.card);
    }
    notif_takeDestination(args) {
        const playerId = args.playerId;
        const promise = this.getPlayerTable(playerId).destinations.addCard(args.destination);
        this.updateGains(playerId, args.effectiveGains);
        return promise;
    }
    async notif_discardCards(args) {
        await this.tableCenter.discardCards(args.cards, args.cardDiscardCount);
        this.crewCounters[args.playerId].incValue(-args.cards.length);
    }
    notif_newTableDestination(args) {
        return this.tableCenter.newTableDestination(args.destination, args.letter, args.destinationDeckCount, args.destinationDeckTop);
    }
    notif_score(args) {
        this.setScore(args.playerId, +args.newScore);
    }
    notif_bracelet(args) {
        this.setBracelets(args.playerId, +args.newScore);
    }
    notif_recruit(args) {
        this.setRecruits(args.playerId, +args.newScore);
    }
    async notif_setPlayerCounter(args) {
        const { name, value, playerId } = args;
        if (name === 'coin') {
            this.setCoins(playerId, value);
        }
        else if (name === 'renewal') {
            this.getPlayerTable(playerId).setRenewal(value);
        }
    }
    notif_trade(args) {
        const playerId = args.playerId;
        this.updateGains(playerId, args.effectiveGains);
        if (args.raidTokens) {
            this.getPlayerTable(playerId).gainRaidTokens(args.raidTokens);
        }
    }
    notif_takeDeckCard(args) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        const promise = playerTable.playCard(args.card, document.getElementById('board'));
        this.crewCounters[args.playerId].incValue(1);
        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);
        return promise;
    }
    notif_discardTableCard(args) {
        return this.tableCenter.discardCards([args.card], args.cardDiscardCount);
    }
    notif_reserveDestination(args) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        return playerTable.reserveDestination(args.destination);
    }
    notif_cardDeckReset(args) {
        return this.tableCenter.cardDeck.reset(args);
    }
    notif_takeBuilding(args) {
        const playerId = args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        return playerTable.takeBuilding(args.building);
    }
    notif_removeTableBuildings(args) {
        return this.tableCenter.removeTableBuildings(args.buildings, args.buildingDeckCount, args.buildingDeckTop);
    }
    notif_newTableBuilding(args) {
        return this.tableCenter.newTableBuilding(args.building, args.buildingDeckCount, args.buildingDeckTop);
    }
    async notif_resetRaidTokens(args) {
        await this.tableCenter.resetRaidTokens(args.raidTokens);
        this.playersTables.forEach(playerTable => this.raidCounters[playerTable.playerId].toValue(playerTable.raidTokens.getCards().length));
    }
    /**
     * Show last turn banner.
     */
    notif_lastTurn(animate = true) {
        dojo.place(`<div id="last-round">
            <span class="last-round-text ${animate ? 'animate' : ''}">${_("This is the final round!")}</span>
        </div>`, 'page-title');
    }
    getGain(type) {
        switch (type) {
            case 1: return _("Victory Point");
            case 2: return _("Bracelet");
            case 3: return _("Recruit");
            case 4: return _("Reputation");
            case 5: return _("Card");
            case 6: return _("Coin");
        }
    }
    getTooltipGain(type) {
        return `${this.getGain(type)} (<div class="icon" data-type="${type}"></div>)`;
    }
    getColor(color) {
        switch (color) {
            case 1: return _("Red");
            case 2: return _("Yellow");
            case 3: return _("Green");
            case 4: return _("Blue");
            case 5: return _("Purple");
        }
    }
    getTooltipColor(color) {
        return `${this.getColor(color)} (<div class="color" data-color="${color}"></div>)`;
    }
    getDestinationType(type) {
        switch (type) {
            case 1: return _("Trading Lands");
            case 2: return _("Lands of Influence");
        }
    }
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    bgaFormatText(log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.gains && (typeof args.gains !== 'string' || args.gains[0] !== '<')) {
                    const entries = Object.entries(args.gains);
                    args.gains = entries.length ? entries.map(entry => `<strong>${args.lose ? Math.abs(entry[1]) : entry[1]}</strong> <div class="icon" data-type="${entry[0]}"></div>`).join(' ') : `<strong>${_('nothing')}</strong>`;
                }
                if (args.line_letter && args.line_letter[0] !== '<') {
                    args.line_letter = `<strong>${args.line_letter}</strong> (${this.getDestinationType(args.line_letter.charCodeAt(0) - 64)})`;
                }
                for (const property in args) {
                    if (['number', 'color', 'card_color', 'card_type', 'artifact_name'].includes(property) && args[property][0] != '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                }
                if (args.player_names && Array.isArray(args.player_names)) {
                    args.player_names = args.player_names.map((playerName) => {
                        const player = Object.values(this.gamedatas.players).find(player => player.name === playerName);
                        if (player) {
                            return this.bga.players.getFormattedPlayerName(Number(player.id)).replace('#d6d6d7;', '#d6d6d7; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;');
                        }
                        return playerName;
                    });
                }
                ['you', 'actplayer', 'player_name', 'player_names'].forEach(field => {
                    if (typeof args[field] === 'string' && args[field].indexOf('#d6d6d7;') !== -1 && args[field].indexOf('text-shadow') === -1) {
                        args[field] = args[field].replace('#d6d6d7;', '#d6d6d7; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;');
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return { log, args };
    }
}

export { ANIMATION_MS, DIFFERENT, EQUAL, Game };
