const POINT_CASE_SIZE_LEFT = 38.8;
const POINT_CASE_SIZE_TOP = 37.6;

class TableCenter {
    public destinations: SlotStock<Destination>[] = [];
    public cards: SlotStock<Card>;
    private vp = new Map<number, number>();
    private fame = new Map<number, number>();
        
    constructor(private game: KnarrGame, gamedatas: KnarrGamedatas) {
        ['A', 'B'].forEach(letter => {
            this.destinations[letter] = new SlotStock<Destination>(game.destinationsManager, document.getElementById(`table-destinations-${letter}`), {
                slotsIds: [1, 2, 3],
                mapCardToSlot: card => card.locationArg,
            });
            this.destinations[letter].addCards(gamedatas.centerDestinations[letter]);
            this.destinations[letter].onCardClick = (card: Destination) => this.game.onTableDestinationClick(card);
        })

        this.cards = new SlotStock<Card>(game.cardsManager, document.getElementById(`table-cards`), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: card => card.locationArg,
            gap: '12px',
        });
        this.cards.addCards(gamedatas.centerCards);

        const players = Object.values(gamedatas.players);
        let html = '';
        // points
        players.forEach(player =>
            html += `
            <div id="player-${player.id}-vp-marker" class="vp marker ${/*this.game.isColorBlindMode() ? 'color-blind' : */''}" data-player-no="${player.playerNo}" data-color="${player.color}"></div>
            <div id="player-${player.id}-fame-marker" class="fame marker ${/*this.game.isColorBlindMode() ? 'color-blind' : */''}" data-player-no="${player.playerNo}" data-color="${player.color}"></div>
            `
        );
        dojo.place(html, 'board');
        players.forEach(player => {
            this.vp.set(Number(player.id), Number(player.score));
            this.fame.set(Number(player.id), Math.min(14, Number(player.fame)));
        });
        this.moveVP();
        this.moveFame();
    }
    
    public newTableCard(card: Card) {
        this.cards.addCard(card, {
            fromElement: document.getElementById(`board`)
        });
    }
    
    public newTableDestination(destination: Destination, letter: string) {
        this.destinations[letter].addCard(destination, {
            fromElement: document.getElementById(`board`)
        });
    } 
    
    public setDestinationsSelectable(selectable: boolean, selectableCards: Destination[] | null = null) {
        ['A', 'B'].forEach(letter => {
            this.destinations[letter].setSelectionMode(selectable ? 'single' : 'none');
            this.destinations[letter].getCards().forEach(card => {
                const element = this.destinations[letter].getCardElement(card);
                const disabled = selectable && selectableCards != null && !selectableCards.some(s => s.id == card.id);
                element.classList.toggle('disabled', disabled);
                element.classList.toggle('selectable', selectable && !disabled);
            });
        });
    }

    private getVPCoordinates(points: number) {
        const cases = points % 40;

        const top = cases >= 16 ? (cases > 36 ? (40 - cases) : Math.min(4, cases - 16)) * POINT_CASE_SIZE_TOP : 0;
        const left = cases > 20 ? (36 - Math.min(cases, 36)) * POINT_CASE_SIZE_LEFT : Math.min(16, cases) * POINT_CASE_SIZE_LEFT;

        return [22 + left, 39 + top];
    }

    private moveVP() {
        this.vp.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-vp-marker`);

            const coordinates = this.getVPCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
    
            let topShift = 0;
            let leftShift = 0;
            this.vp.forEach((iPoints, iPlayerId) => {
                if (iPoints % 40 === points % 40 && iPlayerId < playerId) {
                    topShift += 5;
                    //leftShift += 5;
                }
            });
    
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }
    
    setScore(playerId: number, points: number) {
        this.vp.set(playerId, points);
        this.moveVP();
    }

    private getFameCoordinates(points: number) {
        const cases = points;

        const top = cases % 2 ? -14 : 0;
        const left = cases * 16.9;

        return [368 + left, 123 + top];
    }

    private moveFame() {
        this.fame.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-fame-marker`);

            const coordinates = this.getFameCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
    
            let topShift = 0;
            let leftShift = 0;
            this.fame.forEach((iPoints, iPlayerId) => {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    //leftShift += 5;
                }
            });
    
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }
    
    setFame(playerId: number, fame: number) {
        this.fame.set(playerId, Math.min(14, fame));
        this.moveFame();
    }
}