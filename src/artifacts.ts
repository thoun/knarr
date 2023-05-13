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
        });
    }

    private getArtifactName(number: number): string {
        switch (number) {
            case 1: return _("Mobile phone");
            case 2: return _("Minibar");
            case 3: return _("Ghetto blaster");
            case 4: return _("Game console");
            case 5: return _("Pinball Machine");
            case 6: return _("Computer");
            case 7: return _("Moped");
        }     
    }

    private getArtifactEffect(number: number): string {
        switch (number) {
            case 1: return _("before arranging your Primate Assembly, return 1 of the cards you just drew (level 1 or 2) to the bottom of its corresponding deck on the main board. Next, draw the top card from a deck of your choice (same level as the card you removed) and add it to your Primate Assembly. This card permanently replaces the card you removed from your draw deck. The required [Energy] cost depends on the level of the card you removed: 2 [Energy] for a card of level 1, and 3 [Energy] for a card of level 2. You don't receive the rage bonus in the top right corner of the card you removed.");
            case 2: return _("swap 1 of your resources with 1 resource from the general supply. You may swap resources of any type") + '  ([Flower], [Fruit], ' + _("${a} or ${b}").replace('${a}', '[Grain]').replace('${b}', '[Energy]') + ').';
            case 3: return _("before assigning your Primate Assembly, place 1 of the cards you just draw on your discard pile and draw 1 card from your draw pile to replace it.");
            case 4: return _("when discarding the cards in your Primate Assembly, place 1 of these card back on top of your draw pile instead of discarding it.  This costs 3 [Energy] for an ape of level 1, and 5 [Energy] for an ape of level 2.");
            case 5: return _("before assigning your Primate Assembly, draw a 5th card. You have access to an extra card this round.");
            case 6: return _("immediately score 5 [Point].");
            case 7: return _("attract an ape of your choice and place it on top of your draw pile. This costs 6 [Energy] for an ape of level 1, and 9 [Energy] for an ape of level 2.");
        }     
    }

    private getTooltip(number: number): string {
        return `
            <div class="artifact-tooltip">
                <div class="title">${this.getArtifactName(number)}</div>
                <div class="effect"><span class="label">${_('Effect:')}</span> ${this.getArtifactEffect(number)}</div>
            </div>
        `;
    }
}