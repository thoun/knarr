class DestinationsManager extends CardManager<Destination> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `destination-${card.id}`,
            setupDiv: (card: Destination, div: HTMLElement) => {
                div.classList.add('knarr-destination');
                div.dataset.cardId = ''+card.id;
            },
            setupFrontDiv: (card: Destination, div: HTMLElement) => { 
                div.dataset.cardId = `${this.getId(card)}-front`;
                div.dataset.type = ''+card.type;
                div.dataset.number = ''+card.number;
                game.setTooltip(div.id, this.getTooltip(card));
            },
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

    private getTooltip(card: Destination): string {
        let message = `TODO`;/*
        <strong>${_("Color:")}</strong> ${this.getColor(card.color)}
        <br>
        <strong>${_("Gain:")}</strong> ${this.getGain(card.gain)}
        `;*/
 
        return message;
    }
}