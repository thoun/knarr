const HOUSE = 1;
const STORAGE = 2;
const HUMAN = 3;
const TOOL = 4;

class CardsManager extends CardManager<Card> {
    private prestorageStocks: LineStock<Token>[] = [];
    private storageStocks: LineStock<Token>[] = [];

    constructor (public game: KnarrGame) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                div.classList.add('knarr-card');
                div.dataset.cardId = ''+card.id;
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => { 
                div.dataset.cardId = `${this.getId(card)}-front`;
                div.dataset.color = ''+card.color;
                div.dataset.number = ''+card.number;
                game.setTooltip(div.id, this.getTooltip(card));

                if (card.cardType == STORAGE) {
                    div.classList.add('storage-stock');
                    
                    this.storageStocks[card.id] = new LineStock<Token>(game.tokensManager, div);

                    this.setStoreButtons(card);
                    if (card.storedResources) {
                        this.storageStocks[card.id].addCards(card.storedResources);
                    }
                }
            },
        });
    }
    
    public prestoreToken(cardId: number, token: Token) {
        this.prestorageStocks[cardId].addCard(token);
    }
    
    public confirmStoreToken(cardId: number, token: Token): void {
        this.storageStocks[cardId].addCard(token);
    }

    private getType(type: number): string {
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

    private getPower(power: number): string {
        switch (power) {
            case 10: return _("When a player places this card in front of them, they take 1 visible card from the top of any pile. They do not take the associated resources.");
            case 11: return _("When a player places this card in front of them, they take 1 resource at random from the resource pool.");
        }
    }

    private getTooltip(card: Card): string {
        let message = `<strong>${_("Points:")}</strong> ${card.points}`;
        if (card.cardType == HOUSE) {
            message += ` / ${this.getColor(card.storageType)}`;
        } else if (card.cardType == STORAGE) {
            message += ` / ${this.game.tokensManager.getType(card.storageType)}`;
        } else if (card.cardType == TOOL) {
            message += ` / ${this.getType(card.storageType)}`;
        }

        message += `
        <br>
        <strong>${_("Type:")}</strong> ${this.getType(card.cardType)}
        <br>
        <strong>${_("Color:")}</strong> ${this.getColor(card.color)}
        <br>
        <strong>${_("Required resources:")}</strong> `;
        if (!card.discard && !card.resources.length) {
            message += _('None');
        } else {
            const resources = [];
            if (card.discard) {
                resources.push(_('discard 1 tribe card from hand'));
            }
            card.resources.forEach(type => resources.push(this.game.tokensManager.getType(type)));
            message += resources.join(', ');
        }

        if (card.power) {
            message += `
            <br>
            <strong>${_("Power:")}</strong> ${this.getPower(card.power)}`;
        }

        message += `
        <br>
        <strong>${_("Resources to take:")}</strong> ${card.tokens}`;
 
        return message;
    }

    public storageCardHasTokenOfType(cardId: number, type: number): boolean {
        return this.storageStocks[cardId].getCards().some(card => card.type == type);
    }

    private createStorageStock(card: Card, storageActions: HTMLElement) {
        const storageStock = document.createElement('div');
        storageStock.dataset.used = 'false';
        storageStock.classList.add('storage-stock');
        storageActions.appendChild(storageStock);    
        this.prestorageStocks[card.id] = new LineStock<Token>(this.game.tokensManager, storageStock);
        if (card.prestoredResource) {
            this.prestorageStocks[card.id].addCard(card.prestoredResource);
        }
        storageActions.dataset.used = Boolean(card.prestoredResource).toString();
        this.createCancelButton(storageStock, storageActions, this.prestorageStocks[card.id]);
    } 

    private createStorageAction(cardId: number, storageActions: HTMLElement, type: number) {
        const storageAction = document.createElement('div');
        storageAction.classList.add('storage-action');
        storageActions.appendChild(storageAction);
        const button = document.createElement('button');
        button.classList.add('bgabutton', 'bgabutton_blue');
        button.dataset.type = ''+type;
        storageAction.appendChild(button);
        button.innerHTML = _("Store ${type}").replace('${type}', `<div class="token-icon" data-type="${type}"></div>`);    

        button.addEventListener('click', () => {
            //const token = this.game.getCurrentPlayerTable()?.getTokenOfType(type);

            this.game.storeToken(cardId, type);

            /*stock.addCard(token);
            storageActions.dataset.used = 'true';
            storageActions.dataset.tokenId = ''+token.id;


            setTimeout(() => {
                button.classList.add('hidden');
                this.updateStorageButtons();
            });*/
        })
    } 

    private createCancelButton(storageAction: HTMLDivElement, storageActions: HTMLElement, stock: LineStock<Token>) {
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('cancel');
        cancelButton.innerText = '✖';
        storageAction.appendChild(cancelButton);
        cancelButton.addEventListener('click', () => {
            this.game.unstoreToken(stock.getCards()[0].id);
            /*storageActions.dataset.used = 'false';
            this.tokensFree.addCard(stock.getCards()[0]);
            button.classList.remove('hidden');
            cancelButton.remove();
            storageActions.dataset.tokenId = '';
            this.updateStorageButtons();*/
        });
    }

    public setStoreButtons(card: Card) {
        const storageActions = document.createElement('div');
        storageActions.dataset.cardId = ''+card.id;
        storageActions.classList.add('storage-actions');
        storageActions.dataset.tokenId = '';
        this.game.cardsManager.getCardElement(card).appendChild(storageActions);

        this.createStorageStock(card, storageActions);
        const possibleTypes = card.storageType ? [card.storageType, BONE] : [1, 2, 3, 4, BONE];
        possibleTypes.forEach(type => this.createStorageAction(card.id, storageActions, type))
    }    

    public updateStorageButtons() {
        document.querySelectorAll('.storage-actions').forEach((storageActions: HTMLElement) => 
            storageActions.dataset.used = (!this.prestorageStocks[Number(storageActions.dataset.cardId)].isEmpty()).toString()
        );

        document.querySelectorAll('.storage-action button').forEach((button: HTMLElement) => 
            button.classList.toggle('disabled', this.game.getCurrentPlayerTable()?.getTokenOfType(Number(button.dataset.type)) == null)
        );
    }
}