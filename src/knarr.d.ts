/**
 * Your game interfaces
 */

interface Card {
    id: number;
    location: string;
    locationArg: number;
    color: number;
    gain: number;
}

interface Destination {
    id: number;
    location: string;
    locationArg: number;
    type: number;
    number: number;
    cost: { [color: number]: number };
    immediateGains: { [type: number]: number };
    gains: (number | null)[];
}

interface KnarrPlayer extends Player {
    playerNo: number;
    fame: number;
    recruit: number;
    bracelet: number;
    handCount: number;
    hand?: Card[];
    playedCards: { [color: number]: Card[] };
    tokens: Destination[];
}

interface KnarrGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: KnarrPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    centerCards: Card[];
    centerDestinations: { [letter: string]: Destination[] };
    boatSideOption: number;
    variantOption: number;
    lastTurn: boolean;
}

interface KnarrGame extends Game {
    cardsManager: CardsManager;
    destinationsManager: DestinationsManager;

    getPlayerId(): number;
    getPlayer(playerId: number): KnarrPlayer;
    getBoatSide(): number;
    getVariantOption(): number;
    getGameStateName(): string;
    getCurrentPlayerTable(): PlayerTable | null;

    setTooltip(id: string, html: string): void;
    onTableDestinationClick(destination: Destination): void;
    onHandCardClick(card: Card): void;
}

interface EnteringPlayActionArgs {
    canDoAction: boolean;
    canTrade: boolean;
}

interface EnteringTradeArgs {
    bracelets: number;
}

// score
interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
}