<?php

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_findIndex(array $array, callable $fn) {
        $index = 0;
        foreach ($array as $value) {
            if($fn($value)) {
                return $index;
            }
            $index++;
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function deleteGlobalVariables(array $names) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` in (".implode(',', array_map(fn($name) => "'$name'", $names)).")");
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getRoundCardCount() {
        return count($this->getPlayersIds()) + 2;
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayer(int $id) {
        $sql = "SELECT * FROM player WHERE player_id = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new KnarrPlayer($dbResult), array_values($dbResults))[0];
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
        }
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->score,
            'incScore' => $amount,
        ] + $args);

        $this->checkMaxScore($playerId);
    }

    function checkMaxScore(int $playerId) {
        if (!boolval($this->getGameStateValue(LAST_TURN)) && $this->getPlayer($playerId)->score >= 40) {
            $this->setGameStateValue(LAST_TURN, 1);

            self::notifyAllPlayers('lastTurn', clienttranslate('${player_name} reached 40 Victory Points, triggering the end of the game!'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);
        }
    }

    function incPlayerRecruit(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_recruit` = `player_recruit` + $amount WHERE player_id = $playerId");
        }

        $this->notifyAllPlayers('recruit', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->recruit,
            'incScore' => $amount,
        ] + $args);
    }

    function incPlayerBracelet(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_bracelet` = `player_bracelet` + $amount WHERE player_id = $playerId");
        }

        $this->notifyAllPlayers('bracelet', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->bracelet,
            'incScore' => $amount,
        ] + $args);
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function getCardById(int $id) {
        $sql = "SELECT * FROM `card` WHERE `card_id` = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        $cards = array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
        return count($cards) > 0 ? $cards[0] : null;
    }

    function getCardsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `card` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
    }

    function setupCards(array $playersIds) {
        $playerCount = count($playersIds);
        foreach ($this->CARDS as $cardType) {
            $cards[] = [ 'type' => $cardType->color, 'type_arg' => $cardType->gain, 'nbr' => $cardType->number[$playerCount] ];
        }
        $this->cards->createCards($cards, 'deck');
        $this->cards->shuffle('deck');

        foreach ([1,2,3,4,5] as $slot) {
            $this->cards->pickCardForLocation('deck', 'slot', $slot);
        }

        foreach ($playersIds as $playerId) {
            $playedCards = $this->getCardsFromDb($this->cards->pickCardsForLocation(2, 'deck', 'played'.$playerId));
            while ($playedCards[0]->color == $playedCards[1]->color) {
                $this->cards->moveAllCardsInLocation('played'.$playerId, 'deck');
                $this->cards->shuffle('deck');
                $playedCards = $this->getCardsFromDb($this->cards->pickCardsForLocation(2, 'deck', 'played'.$playerId));
            }
            foreach ($playedCards as $playedCard) {
                $this->cards->moveCard($playedCard->id, 'played'.$playerId.'-'.$playedCard->color);
            }

            $this->cards->pickCardsForLocation(3, 'deck', 'hand', $playerId);
        }
    }

    function getDestinationFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Destination($dbCard, $this->DESTINATIONS);
    }

    function getDestinationsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getDestinationFromDb($dbCard), array_values($dbCards));
    }

    function getDestinationsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `destination` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getDestinationFromDb($dbCard), array_values($dbResults));
    }

    function setupDestinations() {
        $cards[] = ['A' => [], 'B' => []];
        foreach ($this->DESTINATIONS as $number => $destinationType) {
            $cards[$number > 20 ? 'B' : 'A'][] = [ 'type' => $number > 20 ? 2 : 1, 'type_arg' => $number, 'nbr' => 1 ];
        }
        foreach (['A', 'B'] as $type) {
            $this->destinations->createCards($cards[$type], 'deck'.$type);
            $this->destinations->shuffle('deck'.$type);
        }

        foreach ([1,2,3] as $slot) {
            foreach (['A', 'B'] as $type) {
                $this->destinations->pickCardForLocation('deck'.$type, 'slot'.$type, $slot);
            }
        }
    }

    function getBoatSideOption() {
        return intval($this->getGameStateValue(BOAT_SIDE_OPTION));
    }

    function getVariantOption() {
        return intval($this->getGameStateValue(VARIANT_OPTION));
    }

    function getBoatGain() {
        return $this->getBoatSideOption() == 2 ? [VP, null, BRACELET] : [null, RECRUIT, null];
    } 
    
    function redirectAfterAction(int $playerId, bool $checkArtifacts) {
        if ($checkArtifacts && $this->getVariantOption() >= 2) {
            $this->checkArtifacts($playerId);
        }

        if (boolval($this->getGameStateValue(GO_RESERVE))) {
            $this->incGameStateValue(GO_RESERVE, -1);
            $this->setGameStateValue(PLAYED_CARD_COLOR, 0);
            $reserved = $this->getDestinationsByLocation('reserved', $playerId);
            if (count($reserved) >= 2) {
                self::notifyAllPlayers('log', clienttranslate('${player_name} cannot reserve a destination because he already has 2'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                ]);
            } else {
                $this->gamestate->nextState('reserve');
                return;
            }
        }
        if (boolval($this->getGameStateValue(GO_DISCARD_TABLE_CARD))) {
            $this->incGameStateValue(GO_DISCARD_TABLE_CARD, -1);
            $this->gamestate->nextState('discardTableCard');
            return;
        }

        $args = $this->argPlayAction();

        $canPlay = $args['canRecruit'] || $args['canExplore'] || $args['canTrade'];

        if ($canPlay) {
            $this->gamestate->nextState('next');
        } else {
            $endTurn = $this->checkEndTurnArtifacts($playerId);

            $this->gamestate->nextState(!$endTurn ? 'next' : 'endTurn');
        }
    }
    
    function groupGains(array $gains) {
        $groupGains = [];

        foreach ($gains as $gain) {
            if (array_key_exists($gain, $groupGains)) {
                $groupGains[$gain] += 1;
            } else {
                $groupGains[$gain] = 1;
            }
        }

        return $groupGains;
    }
    
    function gainResources(int $playerId, array $groupGains, string $phase) {
        $player = $this->getPlayer($playerId);

        $effectiveGains = [];

        foreach ($groupGains as $type => $amount) {
            switch ($type) {
                case VP: 
                    $effectiveGains[VP] = $amount;
                    $this->DbQuery("UPDATE player SET `player_score` = `player_score` + ".$effectiveGains[VP]." WHERE player_id = $playerId");
                    $this->checkMaxScore($playerId);
                    break;
                case BRACELET: 
                    $effectiveGains[BRACELET] = min($amount, 3 - $player->bracelet);
                    $this->DbQuery("UPDATE player SET `player_bracelet` = `player_bracelet` + ".$effectiveGains[BRACELET]." WHERE player_id = $playerId");

                    if ($effectiveGains[BRACELET] < $amount) {
                        $this->incStat($amount - $effectiveGains[BRACELET], 'braceletsMissed');
                        $this->incStat($amount - $effectiveGains[BRACELET], 'braceletsMissed', $playerId);
                    }
                    break;
                case RECRUIT:
                    $effectiveGains[RECRUIT] = min($amount, 3 - $player->recruit);
                    $this->DbQuery("UPDATE player SET `player_recruit` = `player_recruit` + ".$effectiveGains[RECRUIT]." WHERE player_id = $playerId");

                    if ($effectiveGains[RECRUIT] < $amount) {
                        $this->incStat($amount - $effectiveGains[RECRUIT], 'recruitsMissed');
                        $this->incStat($amount - $effectiveGains[RECRUIT], 'recruitsMissed', $playerId);
                    }
                    break;
                case REPUTATION:
                    $effectiveGains[REPUTATION] = min($amount, 14 - $player->reputation);
                    $this->DbQuery("UPDATE player SET `player_reputation` = `player_reputation` + ".$effectiveGains[REPUTATION]." WHERE player_id = $playerId");
                    break;
                case CARD: 
                    $available = $this->getAvailableDeckCards();
                    $effectiveGains[CARD] = min($amount, $available);
                    for ($i = 0; $i < $effectiveGains[CARD]; $i++) {
                        $this->powerTakeCard($playerId);
                    }
                    if ($effectiveGains[CARD] < $amount) {
                        $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, [
                            'playerId' => $playerId,
                            'phase' => $phase,
                            'remaining' => $amount - $effectiveGains[CARD],
                        ]);
                    }
                    break;
            }
        }

        return $effectiveGains;
    }

    function canTakeDestination(Destination $destination, array $playedCardsColors, int $recruits, bool $strict) {
        $missingCards = 0;

        foreach ($destination->cost as $color => $required) {
            $available = 0;
            if ($color == EQUAL) {
                $available = max($playedCardsColors);
            } else if ($color == DIFFERENT) {
                $available = count(array_filter($playedCardsColors, fn($count) => $count > 0));
            } else {
                $available = $playedCardsColors[$color]; 
            }

            if ($available < $required) {
                $missingCards += ($required - $available);
            }
        }

        return $strict ? $recruits == $missingCards : $recruits >= $missingCards;
    }

    function getGainName(int $gain) {
        switch ($gain) {
            case VP: return clienttranslate("Victory Point");
            case BRACELET: return clienttranslate("Bracelet");
            case RECRUIT: return clienttranslate("Recruit");
            case REPUTATION: return clienttranslate("Reputation");
            case CARD: return clienttranslate("Card");
        }
    }

    function getColorName(int $color) {
        switch ($color) {
            case BLUE: return clienttranslate("Blue");
            case YELLOW: return clienttranslate("Yellow");
            case GREEN: return clienttranslate("Green");
            case RED: return clienttranslate("Red");
            case PURPLE: return clienttranslate("Purple");
        }
    }

    function getArtifactName(int $artifact) {
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

    function powerTakeCard(int $playerId) {
        $card = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'played'));
        $this->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->cards->countCardInLocation('played'.$playerId.'-'.$card->color)));

        self::notifyAllPlayers('takeDeckCard', clienttranslate('${player_name} takes a ${card_color} ${card_type} card from the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')),
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

    }

    function getPlayedCardsByColor(int $playerId) {
        $playedCardsByColor = [];
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
        }
        return $playedCardsByColor;
    }

    function getPlayedCardsColor(int $playerId, /*array | null*/ $playedCardsByColor = null) {
        if ($playedCardsByColor === null) {
            $playedCardsByColor = $this->getPlayedCardsByColor($playerId);
        }
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
        }
        return array_map(fn($cards) => count($cards), $playedCardsByColor);
    }

    function setupArtifacts(int $option, int $playerCount) {
        $availableArtifacts = [1, 2, 3, 4, 5, 6, 7];
        $artifacts = [];

        if ($option == 2 && $playerCount == 2) {
            $artifacts[] = array_shift($availableArtifacts);
        }

        $index = bga_rand(1, count($availableArtifacts)) - 1;
        $artifacts[] = $availableArtifacts[$index];
        array_splice($availableArtifacts, $index, 1);

        $this->setGlobalVariable(ARTIFACTS, $artifacts);
    }

    function checkArtifacts(int $playerId) {
        $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];

        foreach ($artifacts as $artifact) {
            $this->checkArtifact($playerId, $artifact);
        }
    }

    function checkEndTurnArtifacts(int $playerId) {
        $artifacts = $this->getGlobalVariable(ARTIFACTS, true) ?? [];

        $endTurn = true;

        foreach ($artifacts as $artifact) {
            $result = $this->checkEndTurnArtifact($playerId, $artifact);
            if (!$result) {
                $endTurn = false;
            }
        }

        return $endTurn;
    }

    function getCompletedLines(int $playerId) {
        $playedCardsColors = $this->getPlayedCardsColor($playerId);
        return min($playedCardsColors);
    }

    function completedAPlayedLine(int $playerId) {
        $completedLines = intval($this->getGameStateValue(COMPLETED_LINES));
        return $this->getCompletedLines($playerId) > $completedLines; // completed a line during the turn
    }

    function checkArtifact(int $playerId, int $artifact) {
        switch ($artifact) {
            case ARTIFACT_SILVER_COIN:
                $playedCardColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->getPlayedCardsColor($playerId);
                    if ($playedCardsColors[$playedCardColor] > 3) {
                        $groupGains = [
                            VP => 1,
                        ];
                        $effectiveGains = $this->gainResources($playerId, $groupGains, 'artifact:silver-coins');
    
                        self::notifyAllPlayers('trade', clienttranslate('${player_name} gains ${gains} with artifact ${artifact_name} effect'), [
                            'playerId' => $playerId,
                            'player_name' => $this->getPlayerName($playerId),
                            'effectiveGains' => $effectiveGains,
                            'gains' => $effectiveGains, // for logs
                            'artifact_name' => $this->getArtifactName($artifact), // for logs
                            'i18n' => ['artifact_name'],
                        ]);

                        $this->incStat(1, 'activatedArtifacts');
                        $this->incStat(1, 'activatedArtifacts', $playerId);
                    }
                }
                break;
            case ARTIFACT_GOLDEN_BRACELET:
                $playedCardColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
                if ($playedCardColor > 0) {
                    $playedCardsColors = $this->getPlayedCardsColor($playerId);
                    if ($playedCardsColors[$playedCardColor] == 3) {
                        $this->setGameStateValue(GO_RESERVE, 1);

                        $this->incStat(1, 'activatedArtifacts');
                        $this->incStat(1, 'activatedArtifacts', $playerId);
                    }
                }
                break;
        }
        $this->checkEndTurnArtifact($playerId, $artifact);
    }

    function checkEndTurnArtifact(int $playerId, int $artifact) {
        $endTurn = true;
        switch ($artifact) {
            case ARTIFACT_AMULET:
                if ($this->completedAPlayedLine($playerId)) {
                    $this->setGameStateValue(COMPLETED_LINES, $this->getCompletedLines($playerId)); // make sure the bonus turn doesn't retrigger the effect
                    $groupGains = [
                        BRACELET => 1,
                        RECRUIT => 1,
                        REPUTATION => 1,
                    ];
                    $effectiveGains = $this->gainResources($playerId, $groupGains, 'artifact:amulet');

                    self::notifyAllPlayers('trade', clienttranslate('${player_name} gains ${gains} with artifact ${artifact_name} effect'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                        'effectiveGains' => $effectiveGains,
                        'gains' => $effectiveGains, // for logs
                        'artifact_name' => $this->getArtifactName($artifact), // for logs
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->incStat(1, 'activatedArtifacts');
                    $this->incStat(1, 'activatedArtifacts', $playerId);
                }
                break;
            case ARTIFACT_WEATHERVANE:
                if ($this->completedAPlayedLine($playerId)) {
                    $this->setGameStateValue(EXPLORE_DONE, 0);
                    $this->setGameStateValue(COMPLETED_LINES, $this->getCompletedLines($playerId)); // make sure the bonus turn doesn't retrigger the effectrId)]);

                    self::notifyAllPlayers('log', clienttranslate('${player_name} can explore with artifact ${artifact_name} effect'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                        'artifact_name' => $this->getArtifactName($artifact), // for logs
                        'i18n' => ['artifact_name'],
                    ]);

                    $this->incStat(1, 'activatedArtifacts');
                    $this->incStat(1, 'activatedArtifacts', $playerId);
                    
                    $endTurn = false;
                }
                break;
        }
        return $endTurn;
    }

    function getAvailableDeckCards() {
        return intval($this->cards->countCardInLocation('deck')) + intval($this->cards->countCardInLocation('discard'));
    }

    function getTradeGains(int $playerId, int $bracelets) {
        $destinations = $this->getDestinationsByLocation('played'.$playerId);

        $gains = [];

        $rows = array_merge(
            [$this->getBoatGain()],
            array_map(fn($destination) => $destination->gains, $destinations),
        );
        foreach ($rows as $row) {
            for ($i = 0; $i < $bracelets; $i++) {
                if ($row[$i] !== null) {
                    $gains[] = $row[$i];
                }
            }
        }

        return $gains;
    }

    public function cardDeckAutoReshuffle() {
        $this->notifyAllPlayers('cardDeckReset', clienttranslate('The card deck has been reshuffled'), [            
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')),
            'cardDiscardCount' => intval($this->cards->countCardInLocation('discard')),
        ]);
    }
}
