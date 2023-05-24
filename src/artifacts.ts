class ArtifactsManager extends CardManager<number> {
    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `artifact-${card}`,
            setupDiv: (card: number, div: HTMLElement) => { 
                div.classList.add('artifact');
                game.setTooltip(div.id, this.getTooltip(card));
            },
            setupFrontDiv: (card: number, div: HTMLElement) => { 
                div.dataset.number = ''+card;
            },
            isCardVisible: () => true,
        });
    }

    private getArtifactName(number: number): string {
        switch (number) {
            case 1: return _("Mead Cup");
            case 2: return _("Silver coin");
            case 3: return _("Cauldron");
            case 4: return _("Golden bracelet");
            case 5: return _("Helmet");
            case 6: return _("Amulet");
            case 7: return _("Weathervane");
        }     
    }

    private getArtifactEffect(number: number): string {
        switch (number) {
            case 1: return _("If a player takes an Explore action, they may discard a viking from the board and replace them with the first card from the deck.");
            case 2: return _("For each viking of the same color a player Recruits beyond their 3rd viking of that color, they gain 1 Victory Point.");
            case 3: return _("If a player Recruits a 2nd viking of the same color, they may take the Viking card of their choice instead of the one imposed by the card they played.");
            case 4: return _("If a player recruits a 3rd viking of the same color, they can reserve a Destination card of their choice. It is taken from the available cards and placed next to their playing area. When that player takes an Explore action, they may choose to Explore a destination they have reserved instead of an available destination. Each player can have up to 2 reserved Destination cards at a time.");
            case 5: return _("If a player places a Lands of Influence card which they have just Explored directly onto a Trading Lands card, they may immediately carry out a Recruit action.");
            case 6: return _("If a player completes a line of vikings with all 5 different colors, they can take 1 silver bracelet and 1 recruit, and gains 1 Reputation Point.");
            case 7: return _("If a player completes a line of vikings with all 5 different colors, they can immediately carry out an Explore action. They still have to pay the exploration cost.");
        }     
    }

    private getTooltip(number: number): string {
        return `
            <div class="artifact-tooltip">
                <div class="title">${this.getArtifactName(number)}</div>
                <div class="effect">${this.getArtifactEffect(number)}</div>
            </div>
        `;
    }
}