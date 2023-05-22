const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public played: LineStock<Card>[] = [];
    public destinations: LineStock<Destination>;
    public reservedDestinations?: LineStock<Destination>;
    public limitSelection: number | null = null;

    private currentPlayer: boolean;

    constructor(private game: KnarrGame, player: KnarrPlayer, reservePossible: boolean) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">${player.name}</div>
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
            <div id="player-table-${this.playerId}-boat" class="boat ${this.game.getBoatSide() == 2 ? 'advanced' : 'normal'}" data-color="${player.color}" data-recruits="${player.recruit}" data-bracelets="${player.bracelet}">`;
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

        dojo.place(html, document.getElementById('tables'));

        if (this.currentPlayer) {
            const handDiv = document.getElementById(`player-table-${this.playerId}-hand`);
            this.hand = new LineStock<Card>(this.game.cardsManager, handDiv, {
                sort: (a: Card, b: Card) => a.color == b.color ? a.gain - b.gain : a.color - b.color,
            });
            this.hand.onCardClick = (card: Card) => this.game.onHandCardClick(card);
            
            this.hand.addCards(player.hand);

        }
        this.voidStock = new VoidStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
                
        for (let i = 1; i <= 5; i++) {
            const playedDiv = document.getElementById(`player-table-${this.playerId}-played-${i}`);
            this.played[i] = new LineStock<Card>(this.game.cardsManager, playedDiv, {
                direction: 'column',
                center: false,
            });
            this.played[i].onCardClick = card => {
                this.game.onPlayedCardClick(card);
                if (this.limitSelection !== null) {
                    this.updateSelectable();
                }
            }
            this.played[i].addCards(player.playedCards[i]);
            playedDiv.style.setProperty('--card-overlap', '195px');
        }
        
        const destinationsDiv = document.getElementById(`player-table-${this.playerId}-destinations`);
        this.destinations = new LineStock<Destination>(this.game.destinationsManager, destinationsDiv, {
            center: false,
        });
        destinationsDiv.style.setProperty('--card-overlap', '94px');
        
        this.destinations.addCards(player.destinations);

        if (reservePossible) {
            this.reservedDestinations = new LineStock<Destination>(this.game.destinationsManager, document.getElementById(`player-table-${this.playerId}-reserved-destinations`), {
                center: false,
            });            
            this.reservedDestinations.addCards(player.reservedDestinations);
        }
    }

    public updateCounter(type: 'recruits' | 'bracelets', count: number) {
        document.getElementById(`player-table-${this.playerId}-boat`).dataset[type] = ''+count;
    }

    public playCard(card: Card, fromElement?: HTMLElement) {
        this.played[card.color].addCard(card, {
            fromElement
        });
    }

    public setHandSelectable(selectable: boolean) {
        this.hand.setSelectionMode(selectable ? 'single' : 'none');
    }

    public setCardsSelectable(selectable: boolean, cost: { [color: number]: number } | null = null) {
        const colors = cost == null ? [] : Object.keys(cost).map(key => Number(key));
        const equalOrDifferent = cost == null ? false : [EQUAL, DIFFERENT].includes(colors[0]);
        this.limitSelection = equalOrDifferent ? colors[0] : null;

        for (let i = 1; i <= 5; i++) {
            this.played[i].setSelectionMode(selectable ? 'multiple' : 'none');
            this.played[i].getCards().forEach(card => {
                const element = this.played[i].getCardElement(card);
                let disabled = !selectable || cost == null;
                if (!disabled) {
                    if (colors.length != 1 || (colors.length == 1 && !equalOrDifferent)) {
                        disabled = !colors.includes(card.color);
                    }
                }
                element.classList.toggle('disabled', selectable && disabled);
                element.classList.toggle('selectable', selectable && !disabled);
            });
        }
    }

    public getSelectedCards(): Card[] {
        const cards = [];

        for (let i = 1; i <= 5; i++) {
            cards.push(...this.played[i].getSelection());
        }

        return cards;
    }
    
    public discardCards(cards: Card[]) {
        for (let i = 1; i <= 5; i++) {
            this.played[i].removeCards(cards);
        }
    }
    
    public reserveDestination(destination: Destination) {
        this.reservedDestinations.addCard(destination);
    }
    
    public setDestinationsSelectable(selectable: boolean, selectableCards: Destination[] | null = null) {
        if (!this.reservedDestinations) {
            return;
        }

        this.reservedDestinations.setSelectionMode(selectable ? 'single' : 'none');
        this.reservedDestinations.getCards().forEach(card => {
            const element = this.reservedDestinations.getCardElement(card);
            const disabled = selectable && selectableCards != null && !selectableCards.some(s => s.id == card.id);
            element.classList.toggle('disabled', selectable && disabled);
            element.classList.toggle('selectable', selectable && !disabled);
        });
    }
    
    public showColumns(number: number) {
        if (number > 0) {
            document.getElementById(`player-table-${this.playerId}-boat`).style.setProperty('--column-height', `${35 * (this.destinations.getCards().length + 1)}px`);
        }

        for (let i = 1; i <= 3; i++) {
            document.getElementById(`player-table-${this.playerId}-column${i}`).classList.toggle('highlight', i <= number);
        }
    }
    
    private updateSelectable() {
        const selectedCards = this.getSelectedCards();
        const selectedColors = selectedCards.map(card => card.color);
        const color = selectedCards.length ? selectedCards[0].color : null;

        for (let i = 1; i <= 5; i++) {
            this.played[i].getCards().forEach(card => {
                const element = this.played[i].getCardElement(card);
                
                let disabled = false;
                if (this.limitSelection === DIFFERENT) {
                    disabled = selectedColors.includes(card.color) && !selectedCards.includes(card);
                } else if (this.limitSelection === EQUAL) {
                    disabled = color !== null && card.color != color;
                }
                element.classList.toggle('disabled', disabled);
            });
        }
    }
    
    public setDoubleColumn(isDoublePlayerColumn: boolean): void {
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
        } else {
            const visibleCards = document.getElementById(`player-table-${this.playerId}`).querySelector('.visible-cards');
            visibleCards.insertAdjacentElement('beforebegin', destinations);
            visibleCards.insertAdjacentElement('beforebegin', boat);
            if (reservedDestinations) {
                visibleCards.insertAdjacentElement('afterend', reservedDestinations);
            }
        }
    }
}