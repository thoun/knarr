class DestinationsManager extends CardManager<Destination> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `destination-${card.id}`,
            setupDiv: (card: Destination, div: HTMLElement) => {
                div.classList.add('knarr-destination');
                div.dataset.cardId = ''+card.id;
                div.dataset.type = ''+card.type;
            },
            setupFrontDiv: (card: Destination, div: HTMLElement) => { 
                div.dataset.number = ''+card.number;
                if (card.number) {
                    game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.number),
            cardWidth: 221,
            cardHeight: 120,
        });
    }

    private getCost(cost: { [color: number]: number }): string {
        const keys = Object.keys(cost).map(c => Number(c));
        if (keys.length == 1 && keys[0] == DIFFERENT) {
            return _("${number} different color cards").replace('${number}', `<strong>${cost[keys[0]]}</strong>`);
        } else if (keys.length == 1 && keys[0] == EQUAL) {
            return _("${number} cards of the same color").replace('${number}', `<strong>${cost[keys[0]]}</strong>`);
        } else {
            return keys.map(color => _("${number} ${color} cards").replace('${number}', `<strong>${cost[color]}</strong>`).replace('${color}', this.game.getTooltipColor(color))).join(', ');
        }
    }

    private getGains(gains: { [type: number]: number }): string {
        return Object.entries(gains).map(entry => `<strong>${entry[1]}</strong> ${this.game.getTooltipGain(Number(entry[0]))}`).join(', ');
    }

    public getType(type: number): string {
        switch (type) {
            case 1: return _("Trading Lands");
            case 2: return _("Lands of Influence");
        }
    }

    private getLetter(type: number): string {
        switch (type) {
            case 1: return "A";
            case 2: return "B";
        }
    }

    private getTooltip(destination: Destination): string {
        let message = `
        <strong>${_("Exploration cost:")}</strong> ${this.getCost(destination.cost)} (recruits can be used as jokers)
        <br>
        <strong>${_("Immediate gains:")}</strong> ${this.getGains(destination.immediateGains)}
        <br>
        <strong>${_("Type:")}</strong> ${this.getType(destination.type)} (${this.getLetter(destination.type)})
        `;
 
        return message;
    }
}