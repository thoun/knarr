const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

const BONE = 5;

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public chief: LineStock<number>;
    public played: LineStock<Card>;
    public tokensFree: LineStock<Token>;
    public tokensChief: SlotStock<Token>;

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
            <div class="visible-cards">
                <div id="player-table-${this.playerId}-played" class="cards">
                    <div class="chief-and-tokens">
                        <div id="player-table-${this.playerId}-tokens-free" class="tokens-free"></div>
                        <div id="player-table-${this.playerId}-chief" class="chief-card">
                            <div id="player-table-${this.playerId}-tokens-chief" class="tokens-chief"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        dojo.place(html, document.getElementById('tables'));

        if (this.currentPlayer) {
            const handDiv = document.getElementById(`player-table-${this.playerId}-hand`);
            this.hand = new LineStock<Card>(this.game.cardsManager, handDiv, {
                sort: (a: Card, b: Card) => a.number - b.number,
            });
            this.hand.onCardClick = (card: Card) => {
                //if (handDiv.classList.contains('selectable')) {
                    this.game.onHandCardClick(card);
                    //this.hand.getCards().forEach(c => this.hand.getCardElement(c).classList.toggle('selected', c.id == card.id));
                //}
            }
            
            this.hand.addCards(player.hand);

        }
        this.voidStock = new VoidStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));

        this.chief = new LineStock<number>(this.game.chiefsManager, document.getElementById(`player-table-${this.playerId}-chief`));
        this.chief.addCard(player.chief);
        
        this.played = new LineStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-played`), {
            center: false,
        });
        this.played.addCards(player.played);
        
        this.tokensFree = new LineStock<Token>(this.game.tokensManager, document.getElementById(`player-table-${this.playerId}-tokens-free`), {
            center: false,
            sort: (a: Token, b: Token) => a.type - b.type,
        });
        this.tokensFree.onSelectionChange = (selection: Token[], lastChange: Token) => this.game.onTokenSelectionChange(selection);
        this.tokensChief = new SlotStock<Token>(this.game.tokensManager, document.getElementById(`player-table-${this.playerId}-tokens-chief`), {
            gap: `${this.game.getChieftainOption() == 2 ? 15 : 4}px`,
            direction: 'column',
            slotsIds: this.game.getChieftainOption() == 2 ? [0, 1, 2] : [0, 1, 2, 3],
        });
        if (this.playerId == (this.game as any).getActivePlayerId()) {
            this.tokensFree.addCards(player.tokens);
        } else {
            player.tokens.forEach((token, index) => this.tokensChief.addCard(token, undefined, { slot: index }));
        }
    }

    public freeResources() {
        this.tokensFree.addCards(this.tokensChief.getCards());
    }
    
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

    public getTokenOfType(type: number): Token | null {
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
    
    public storeToken(cardId: number, token: Token) {
        this.game.cardsManager.prestoreToken(cardId, token);
        this.game.cardsManager.updateStorageButtons();
    }
    
    public unstoreToken(token: Token) {
        this.tokensFree.addCard(token);
        this.game.cardsManager.updateStorageButtons();
    }
    
    public confirmStoreTokens(tokens: { [cardId: number]: Token; }) {
        Object.entries(tokens).forEach(entry => 
            this.game.cardsManager.confirmStoreToken(Number(entry[0]), entry[1])
        );
        this.setStoreButtons(false);
    }
    
    public cancelLastMoves(cards: Card[], tokens: Token[]) {
        this.hand?.addCards(cards);
        this.tokensFree.addCards(tokens);
    }
}