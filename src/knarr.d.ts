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
    destinations: Destination[];
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
    onPlayedCardClick(): void;
}

interface EnteringPlayActionArgs {
    canDoAction: boolean;
    canTrade: boolean;
    possibleDestinations: Destination[];
}

interface EnteringPayDestinationArgs {
    selectedDestination: Destination;
    recruits: number;
}

interface EnteringTradeArgs {
    bracelets: number;
}

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    playedCard: Card;
    newHandCard: Card;
    effectiveGains: { [type: number]: number };
}

// card
interface NotifNewCardArgs {
    playerId: number;
    card: Card;
}

// takeDestination
interface NotifTakeDestinationArgs {
    playerId: number;
    destination: Destination;
    effectiveGains: { [type: number]: number };
}

// newTableDestination
interface NotifNewTableDestinationArgs {
    destination: Destination;
    letter: string;
}

// trade
interface NotifTradeArgs {
    playerId: number;
    effectiveGains: { [type: number]: number };
}

// discardCards
interface NotifDiscardCardsArgs {
    playerId: number;
    cards: Card[];
}

// score
interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
}
