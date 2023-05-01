const CARD_OVERLAP = 40;
const FIRST_ANIMAL_SHIFT = 28;

class CenterSpot {

    public visibleCard: VisibleDeck<Card>;
    public visibleToken: VisibleDeck<Token>;

    private cardCounter: Counter;
    private tokenCounter: Counter;

    constructor(
        private game: KnarrGame,
        private tableCenter: TableCenter,
        public pile: number,
        card: Card,
        cardCount: number,
        token: Token,
        tokenCount: number,
    ) { 
        let html = `
        <div id="center-spot-${pile}" class="center-spot" style="--angle: ${this.getSpotAngle()}">
            <div id="center-spot-${pile}-token" class="center-spot-token">
                <div id="center-spot-${pile}-token-counter" class="center-spot-counter token-counter"></div>
            </div>
            <div id="center-spot-${pile}-card" class="center-spot-card">
            <div id="center-spot-${pile}-card-counter" class="center-spot-counter card-counter"></div>
            </div>
        `;
        html += `</div>`;

        dojo.place(html, 'table-center');

        const cardDeck = document.getElementById(`center-spot-${pile}-card`);
        this.visibleCard = new VisibleDeck<Card>(game.cardsManager, cardDeck, {
            width: 202,
            height: 282,
            cardNumber: cardCount,
            autoUpdateCardNumber: false,
        });
        if (card) {
            this.visibleCard.addCard(card);
        }
        cardDeck.addEventListener('click', () => this.game.onCenterCardClick(pile));
        cardDeck.addEventListener('mouseenter', () => {
            const card = this.visibleCard.getCards()[0];
            tableCenter.showLinkedTokens(pile, card?.tokens ?? 0)
        });
        cardDeck.addEventListener('mouseleave', () => tableCenter.showLinkedTokens(pile, 0));
        
        this.cardCounter = new ebg.counter();
        this.cardCounter.create(`center-spot-${pile}-card-counter`);
        this.cardCounter.setValue(cardCount);

        this.visibleToken = new VisibleDeck<Token>(game.tokensManager, document.getElementById(`center-spot-${pile}-token`), {
            width: 68,
            height: 68,
            cardNumber: tokenCount,
            autoUpdateCardNumber: false,
        });
        if (token) {
            this.visibleToken.addCard(token);
        }

        this.tokenCounter = new ebg.counter();
        this.tokenCounter.create(`center-spot-${pile}-token-counter`);
        this.tokenCounter.setValue(tokenCount);
        this.tableCenter.setShadow(`center-spot-${pile}-token`, tokenCount);
    }

    private getSpotAngle() {
        const angle = 60 * this.pile + 90;
        return `${angle > 180 ? angle-360 : angle}deg`;
    }
    
    public setNewCard(newCard: Card, newCount: number) {
        if (newCard) {
            this.visibleCard.addCard(newCard);
        }
        this.visibleCard.setCardNumber(newCount);
        this.cardCounter.toValue(newCount);
    }
    
    public setNewToken(newToken: Token, newCount: number) {
        if (newToken) {
            this.visibleToken.addCard(newToken);
        }
        this.visibleToken.setCardNumber(newCount);
        this.tokenCounter.toValue(newCount);
        this.tableCenter.setShadow(`center-spot-${this.pile}-token`, newCount);
    }
    
    public setCardSelectable(selectable: boolean): void {
        this.visibleCard.setSelectionMode(selectable && this.cardCounter.getValue() > 0 ? 'single' : 'none');
    }
    
    public showLinked(linked: boolean): void {
        const card = this.visibleToken.getCards()[0];
        if (card) {
            this.visibleToken.getCardElement(card)?.classList.toggle('selected', linked);
        }
    }
}