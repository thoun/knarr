const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

const BONE = 5;

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public played: LineStock<Card>;

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
            <div id="player-table-${this.playerId}-boat" class="boat ${this.game.getBoatSide() == 2 ? 'advanced' : 'normal'}" data-color="${player.color}" data-recruits="${player.recruit}", data-bracelets="${player.bracelet}">`;
        for (let i = 1; i <= 3; i++) {
            html += `
            <div class="token bracelet" data-number="${i}"></div>
            <div class="token recruit" data-number="${i}"></div>
            `;
        }
        html += `
            </div>
            <div class="visible-cards">
                <div id="player-table-${this.playerId}-played" class="cards"></div>
            </div>
        </div>
        `;
        dojo.place(html, document.getElementById('tables'));

        if (this.currentPlayer) {
            const handDiv = document.getElementById(`player-table-${this.playerId}-hand`);
            this.hand = new LineStock<Card>(this.game.cardsManager, handDiv, {
                sort: (a: Card, b: Card) => a.color == b.color ? a.gain - b.gain : a.color - b.color,
            });
            this.hand.onCardClick = (card: Card) => {
                //if (handDiv.classList.contains('selectable')) {
                    this.game.onHandCardClick(card);
                    //this.hand.getCards().forEach(c => this.hand.getCardElement(c).classList.toggle('selected', c.id == card.id));
                //}
            }
            
            this.hand.addCards(player.hand);

        }
        //this.voidStock = new VoidStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
        
        this.played = new LineStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-played`), {
            center: false,
        });
        this.played.addCards(player.playedCards);
    }

    public updateCounter(type: 'recruits' | 'bracelets', count: number) {
        document.getElementById(`player-table-${this.playerId}-boat`).dataset[type] = ''+count;
    }

    /*    
    public setCardsSelectable(selectable: boolean, selectableCards: Card[] | null = null) {
        this.hand.setSelectionMode(selectable ? 'single' : 'none');
        this.hand.getCards().forEach(card => {
            const element = this.hand.getCardElement(card);
            const disabled = selectable && selectableCards != null && !selectableCards.some(s => s.id == card.id);
            element.classList.toggle('disabled', disabled);
            element.classList.toggle('selectable', selectable && !disabled);
        });
    }

    public setFreeTokensSelectable(selectable: boolean) {
        this.tokensFree.setSelectionMode(selectable ? 'multiple' : 'none');
    }

    public getTokenOfType(type: number): Destination | null {
        return this.tokensFree.getCards().find(card => card.type == type);
    }
    
    public setStoreButtons(activated: boolean) {
        if (activated) {
            document.getElementById(`player-table-${this.playerId}`).classList.add('can-store');
            this.game.cardsManager.updateStorageButtons();
        } else {
            document.getElementById(`player-table-${this.playerId}`).classList.remove('can-store');
        }
    }
    
    public storeToken(cardId: number, token: Destination) {
        this.game.cardsManager.prestoreToken(cardId, token);
        this.game.cardsManager.updateStorageButtons();
    }
    
    public unstoreToken(token: Destination) {
        this.tokensFree.addCard(token);
        this.game.cardsManager.updateStorageButtons();
    }
    
    public confirmStoreTokens(tokens: { [cardId: number]: Destination; }) {
        Object.entries(tokens).forEach(entry => 
            this.game.cardsManager.confirmStoreToken(Number(entry[0]), entry[1])
        );
        this.setStoreButtons(false);
    }
    
    public cancelLastMoves(cards: Card[], tokens: Destination[]) {
        this.hand?.addCards(cards);
        this.tokensFree.addCards(tokens);
    }*/
}