const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public played: LineStock<Card>[] = [];
    public destinations: LineStock<Destination>;

    private currentPlayer: boolean;

    constructor(private game: KnarrGame, player: KnarrPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">${player.name}</div>
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
            this.played[i].onSelectionChange = () => this.game.onPlayedCardClick();
            this.played[i].addCards(player.playedCards[i]);
            playedDiv.style.setProperty('--card-overlap', '195px');
        }
        
        const destinationsDiv = document.getElementById(`player-table-${this.playerId}-destinations`);
        this.destinations = new LineStock<Destination>(this.game.destinationsManager, destinationsDiv, {
            center: false,
        });
        destinationsDiv.style.setProperty('--card-overlap', '92px');
        
        this.destinations.addCards(player.destinations);
    }

    public updateCounter(type: 'recruits' | 'bracelets', count: number) {
        document.getElementById(`player-table-${this.playerId}-boat`).dataset[type] = ''+count;
    }

    public playCard(playedCard: Card) {
        this.played[playedCard.color].addCard(playedCard);
    }

    public setHandSelectable(selectable: boolean) {
        this.hand.setSelectionMode(selectable ? 'single' : 'none');
    }

    public setCardsSelectable(selectable: boolean, cost: { [color: number]: number } | null = null) {
        const colors = cost == null ? [] : Object.keys(cost).map(key => Number(key));

        for (let i = 1; i <= 5; i++) {
            this.played[i].setSelectionMode(selectable ? 'multiple' : 'none');
            this.played[i].getCards().forEach(card => {
                const element = this.played[i].getCardElement(card);
                let disabled = !selectable || cost == null;
                if (!disabled) {
                    if (colors.length != 1 || (colors.length == 1 && colors[0] != DIFFERENT)) {
                        disabled = !colors.includes(card.color);
                        console.log(colors, card.color, disabled);
                    }
                }
                element.classList.toggle('disabled', disabled);
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
}