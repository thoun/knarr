const CARD_OVERLAP = 40;
const FIRST_ANIMAL_SHIFT = 28;

class FerrySpot {

    public animals: Animal[] = [];
    private empty: boolean = false;

    constructor(
        private game: NoahGame,
        public position: number,
        ferry: Ferry,
        withAnimation: boolean = false
    ) { 
        let html = `
        <div id="ferry-spot-${position}" class="ferry-spot" ${withAnimation ? '' : ` style="transform: ${this.getFerryTransform()}"`}>
            <div id="ferry-spot-${position}-ferry-card" class="stockitem ferry-card"></div>      
        `;
        html += `</div>
        <div id="ferry-spot-${position}-weight-indicator" class="weight-indicator remaining-counter" data-position="${position}"></div>`;

        dojo.place(html, 'center-board');
        dojo.toggleClass(`ferry-spot-${position}-ferry-card`, 'roomates', ferry?.roomates);
        let tooltip = `
        <h3>${_('Ferry')}</h3>
        <div>${_('Animals are loaded into Ferries.')}</div>
        <h4>${_('Gender')}</h4>
        <div class="noah-tooltip-with-list">${_(`In a given ferry, there must be:
<ul>
    <li>EITHER animals from a single gender</li>
    <li>OR a perfect alternating order Male/Female (or Female/Male)</li>
</ul>
As such, it’s always the second card played on an ferry which defines the sequence to be played!`)}</div>

        <h4>${_('Weight')}</h4>
        <div>${_('In a given ferry, the total weight cannot exceed 21 (otherwise, the ferry capsizes).')}</div>`;
        if (ferry?.roomates) {
            tooltip += `<h4>${_('Roomates')}</h4>
            <div>${_('in the Ark, it is impossible to place twice the same animal, whether male or female.')}</div>`;
        }
        game.setTooltip(`ferry-spot-${position}-ferry-card`, tooltip);

        if (withAnimation) {
            setTimeout(() => document.getElementById(`ferry-spot-${position}`).style.transform = this.getFerryTransform());
        }

        if (ferry) {
            ferry.animals?.forEach(animal => this.addAnimal(animal));
        } else {
            this.empty = true;            
            dojo.addClass(`ferry-spot-${this.position}-ferry-card`, 'empty');
        }
        this.updateCounter();
    }

    private getFerryTransform() {
        const angle = 72 * this.position + 90;
        return `rotate(${angle > 180 ? angle-360 : angle}deg) translateY(222px)`;
    }

    public setActive(active: boolean): void {
        dojo.toggleClass(`ferry-spot-${this.position}`, 'active', active);
    }

    public addAnimal(animal: Animal, originId?: string, xShift: number = 0) {
        const top = FIRST_ANIMAL_SHIFT + this.animals.length * CARD_OVERLAP;
        const id = `ferry-spot-${this.position}-animal${animal.id}`;
        let html = `<div id="${id}" data-id="${animal.id}" class="animal-card" style="top: ${top}px; background-position: ${getBackgroundPosition(animal)};`;
        

        if (originId) {
            const originBR = document.getElementById(originId).getBoundingClientRect();
            const destination = document.getElementById(`center-board`);
            const destinationBR = destination.getBoundingClientRect();
            const xdiff = originBR.x - destinationBR.x;
            const ydiff = originBR.y - destinationBR.y + Number(destination.style.marginLeft.replace('px', ''));
            let deg = -(72 * this.position + 90);
            if (this.position > 1) {
                deg += 360;
            }

            html += `transform: translate(2px, -${222 + top}px) rotate(${deg}deg) translate(-164px, -233px) translate(${xdiff + xShift}px, ${ydiff}px);`;
        }

        html += `"></div>`;

        this.animals.push(animal);

        dojo.place(html, `ferry-spot-${this.position}`);

        const animalDiv = document.getElementById(id) as HTMLDivElement;
        setupAnimalCard(this.game, animalDiv, getUniqueId(animal));
        // animalDiv.style.transform = window.getComputedStyle(animalDiv).transform;

        animalDiv.addEventListener('click', () => this.game.tableCardSelected(animal.id));

        if (originId) {
            const card = document.getElementById(`ferry-spot-${this.position}-animal${animal.id}`);
            card.style.transition = `transform 0.5s`;
            setTimeout(() => card.style.transform = `unset`);
        }

        this.updateCounter();
    }

    public removeAnimals() {
        this.animals.forEach(animal => dojo.destroy(`ferry-spot-${this.position}-animal${animal.id}`));
        this.animals = [];

        this.updateCounter();
    }
    
    public removeFirstAnimalFromFerry() {
        if (this.animals.length) {
            const removedAnimalId = this.animals.shift().id;
            dojo.destroy(`ferry-spot-${this.position}-animal${removedAnimalId}`);
            this.animals.forEach((animal, index) => document.getElementById(`ferry-spot-${this.position}-animal${animal.id}`).style.top = `${FIRST_ANIMAL_SHIFT + index * CARD_OVERLAP}px`);
            this.updateCounter();
        }
    }

    public departure() {
        const counter = document.getElementById(`ferry-spot-${this.position}-weight-indicator`) as HTMLDivElement;
        counter.parentElement?.removeChild(counter);

        (Array.from(document.querySelectorAll(`[id^="ferry-spot-${this.position}"]`)) as HTMLDivElement[]).forEach(elem => 
            elem.id = `departure-${elem.id}`
        );

        const spotDiv = document.getElementById(`departure-ferry-spot-${this.position}`);
        spotDiv.addEventListener('transitionend', () => spotDiv.parentElement?.removeChild(spotDiv));
        spotDiv.style.transform = `rotate(${72 * this.position + 90}deg) translateY(1500px)`;
        spotDiv.style.opacity = '0';
    }

    private updateCounter() {
        let text = '';
        if (!this.empty) {
            text = `${this.animals.reduce((sum, animal) => sum + animal.weight, 0)} / ${this.animals.some(animal => animal.power == 5) ? 13 : 21}`;
        }
        document.getElementById(`ferry-spot-${this.position}-weight-indicator`).innerHTML = text;
    }
    
    public newRound(ferry: Ferry) {
        this.empty = false;
        dojo.removeClass(`ferry-spot-${this.position}-ferry-card`, 'empty');
        this.removeAnimals();
        ferry.animals.forEach(animal => this.addAnimal(animal, 'topbar'));

        this.updateCounter();
    }

    public removeAnimalToDeck(animal: Animal) {
        this.animals.splice(this.animals.findIndex(a => a.id == animal.id), 1);
        this.updateCounter();

        dojo.destroy(`ferry-spot-${this.position}-animal${animal.id}`);
        this.animals.forEach((animal, index) => document.getElementById(`ferry-spot-${this.position}-animal${animal.id}`).style.top = `${FIRST_ANIMAL_SHIFT + index * CARD_OVERLAP}px`);
    }
}