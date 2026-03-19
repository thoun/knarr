import { KnarrGame, KnarrGamedatas, KnarrPlayer } from "../knarr";

export class RenewBuildings {
    private renewButton: HTMLButtonElement;

    constructor(private game: KnarrGame, private bga: Bga<KnarrPlayer, KnarrGamedatas>) {
    }

    /**
     * This method is called each time we are entering the game state. You can use this method to perform some user interface changes at this moment.
     */
    onEnteringState(args: any[], isCurrentPlayerActive: boolean) {
        if (isCurrentPlayerActive) {
            this.renewButton = this.bga.statusBar.addActionButton(_('Renew selected Buildings'), () => this.bga.actions.performAction("actRenewBuildings", { ids: [] /* TODO*/ }), { disabled: true }); 
            this.bga.statusBar.addActionButton(_('Cancel'), () => this.bga.actions.performAction("actCancel"), { color: 'secondary' }); 
        }
    }

    
    onTableBuildingSelectionChange() {
        // TODO get selection and set   this.renewButton.disabled      
    }
}
