import { Building, KnarrGame, RaidToken } from "./knarr";
import { BgaCards } from "./libs";

export class RaidTokenManager extends BgaCards.CardManager<RaidToken> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card: Building) => `raid-token-${card.id}`,
            setupDiv: (card: Building, div: HTMLElement) => {
                div.classList.add('knarr-raid-token');
                div.dataset.cardId = ''+card.id;
            },
            isCardVisible: () => true,
            cardWidth: 32,
            cardHeight: 32,
        });
    }
}