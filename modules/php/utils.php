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

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard, $this->CARDS);
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

    function setupCards() {
        // number cards
        $cards = [];
        for ($color = 1; $color <= 5; $color++) {
            for ($i = 1; $i <= 12; $i++) {
                $cards[] = [ 'type' => $color, 'type_arg' => $i, 'nbr' => 1 ];
            }
        }
        $this->cards->createCards($cards, 'deck');
        $this->cards->shuffle('deck');

        foreach ([0,1,2,3,4,5] as $pile) {
            $this->cards->pickCardsForLocation(10, 'deck', 'pile'.$pile);
            $this->cards->shuffle('pile'.$pile); // to give them a locationArg asc
        }
    }

    function getTokenFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Token($dbCard);
    }

    function getTokensFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getTokenFromDb($dbCard), array_values($dbCards));
    }

    function getTokensByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `token` WHERE `card_location` = '$location'";
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
        return array_map(fn($dbCard) => $this->getTokenFromDb($dbCard), array_values($dbResults));
    }

    function setupTokens(int $playerCount) {
        $tokens = [
            [ 'type' => BERRY, 'type_arg' => null, 'nbr' => 24 ],
            [ 'type' => MEAT, 'type_arg' => null, 'nbr' => 20 ],
            [ 'type' => FLINT, 'type_arg' => null, 'nbr' => 16 ],
            [ 'type' => SKIN, 'type_arg' => null, 'nbr' => 12 ],
            [ 'type' => BONE, 'type_arg' => null, 'nbr' => 8 ],
        ];
        for ($i = 1; $i <= 60; $i++) {
            $cards[] = [ 'type' => 1, 'type_arg' => $i, 'nbr' => 1 ];
        }
        $this->tokens->createCards($tokens, 'deck');
        $this->tokens->shuffle('deck');

        foreach ([0,1,2,3,4,5] as $pile) {
            $this->tokens->pickCardsForLocation(5, 'deck', 'pile'.$pile);
            $this->tokens->shuffle('pile'.$pile); // to give them a locationArg asc
        }

        $this->tokens->pickCardsForLocation($this->CENTER_RESOURCES_BY_PLAYER_COUNT[$playerCount], 'deck', 'center');
        $this->tokens->shuffle('center'); // to give them a locationArg asc
    }

    function getVariantOption() {
        return intval($this->getGameStateValue(VARIANT_OPTION));
    }

    function getChiefPower(int $playerId) {
        return $this->getVariantOption() == 2 ? $this->getPlayer($playerId)->chief : 0;
    }

    function getPlayerResources(int $playerId) {
        $tokens = $this->getTokensByLocation('player', $playerId);
        $resources = [
            1 => [],
            2 => [],
            3 => [],
            4 => [],
            5 => [],
        ];
        foreach($tokens as $token) {
            $resources[$token->type][] = $token;
        }

        return $resources;
    }

    function tokensToPayForCard(Card $card, array $resources, /*array | null*/ $hand = null, /*bool*/ $payOneLess = false, /*int|null*/$ignoreType = null) {
        if ($hand !== null && $card->discard && count($hand) <= 1) {
            if ($payOneLess) {
                $payOneLess = false;
            } else {
                return null; // no card to discard
            }
        }

        $tokensToPayForCard = [];
        $missingResources = 0;
        for ($i = 1; $i <= 4; $i++) {
            $requiredForCard = count(array_filter($card->resources, fn($resource) => $resource == $i));
            if ($i == $ignoreType) {
                $requiredForCard--;
                $ignoreType = null;
            }
            $available = count($resources[$i]);
            $tokensToPayForCard = array_merge($tokensToPayForCard, array_slice($resources[$i], 0, min($requiredForCard, $available)));
            if ($requiredForCard > $available) {
                $missingResources += ($requiredForCard - $available);
            }
        }

        if ($payOneLess) {
            $missingResources--;
        }

        if (count($resources[BONE]) >= $missingResources) {
            $tokensToPayForCard = array_merge($tokensToPayForCard, array_slice($resources[BONE], 0, $missingResources));
        } else {
            return null;
        }

        return $tokensToPayForCard;
    }

    function getCardScore(Card $card, array $cards) {
        switch ($card->cardType) {
            case HOUSE:
                return $card->points * count(array_filter($cards, fn($c) => $c->color == $card->storageType));
            case STORAGE:
                return $card->points * (($card->prestoredResource != null ? 1 : 0) + count($card->storedResources));
            case HUMAN:
                return $card->points;
            case TOOL:
                return $card->points * count(array_filter($cards, fn($c) => $c->cardType == $card->storageType));
        }
    }

    function getPlayerScore(int $playerId) {
        $playedCards = $this->getPlayedCardWithStoredResources($playerId);
        $score = 0;
        foreach ($playedCards as $card) {
            $score += $this->getCardScore($card, $playedCards);
        }
        return $score;
    }

    function updateScore(int $playerId) {
        $playerScore = $this->getPlayerScore($playerId);

        $this->DbQuery("UPDATE player SET player_score = $playerScore WHERE player_id = $playerId");

        self::notifyAllPlayers('updateScore', '', [
            'playerId' => $playerId,
            'playerScore' => $playerScore,
        ]);
    }

    function getPlayedCardWithStoredResources(int $playerId) {
        $played = $this->getCardsByLocation('played'.$playerId);

        foreach($played as $card) {
            if ($card->cardType == STORAGE) {
                $prestored = $this->getTokensByLocation('prestore', $card->id);
                $card->prestoredResource = count($prestored) > 0 ? $prestored[0] : null;
                $card->storedResources = $this->getTokensByLocation('card', $card->id);
            }
        }

        return $played;
    }

    function takeRessourceFromPool(int $playerId) {
        $token = $this->getTokenFromDb($this->tokens->pickCardForLocation('deck', 'player', $playerId));

        if ($token !== null) {
            self::notifyAllPlayers('takeToken', clienttranslate('${player_name} takes resource ${type} from resource pool'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'token' => $token,
                'pile' => -2,
                'type' => $token->type,
            ]);

            $this->incStat(1, 'collectedResources');
            $this->incStat(1, 'collectedResources', $playerId);
            $this->incStat(1, 'collectedResources'.$token->type);
            $this->incStat(1, 'collectedResources'.$token->type, $playerId);
        }
    }

    function getCardType(int $type) {
        switch ($type) {
            case 1: return clienttranslate("House");
            case 2: return clienttranslate("Storage");
            case 3: return clienttranslate("Human");
            case 4: return clienttranslate("Tool");
        }
    }

    function getCardColor(int $color) {
        switch ($color) {
            case 1: return clienttranslate("Blue");
            case 2: return clienttranslate("Yellow");
            case 3: return clienttranslate("Green");
            case 4: return clienttranslate("Red");
            case 5: return clienttranslate("Purple");
        }
    }

    function saveForUndo(int $playerId, bool $logUndoPoint) {
        $cards = $this->getCardsByLocation('hand', $playerId);        
        $tokens = $this->getTokensByLocation('player', $playerId);

        if ($logUndoPoint) {
            self::notifyPlayer($playerId, 'log', clienttranslate('As you revealed a hidden element, Cancel last moves will only allow to come back to this point'), []);
        }

        $this->setGlobalVariable(UNDO, new Undo(
            array_map(fn($card) => $card->id, $cards),
            array_map(fn($token) => $token->id, $tokens),
            $this->getGlobalVariable(POWER_PAY_ONE_LESS, true)
        ));
    }

    function confirmStoreTokens(int $playerId) {
        $cards = $this->getPlayedCardWithStoredResources($playerId);
        $tokens = [];
        foreach ($cards as $card) {
            if ($card->prestoredResource) {
                $tokens[$card->id] = $card->prestoredResource;
                $this->tokens->moveCard($card->prestoredResource->id, 'card', $card->id);
            }
        }

        //if (count($tokens) > 0) {
            self::notifyAllPlayers('confirmStoredTokens', ''/*client translate('${player_name} stores ${number} resource(s)')*/, [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                //'number' => count($tokens), // for logs
                'tokens' => $tokens,
            ]);
        //}
    }
    
}
