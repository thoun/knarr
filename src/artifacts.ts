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
            case 2: return _("Silver coins");
            case 3: return _("Caldron");
            case 4: return _("Golden bracelet");
            case 5: return _("Helmet");
            case 6: return _("Amulet");
            case 7: return _("Weatherclock");
        }     
    }

    private getArtifactEffect(number: number): string {
        switch (number) { // TODO
            case 1: return _("Si vous effectuez l’action Explorer, vous pouvez défausser un viking du plateau et le remplacer par le 1er de la pioche.");
            case 2: return _("Pour chaque viking recruté au-delà du 3e viking de même couleur, vous gagnez 1 point de victoire.");
            case 3: return _("Si vous recrutez le 2nd viking de même couleur, vous pouvez prendre la carte viking de votre choix au lieu de celle imposée par la carte jouée.");
            case 4: return _("Si vous recrutez le 3e viking de même couleur, vous pouvez réserver une carte destination de votre choix. Prenez-la parmi les cartes visibles et posez-la à côté de votre aire de jeu. Lorsque vous faites l’action Explorer, vous pouvez désormais choisir d’explorer une destination réservée à la place d’une destination visible. Vous pouvez avoir jusqu’à deux cartes destination réservées.");
            case 5: return _("Si vous placez la carte terre d’influence que vous venez d’explorer, directement sur une carte terre d’échange, vous pouvez effectuer immédiatement l’action Recruter.");
            case 6: return _("Si vous complétez une ligne de cinq vikings de couleurs différentes, vous pouvez prendre un bracelet en argent, une recrue et un point de renommée.");
            case 7: return _("Si vous complétez une ligne de cinq vikings de couleurs différentes, vous pouvez effectuer immédiatement l’action Explorer. Vous devez toujours payer le coût d’exploration.");
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