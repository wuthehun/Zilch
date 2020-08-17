import PlayerModel from "./PlayerModel";

class GameStateModel {
	public players: PlayerModel[];
	public isLastRound: boolean;
	public lastRoundPlayerID: string;
	public currPlayerIndex: number;
	public isGameOver: boolean;

}

export default GameStateModel