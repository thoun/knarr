class CardsManager extends CardManager<Card> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                div.classList.add('knarr-card');
                div.dataset.cardId = ''+card.id;
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => { 
                div.dataset.color = ''+card.color;
                div.dataset.gain = ''+card.gain;
                console.log(card, div.dataset);
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: card => Boolean(card.color),
            cardWidth: 120,
            cardHeight: 221,
        });
    }

    private getTooltip(card: Card): string {
        let message = `
        <strong>${_("Color:")}</strong> ${this.game.getTooltipColor(card.color)}
        <br>
        <strong>${_("Gain:")}</strong> <strong>1</strong> ${this.game.getTooltipGain(card.gain)}
        `;
 
        return message;
    }
}