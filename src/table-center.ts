const SHADOW_COLORS = [
    'transparent',
    'orangered',
    'darkred',
    'black',
];

class TableCenter {
    public cards: SlotStock<Card>;
        
    constructor(private game: KnarrGame, gamedatas: KnarrGamedatas) {

        this.cards = new SlotStock<Card>(game.cardsManager, document.getElementById(`table-cards`), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: card => card.locationArg,
        });
        this.cards.addCards(gamedatas.centerCards);
    }
}