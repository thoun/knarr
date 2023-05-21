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
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: card => Boolean(card.color),
        });
    }

    private getGain(type: number): string {
        switch (type) {
            case 1: return _("House");
            case 2: return _("Storage");
            case 3: return _("Human");
            case 4: return _("Tool");
        }
    }

    private getColor(color: number): string {
        switch (color) {
            case 1: return _("Blue");
            case 2: return _("Yellow");
            case 3: return _("Green");
            case 4: return _("Red");
            case 5: return _("Purple");
        }
    }

    private getTooltip(card: Card): string {
        let message = `
        <strong>${_("Color:")}</strong> ${this.getColor(card.color)}
        <br>
        <strong>${_("Gain:")}</strong> ${this.getGain(card.gain)}
        `;
 
        return message;
    }
}