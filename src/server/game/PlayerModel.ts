import TurnModel from "./TurnModel";

class PlayerModel {
	public bankScore:number;
	public currentScore:number;
	public playerID:string;
	public playerName:string;
	public currTurn: TurnModel;
	public isStartedLastTurn: boolean;
	public isAdmin: boolean;
}

export default PlayerModel