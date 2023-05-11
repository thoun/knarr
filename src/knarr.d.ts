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
    playedCards: Card[];
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
    onCenterCardClick(pile: number): void;
    onHandCardClick(card: Card): void;
    onTokenSelectionChange(selection: Destination[]): void;
    storeToken(cardId: number, tokenType: number): void;
    unstoreToken(tokenId: number): void;
}

interface EnteringTakeCardArgs {
    playerId: number;
}

interface EnteringSkipResourceArgs {
    pile: number;
    resources: number[];
}

interface EnteringPlayCardArgs {
    playableCards: Card[];
    canStore: boolean;
}

interface EnteringChooseOneLessArgs {
    canSkipDiscard: boolean;
    tokens: number[];
}

interface EnteringDiscardCardArgs extends EnteringPlayCardArgs {
    selectedCard: Card;
}

interface NotifTakeElementArgs {
    playerId: number;
    pile: number;
    newCount: number;
} 

// takeCard
interface NotifTakeCardArgs extends NotifTakeElementArgs {
    card: Card;
    newCard: Card | null;
} 

// takeToken
interface NotifTakeTokenArgs extends NotifTakeElementArgs {
    token: Destination;
    newToken: Destination | null;
} 

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    newCount: number;
    card: Card;
    discardedTokens: Destination[];
} 

// discardCard
interface NotifDiscardCardArgs {
    playerId: number;
    card: Card;
} 

// unstoredToken
interface NotifUnstoredTokenArgs {
    playerId: number;
    token: Destination;
}

// storedToken
interface NotifStoredTokenArgs extends NotifUnstoredTokenArgs {
    cardId: number;
}
// confirmStoredTokens
interface NotifConfirmStoredTokensArgs {
    playerId: number;
    tokens: { [cardId: number]: Destination };
}

// discardTokens
interface NotifDiscardTokensArgs {
    playerId: number;
    keptTokens: Destination[];    
    discardedTokens: Destination[];
}

// updateScore
interface NotifUpdateScoreArgs {
    playerId: number;
    playerScore: number;
} 

// cancelLastMoves
interface NotifCancelLastMovesArgs {
    playerId: number;
    cards: Card[];
    tokens: Destination[];
} 
