class ChiefsManager extends CardManager<number> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `chief-${card}`,
            setupDiv: (card: number, div: HTMLElement) => { 
                div.classList.add('chief');
                game.setTooltip(div.id, this.getTooltip(card));
            },
            setupFrontDiv: (card: number, div: HTMLElement) => { 
                div.dataset.number = ''+card;
                div.dataset.level = ''+game.getVariantOption();
            },
        });
    }

    private getPower(number: number): string {
        let message = '';
        switch (number) {
            case 1: message = _("When this player takes the resources associated with their chosen card, they may skip a pile."); break;
            case 2: message = _("When this player places a second tribe card in front of them during their turn, they discard 1 less resource or sacrifice than required for that card."); break;
            case 3: message = _("When this player finishes one of the 6 resource piles, in addition to taking a resource from the center pile, they take a visible card of their choice. They do not take the resources associated with that card."); break;
            case 4: message = _("When this player chooses a tribe card that only allows them to take 1 resource, they take 1 additional resource at random from the resource pool."); break;
        }

        return message;
    }

    private getTooltip(number: number): string {
        const level = this.game.getVariantOption();
        let message = `<strong>${_('Chieftain card')}</strong> ${number} (${level == 2 ? _('Advanced side') : _('Normal side')})<br><br>${_("The chieftain card allow to store ${number} resources between turns.").replace('${number}', `<strong>${5 - level}</strong>`)}`;
        
        if (level == 2) {
            message += `<br><br><strong>${_('Power:')}</strong> ${this.getPower(number)}`;
        }

        return message;
    }
}