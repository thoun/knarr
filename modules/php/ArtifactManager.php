<?php

namespace Bga\Games\Knarr;

class ArtifactManager {
    public function __construct(private Game $game) {
    }

    public function getArtifacts(): array {
        return $this->game->getGlobalVariable(ARTIFACTS, true) ?? [];
    }

    public function hasArtifact(int $artifact): bool {
        return in_array($artifact, $this->getArtifacts());
    }

    public function isReservePossible(): bool {
        return $this->hasArtifact(ARTIFACT_GOLDEN_BRACELET);
    }

    public function getArtifactName(int $artifact) {
        switch ($artifact) {
            case ARTIFACT_MEAD_CUP: return clienttranslate("Mead Cup");
            case ARTIFACT_SILVER_COIN: return clienttranslate("Silver coin");
            case ARTIFACT_CAULDRON: return clienttranslate("Cauldron");
            case ARTIFACT_GOLDEN_BRACELET: return clienttranslate("Golden bracelet");
            case ARTIFACT_HELMET: return clienttranslate("Helmet");
            case ARTIFACT_AMULET: return clienttranslate("Amulet");
            case ARTIFACT_WEATHERVANE: return clienttranslate("Weathervane");
        }
    }

    public function setupArtifacts(int $option, int $playerCount) {
        $availableArtifacts = [1, 2, 3, 4, 5, 6, 7];
        $artifacts = [];

        if ($option == 2 && $playerCount == 2) {
            $artifacts[] = array_shift($availableArtifacts);
        }

        $index = bga_rand(1, count($availableArtifacts)) - 1;
        $artifacts[] = $availableArtifacts[$index];
        array_splice($availableArtifacts, $index, 1);

        $this->game->setGlobalVariable(ARTIFACTS, $artifacts);
    }

    public function isChooseNewCardAllFree(int $playerId): bool {
        if ($this->game->getVariantOption() < 2 || !$this->hasArtifact(ARTIFACT_CAULDRON)) {
            return false;
        }

        $playedCardColor = intval($this->game->getGameStateValue(PLAYED_CARD_COLOR));
        if ($playedCardColor <= 0) {
            return false;
        }

        $playedCardsColors = $this->game->vikingManager->getPlayedCardsColor($playerId);
        $allFree = $playedCardsColors[$playedCardColor] == 2;

        $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);

        return $allFree;
    }

    public function checkArtifacts(int $playerId) {
        if ($this->game->getVariantOption() < 2) {
            return;
        }

        foreach ($this->getArtifacts() as $artifact) {
            $this->checkArtifact($playerId, $artifact);
        }
    }

    public function checkEndTurnArtifacts(int $playerId): bool {
        if ($this->game->getVariantOption() < 2) {
            return true;
        }

        $endTurn = true;
        foreach ($this->getArtifacts() as $artifact) {
            $result = $this->checkEndTurnArtifact($playerId, $artifact);
            if (!$result) {
                $endTurn = false;
            }
        }

        return $endTurn;
    }

    public function handleEndExplore(int $playerId, object $destination, int $destinationIndex): void {
        if ($this->game->getVariantOption() < 2) {
            return;
        }

        $artifacts = $this->getArtifacts();

        if (in_array(ARTIFACT_HELMET, $artifacts) && $destinationIndex > 0 && $destination->type == 2) {
            $previousDestination = $this->game->destinationManager->getDestinationsByLocation('played'.$playerId)[$destinationIndex - 1];
            if ($previousDestination->type == 1) {
                $this->game->setGameStateValue(RECRUIT_DONE, 0);
                $this->game->bga->notify->all('log', clienttranslate('${player_name} can do the recruit action thanks to ${artifact_name} effect'), [
                    'player_name' => $this->game->getPlayerName($playerId),
                    'artifact_name' => $this->getArtifactName(ARTIFACT_HELMET),
                    'i18n' => ['artifact_name'],
                ]);

                $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
            }
        }

        if (in_array(ARTIFACT_MEAD_CUP, $artifacts)) {
            $this->game->setGameStateValue(GO_DISCARD_TABLE_CARD, 1);
            $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
        }
    }

    private function completedAPlayedLine(int $playerId): bool {
        $completedLines = intval($this->game->getGameStateValue(COMPLETED_LINES));
        return $this->game->vikingManager->getCompletedLines($playerId) > $completedLines;
    }

    private function checkArtifact(int $playerId, int $artifact): void {
        switch ($artifact) {
            case ARTIFACT_SILVER_COIN:
                $playedCardColor = intval($this->game->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->game->vikingManager->getPlayedCardsColor($playerId);
                    if ($playedCardsColors[$playedCardColor] > 3) {
                        $groupGains = [VP => 1];
                        [$effectiveGains, $raidTokens] = $this->game->gainResources($playerId, $groupGains, 'artifact:silver-coins');

                        $this->game->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with artifact ${artifact_name} effect'), [
                            'playerId' => $playerId,
                            'player_name' => $this->game->getPlayerName($playerId),
                            'effectiveGains' => $effectiveGains,
                            'gains' => $effectiveGains,
                            'artifact_name' => $this->getArtifactName($artifact),
                            'i18n' => ['artifact_name'],
                        ]);

                        $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                    }
                }
                break;
            case ARTIFACT_GOLDEN_BRACELET:
                $playedCardColor = intval($this->game->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->game->vikingManager->getPlayedCardsColor($playerId);
                    if ($playedCardsColors[$playedCardColor] == 3) {
                        $this->game->setGameStateValue(GO_RESERVE, 1);
                        $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                    }
                }
                break;
        }

        $this->checkEndTurnArtifact($playerId, $artifact);
    }

    private function checkEndTurnArtifact(int $playerId, int $artifact): bool {
        $endTurn = true;

        switch ($artifact) {
            case ARTIFACT_AMULET:
                if ($this->completedAPlayedLine($playerId)) {
                    $this->game->setGameStateValue(COMPLETED_LINES, $this->game->vikingManager->getCompletedLines($playerId));
                    $groupGains = [
                        BRACELET => 1,
                        RECRUIT => 1,
                        REPUTATION => 1,
                    ];
                    [$effectiveGains, $raidTokens] = $this->game->gainResources($playerId, $groupGains, 'artifact:amulet');

                    $this->game->bga->notify->all('trade', clienttranslate('${player_name} gains ${gains} with artifact ${artifact_name} effect'), [
                        'playerId' => $playerId,
                        'player_name' => $this->game->getPlayerName($playerId),
                        'effectiveGains' => $effectiveGains,
                        'gains' => $effectiveGains,
                        'artifact_name' => $this->getArtifactName($artifact),
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                }
                break;
            case ARTIFACT_WEATHERVANE:
                if ($this->completedAPlayedLine($playerId)) {
                    $this->game->setGameStateValue(EXPLORE_DONE, 0);
                    $this->game->setGameStateValue(COMPLETED_LINES, $this->game->vikingManager->getCompletedLines($playerId));

                    $this->game->bga->notify->all('log', clienttranslate('${player_name} can explore with artifact ${artifact_name} effect'), [
                        'playerId' => $playerId,
                        'player_name' => $this->game->getPlayerName($playerId),
                        'artifact_name' => $this->getArtifactName($artifact),
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->game->bga->playerStats->inc('activatedArtifacts', 1, $playerId, updateTableStat: true);
                    $endTurn = false;
                }
                break;
        }

        return $endTurn;
    }
}
