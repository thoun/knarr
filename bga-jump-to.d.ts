interface JumpToEntrySettings {
    color?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    classes?: string;
    id?: string;
    html?: string;
}

declare class JumpToEntry {
    label: string;
    target: string | HTMLElement;
    settings?: JumpToEntrySettings;

    constructor(label: string, target: string | HTMLElement, settings?: JumpToEntrySettings);
}

interface BgaPlayer {
    id: number | string;
    name: string;
    color: string;
}

interface BgaObject {
    gameui: {
        gamedatas: {
            playerorder: (number | string)[];
            players: { [playerId: number]: BgaPlayer };
        };
    };
    players: {
        getPlayerAvatarUrl: (playerId: number | string, size?: number) => string;
    };
}

interface BgaPlayerEntriesSettings {
    playerOrder?: (number | string)[];
    entryTarget?: (playerId: number, player: BgaPlayer) => string | HTMLElement;
    entrySettings?: (playerId: number, player: BgaPlayer) => JumpToEntrySettings;
}

declare function BgaPlayerEntries(bga: BgaObject, settings?: BgaPlayerEntriesSettings): JumpToEntry[];

interface JumpToSettings {
    localStorageFoldedKey?: string;
    entries: JumpToEntry[];
    defaultFolded?: boolean;
    element?: HTMLElement;
}

declare class JumpToManager {
    constructor(settings: JumpToSettings);
}

declare const BgaJumpTo: {
    Entry: typeof JumpToEntry;
    Manager: typeof JumpToManager;
    BgaPlayerEntries: typeof BgaPlayerEntries;
};

export { BgaJumpTo, BgaPlayerEntries, JumpToEntry as Entry, JumpToManager as Manager };
