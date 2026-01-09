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
    reputation: number;
    recruit: number;
    bracelet: number;
    //handCount: number;
    hand?: Card[];
    playedCards: { [color: number]: Card[] };
    destinations: Destination[];
    reservedDestinations?: Destination[];
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
    cardDeckTop?: Card;
    cardDeckCount: number;
    cardDiscardCount: number;
    centerCards: Card[];
    centerDestinationsDeckTop: { [letter: string]: Destination };
    centerDestinationsDeckCount: { [letter: string]: number };
    centerDestinations: { [letter: string]: Destination[] };
    boatSideOption: number;
    variantOption: number;
    artifacts?: number[];
    firstPlayerId: number;
    lastTurn: boolean;
    reservePossible: boolean;
}

interface KnarrGame extends Game {
    cardsManager: CardsManager;
    destinationsManager: DestinationsManager;
    artifactsManager: ArtifactsManager;

    getPlayerId(): number;
    getPlayer(playerId: number): KnarrPlayer;
    //getGain(type: number): string;
    //getColor(color: number): string;
    getTooltipGain(type: number): string;
    getTooltipColor(color: number): string;
    getDestinationType(type: number): string;
    getBoatSide(): number;
    getVariantOption(): number;
    getGameStateName(): string;
    getCurrentPlayerTable(): PlayerTable | null;

    setTooltip(id: string, html: string): void;
    highlightPlayerTokens(playerId: number | null): void;
    onTableDestinationClick(destination: Destination): void;
    onHandCardClick(card: Card): void;
    onTableCardClick(card: Card): void;
    onPlayedCardClick(card: Card): void;
}

interface EnteringPlayActionArgs {
    canRecruit: boolean;
    canExplore: boolean;
    canTrade: boolean;
    possibleDestinations: Destination[];
}

interface EnteringChooseNewCardArgs {
    centerCards: Card[];
    freeColor: number;
    recruits: number;
    allFree: boolean;
}

interface EnteringPayDestinationArgs {
    selectedDestination: Destination;
    recruits: number;
}

interface EnteringTradeArgs {
    bracelets: number;
    gainsByBracelets: { [bracelets: number]: number };
}

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    card: Card;
    newHandCard: Card;
    effectiveGains: { [type: number]: number };
}

// card
interface NotifNewCardArgs {
    playerId: number;
    card: Card;
    cardDeckTop?: Card;
    cardDeckCount: number;
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
    destinationDeckTop?: Destination;
    destinationDeckCount: number;
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
    cardDiscardCount: number;
}

// discardTableCard
interface NotifDiscardTableCardArgs {
    card: Card;
    cardDiscardCount: number;
}

// reserveDestination
interface NotifReserveDestinationArgs {
    playerId: number;
    destination: Destination;
}

// score
interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
}

// cardDeckReset
interface NotifCardDeckResetArgs {  
    cardDeckTop?: Card;
    cardDeckCount: number;
    cardDiscardCount: number;
}
