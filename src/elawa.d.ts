/**
 * Your game interfaces
 */

interface Card {
    id: number;
    location: string;
    locationArg: number;
    points: number;
    color: number;
    number: number;
    cardType: number;
    resources: number[];
    discard: boolean;
    tokens: number;
    power?: number;
    storageType?: number;
    prestoredResource?: Token;
    storedResources?: Token[];
    canStoreResourceType?: boolean;
}

interface Token {
    id: number;
    location: string;
    locationArg: number;
    type: number;
}

interface KnarrPlayer extends Player {
    playerNo: number;
    handCount: number;
    hand?: Card[];
    chief: number;
    played: Card[];
    tokens: Token[];
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
    centerCards: { [position: number]: Card };
    centerCardsCount: { [position: number]: number };
    centerTokens: { [position: number]: Token };
    centerTokensCount: { [position: number]: number };
    fireToken: Token;
    fireTokenCount: number;
    chieftainOption: number;
    lastTurn: boolean;
}

interface KnarrGame extends Game {
    cardsManager: CardsManager;
    tokensManager: TokensManager;
    chiefsManager: ChiefsManager;

    getPlayerId(): number;
    getPlayer(playerId: number): KnarrPlayer;
    getChieftainOption(): number;
    getGameStateName(): string;
    getCurrentPlayerTable(): PlayerTable | null;

    setTooltip(id: string, html: string): void;
    onCenterCardClick(pile: number): void;
    onHandCardClick(card: Card): void;
    onTokenSelectionChange(selection: Token[]): void;
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
    token: Token;
    newToken: Token | null;
} 

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    newCount: number;
    card: Card;
    discardedTokens: Token[];
} 

// discardCard
interface NotifDiscardCardArgs {
    playerId: number;
    card: Card;
} 

// unstoredToken
interface NotifUnstoredTokenArgs {
    playerId: number;
    token: Token;
}

// storedToken
interface NotifStoredTokenArgs extends NotifUnstoredTokenArgs {
    cardId: number;
}
// confirmStoredTokens
interface NotifConfirmStoredTokensArgs {
    playerId: number;
    tokens: { [cardId: number]: Token };
}

// discardTokens
interface NotifDiscardTokensArgs {
    playerId: number;
    keptTokens: Token[];    
    discardedTokens: Token[];
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
    tokens: Token[];
} 
