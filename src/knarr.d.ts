/**
 * Your game interfaces
 */

import { ArtifactsManager } from "./artifacts";
import { CardsManager } from "./cards";
import { DestinationsManager } from "./destinations";
import { PlayerTable } from "./player-table";

export interface Card {
    id: number;
    location: string;
    locationArg: number;
    color: number;
    gain: number;
}

export interface Destination {
    id: number;
    location: string;
    locationArg: number;
    type: number;
    number: number;
    cost: { [color: number]: number };
    immediateGains: { [type: number]: number };
    gains: (number | null)[];
}

export interface Building {
    id: number;
    location: string;
    locationArg: number;
    number: number;
    cost: { [color: number]: number };
    gains: (number | null)[];
    mostRaid: { [type: number]: number };
    fewestRaid: { [type: number]: number };
}

export interface KnarrPlayer extends Player {
    playerNo: number;
    reputation: number;
    recruit: number;
    bracelet: number;
    coin: number;
    //handCount: number;
    hand?: Card[];
    playedCards: { [color: number]: Card[] };
    destinations: Destination[];
    reservedDestinations?: Destination[];
}

export interface KnarrGamedatas {
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
    skaliExpansion: boolean;
    cardDeckTop?: Card;
    cardDeckCount: number;
    cardDiscardCount: number;
    centerCards: Card[];
    centerDestinationsDeckTop: { [letter: string]: Destination };
    centerDestinationsDeckCount: { [letter: string]: number };
    centerDestinations: { [letter: string]: Destination[] };
    centerBuildings?: Building[];
    boatSideOption: number;
    variantOption: number;
    artifacts?: number[];
    firstPlayerId: number;
    lastTurn: boolean;
    reservePossible: boolean;
}

export interface KnarrGame {
    bga: Bga;

    cardsManager: CardsManager;
    destinationsManager: DestinationsManager;
    artifactsManager: ArtifactsManager;

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

export interface EnteringPlayActionArgs {
    canRecruit: boolean;
    canExplore: boolean;
    canTrade: boolean;
    canDevelopVillage: boolean;
    possibleDestinations: Destination[];
    possibleBuildings: Building[];
}

export interface EnteringChooseNewCardArgs {
    centerCards: Card[];
    freeColor: number;
    recruits: number;
    allFree: boolean;
}

export interface EnteringPayDestinationArgs {
    selectedDestination: Destination;
    recruits: number;
}

export interface EnteringTradeArgs {
    bracelets: number;
    gainsByBracelets: { [bracelets: number]: number };
}

// playCard
export interface NotifPlayCardArgs {
    playerId: number;
    card: Card;
    newHandCard: Card;
    effectiveGains: { [type: number]: number };
}

// card
export interface NotifNewCardArgs {
    playerId: number;
    card: Card;
    cardDeckTop?: Card;
    cardDeckCount: number;
}

// takeDestination
export interface NotifTakeDestinationArgs {
    playerId: number;
    destination: Destination;
    effectiveGains: { [type: number]: number };
}

// newTableDestination
export interface NotifNewTableDestinationArgs {
    destination: Destination;
    letter: string;    
    destinationDeckTop?: Destination;
    destinationDeckCount: number;
}

// trade
export interface NotifTradeArgs {
    playerId: number;
    effectiveGains: { [type: number]: number };
}

// discardCards
export interface NotifDiscardCardsArgs {
    playerId: number;
    cards: Card[];
    cardDiscardCount: number;
}

// discardTableCard
export interface NotifDiscardTableCardArgs {
    card: Card;
    cardDiscardCount: number;
}

// reserveDestination
export interface NotifReserveDestinationArgs {
    playerId: number;
    destination: Destination;
}

// score
export interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
}

// cardDeckReset
export interface NotifCardDeckResetArgs {  
    cardDeckTop?: Card;
    cardDeckCount: number;
    cardDiscardCount: number;
}
