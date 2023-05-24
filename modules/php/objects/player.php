<?php

class KnarrPlayer {
    public int $id;
    public string $name;
    public string $color;
    public int $no;
    public int $score;
    public int $reputation;
    public int $recruit;
    public int $bracelet;

    public function __construct($dbPlayer) {
        $this->id = intval($dbPlayer['player_id']);
        $this->name = $dbPlayer['player_name'];
        $this->color = $dbPlayer['player_color'];
        $this->no = intval($dbPlayer['player_no']);
        $this->score = intval($dbPlayer['player_score']);
        $this->reputation = intval($dbPlayer['player_reputation']);
        $this->recruit = intval($dbPlayer['player_recruit']);
        $this->bracelet = intval($dbPlayer['player_bracelet']);
    }
}
?>