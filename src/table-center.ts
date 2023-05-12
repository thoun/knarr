const SHADOW_COLORS = [
    'transparent',
    'orangered',
    'darkred',
    'black',
];

class TableCenter {
    public destinations: SlotStock<Destination>[] = [];
    public cards: SlotStock<Card>;
        
    constructor(private game: KnarrGame, gamedatas: KnarrGamedatas) {
        ['A', 'B'].forEach(letter => {            
            this.destinations[letter] = new SlotStock<Destination>(game.destinationsManager, document.getElementById(`table-destinations-${letter}`), {
                slotsIds: [1, 2, 3],
                mapCardToSlot: card => card.locationArg,
            });
            this.destinations[letter].addCards(gamedatas.centerDestinations[letter]);
            this.destinations[letter].onCardClick = (card: Destination) => this.game.onTableDestinationClick(card);
        })

        this.cards = new SlotStock<Card>(game.cardsManager, document.getElementById(`table-cards`), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: card => card.locationArg,
            gap: '12px',
        });
        this.cards.addCards(gamedatas.centerCards);
    }
    
    public newTableCard(card: Card) {
        this.cards.addCard(card, {
            fromElement: document.getElementById(`board`)
        });
    }
    
    public newTableDestination(destination: Destination, letter: string) {
        this.destinations[letter].addCard(destination, {
            fromElement: document.getElementById(`board`)
        });
    }
}