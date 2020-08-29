import PlayerModel from "./PlayerModel";

class GameStateModel {
	public players: PlayerModel[];
	public inactivePlayers: PlayerModel[];
	public isLastRound: boolean;
	public lastRoundPlayerID: string;
	public isGameOver: boolean;

}

export default GameStateModel