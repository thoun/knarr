import { KnarrGame, KnarrGamedatas, KnarrPlayer } from "../knarr";

export class RenewBuildings {
    private renewButton: HTMLButtonElement;

    constructor(private game: KnarrGame, private bga: Bga<KnarrPlayer, KnarrGamedatas>) {
    }

    onEnteringState(args: any[], isCurrentPlayerActive: boolean) {
        if (isCurrentPlayerActive) {
            this.renewButton = this.bga.statusBar.addActionButton(_('Renew selected Buildings'), () => this.bga.actions.performAction("actRenewBuildings", { ids: this.game.tableCenter.getSelectedBuildings().map(building => building.id) }), { disabled: true }); 
            this.bga.statusBar.addActionButton(_('Cancel'), () => this.bga.actions.performAction("actCancel"), { color: 'secondary' }); 
            this.game.tableCenter.setBuildingsSelectable(true, null, true);
        }
    }

    onLeavingState(args: any[], isCurrentPlayerActive: boolean) {
        if (isCurrentPlayerActive) {
            this.game.tableCenter.setBuildingsSelectable(false);
        }
    }

    
    onTableBuildingSelectionChange() {
        const selection = this.game.tableCenter.getSelectedBuildings();
        this.renewButton.disabled = selection.length === 0 || selection.length > 2;    
    }
}
