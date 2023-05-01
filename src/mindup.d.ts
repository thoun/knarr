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
}

interface KnarrPlayer extends Player {
    playerNo: number;
    scoresCards: Card[][];
    hand?: Card[];
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
    selected: Card[];
    table: Card[];
    costs: number[];
    objectives: number[];
}

interface KnarrGame extends Game {
    cardsManager: CardsManager;

    getPlayerId(): number;
    getPlayer(playerId: number): KnarrPlayer;

    setTooltip(id: string, html: string): void;
    onHandCardClick(card: Card): void;
}

interface EnteringChooseMarketCardArgs {
    canPlaceOnLine: Card[];
    canAddToLine: boolean;
    canAddToHand: boolean;
    mustClose: boolean;
    canClose: boolean;
}

interface EnteringPlayCardArgs {
    canPlaceOnLine: Card[];
    canClose: boolean;
    onlyClose: boolean;
}

interface EnteringPlayHandCardArgs {
    canPlaceOnLine: Card[];
}

// newRound
interface NotifNewRoundArgs {
    number: number;
    costs: number[];
}

// selectedCard
interface NotifSelectedCardArgs {
    playerId: number;
    card: Card;
    cancel: boolean;
} 

// revealCards
interface NotifRevealCardsArgs {
    cards: Card[];
}

// placeCardUnder
interface NotifPlayerCardArgs {
    card: Card;
    playerId: number;
}

interface NotifScoredCardArgs extends NotifPlayerCardArgs {
    playerScore: number;
    incScore: number;
}

interface NotifNewObjectivesArgs {
    objectives: number[];
}
