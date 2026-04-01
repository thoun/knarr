import { Building, KnarrGame } from "./knarr";
import { BgaCards } from "./libs";

export class BuildingsManager extends BgaCards.CardManager<Building> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `building-${card.id}`,
            setupDiv: (card: Building, div: HTMLElement) => {
                div.classList.add('knarr-building');
                div.dataset.cardId = ''+card.id;
                div.dataset.type = ''+card.number;
            },
            setupFrontDiv: (card: Building, div: HTMLElement) => { 
                div.dataset.number = ''+card.number;
                if (card.number) {
                    game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.number),
            cardWidth: 111,
            cardHeight: 173,
        });
    }

    private getGains(gains: { [type: number]: number }): string {
        return Object.entries(gains).map(entry => `<strong>${entry[1]}</strong> ${this.game.getTooltipGain(Number(entry[0]))}`).join(', ');
    }

    private getTooltip(building: Building): string {
        if (building.number === -1) {
            return `<strong>${_('Special Building')}</strong>`;
        }
        let message = `<strong>${_("Cost:")}</strong> ${this.getGains(building.cost)}`;
        if (building.mostRaid) {
            message += `<br><strong>${_("Most raid tokens gains:")}</strong> ${this.getGains(building.mostRaid)}`;
        }
        if (building.fewestRaid) {
            message += `<br><strong>${_("Fewest raid tokens penalties:")}</strong> ${this.getGains(building.fewestRaid)}`;
        }
 
        return message;
    }
}