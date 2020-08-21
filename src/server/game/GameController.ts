import GameStateModel from "./GameStateModel";
import PlayerModel from "./PlayerModel";
import TurnModel from "./TurnModel";
import ZilchEngine from "./ZilchEngine";
import ScoreModel from "./ScoreModel";

class GameController {
	private gameState: GameStateModel;

	public startNewGame() {
		this.gameState = new GameStateModel();
		this.gameState.isLastRound = false;
		this.gameState.players = [];
		this.gameState.isGameOver = false;
	}

	public resetGame() {
		this.gameState.isLastRound = false;
		this.gameState.isGameOver = false;
		this.gameState.lastRoundPlayerID = '';
		this.gameState.currPlayerIndex = 0;

		for (let player of this.gameState.players) {
			player.bankScore = 0;
			player.currentScore = 0;
		}
	}

	public isGameStarted():boolean {
		return this.gameState != null && this.gameState != undefined;
	}

	public addPlayer(poPlayer:PlayerModel) {
		this.gameState.players.push(poPlayer);
		if (this.gameState.players.length === 1) {
			this.gameState.currPlayerIndex = 0;
		}
	}

	public removePlayer(id:string) {
		if ((typeof (this.gameState) === 'undefined') || (typeof (this.gameState.players) === 'undefined')) {
			return;
		}

		let deleteIndex: number = -1;
		for (let index=0; index < this.gameState.players.length; index++) {
			if (this.gameState.players[index].playerID === id) {
				deleteIndex = index;
			}
		}

		if (deleteIndex >= 0) {
			this.gameState.players.splice(deleteIndex, 1);
		}
		else {
			this.gameState.players = [];
		}

		if (this.gameState.currPlayerIndex >= this.gameState.players.length) {
			this.gameState.currPlayerIndex = 0;
		}
	}

	public getCurrentPlayer():PlayerModel {
		if (this.gameState == undefined) {
			return null;
		}

		if (this.gameState.currPlayerIndex == undefined) {
			this.gameState.currPlayerIndex = 0;
		}

		return this.gameState.players[this.gameState.currPlayerIndex];

	}

	public moveToNextPlayer() {
		if (this.gameState == undefined || this.gameState.currPlayerIndex == undefined) {
			return;
		}

		const prevPlayer: PlayerModel = this.getCurrentPlayer();
		prevPlayer.currentScore = 0;

		let nextPlayerIndex: number = this.gameState.currPlayerIndex + 1;
		if (nextPlayerIndex >= this.gameState.players.length) {
			nextPlayerIndex = 0;
		}

		this.gameState.currPlayerIndex = nextPlayerIndex;
		this.getCurrentPlayer().currentScore = 0;
		this.getCurrentPlayer().currTurn = this.getNewTurn();

		if (this.gameState.isLastRound) {
			if (this.getCurrentPlayer().playerID === this.gameState.lastRoundPlayerID) {
				this.gameState.isGameOver = true;
			}

		} else {
			this.updateEndGameState(prevPlayer);
		}

	}

	public processTurn(poPlayer: PlayerModel, pIsBankScore: boolean) {

		const zEngine:ZilchEngine = new ZilchEngine();
		if (pIsBankScore) {
			this.bankCurrentTurn(poPlayer);
		}
		else {
			this.addCurrentTurn(poPlayer);

			this.markCurretlyLocked(poPlayer.currTurn);


		}
	}

	protected markCurretlyLocked(poTurn: TurnModel) {
		for (let dice of poTurn.dices) {
			if (!dice.isLockedPrev && dice.isLocked) {
				dice.isLockedPrev = true;
			}
		}
	}

	public getNewTurn(): TurnModel {
		let newTurn: TurnModel = new TurnModel();
		newTurn.dices = [];

		for (let index = 0; index < 6; index++) {
			newTurn.dices.push({ value: 0, isLocked: false, isLockedPrev: false, isUsed: false });
		}

		return newTurn;
	}

	public isFirstRoll(pTurn: TurnModel): boolean {
		for (let dice of pTurn.dices) {
			if (dice.value === 0) {
				return true;
			}
		}

		return false;
	}

	public rollDice(poTurn:TurnModel):ScoreModel[] {
		const zEngine: ZilchEngine = new ZilchEngine();
		zEngine.rollDice(poTurn);

		return zEngine.getPossibleScoreCombos(poTurn);

	}

	protected addCurrentTurn(poPlayer: PlayerModel) {
		let currScore: number = 0;
		const zEngine: ZilchEngine = new ZilchEngine();
		currScore = zEngine.getBestScore(poPlayer.currTurn);
		if (currScore === 0) {
			throw new Error('Must lock a score value');
		}
		poPlayer.currentScore = poPlayer.currentScore + currScore;
	}

	protected bankCurrentTurn(poPlayer: PlayerModel) {
		let currScore: number = 0;
		const zEngine: ZilchEngine = new ZilchEngine();
		currScore = poPlayer.currentScore + zEngine.getBestScore(poPlayer.currTurn);

		if (!((poPlayer.bankScore >= 500 && currScore >= 300) || (currScore >= 500))) {
			throw new Error('Current score not high enough to bank');
		}

		poPlayer.currentScore = currScore;
		poPlayer.bankScore = poPlayer.bankScore + poPlayer.currentScore;

		poPlayer.currentScore = 0;
	}

	public updateEndGameState(poPlayer: PlayerModel) {
		if (!this.gameState.isLastRound && poPlayer.bankScore >= 10000) {
			this.gameState.isLastRound = true;
			this.gameState.lastRoundPlayerID = poPlayer.playerID;
		}
	}

	public getWinner(): PlayerModel {
		if (!this.gameState.isGameOver) {
			return null;
		}

		let highestPlayer: PlayerModel = null;
		for (let player of this.gameState.players) {
			if (highestPlayer == null) {
				highestPlayer = player;
			} else if (highestPlayer.bankScore < player.bankScore) {
				highestPlayer = player;
			}
		}

		return highestPlayer;
	}

	public isGameOver(): boolean {
		if ((this.gameState == undefined) || (this.gameState == null)) {
			return false;
		}

		return this.gameState.isGameOver;
	}

	public getPlayers(): PlayerModel[] {
		if ((this.gameState == undefined) || (this.gameState == null)) {
			return [];
		}

		return this.gameState.players
	}
	
	public areAllDiceUsed(poTurn:TurnModel): boolean {
		for (let dice of poTurn.dices) {
			if (!dice.isUsed) {
				return false;
			}
		}

		return true;
	}

	public resetAfterUsedAllDice(poTurn:TurnModel) {
		for (let dice of poTurn.dices) {
			dice.isLocked = false;
			dice.isLockedPrev = false;
			dice.isUsed = false;
		}
	}

	public getNumPlayers(): number {
		if (this.gameState == undefined) {
			return -1;
		} 
		return this.gameState.players.length;
	}

	public doesPlayerExist(pSocketID: string): boolean {
		for (let player of this.getPlayers()) {
			if (player.playerID === pSocketID) {
				return true;
			}
		}

		return false;
	}

	public setupPlayer(pName: string, pSocketID: string) {
		let newPlayer: PlayerModel = null;
		for (let player of this.getPlayers()) {
			if (player.playerName.toUpperCase() === pName.toUpperCase()) {
				newPlayer = player;
			}
		}

		if (newPlayer == null) {
			newPlayer = new PlayerModel();
			newPlayer.bankScore = 0;
			newPlayer.currentScore = 0;
			newPlayer.playerName = pName;

			newPlayer.currTurn = this.getNewTurn();

			this.addPlayer(newPlayer);
		}

		newPlayer.playerID = pSocketID;
	}

	public applyPlayerLocks(pLocks: boolean[], pTurn: TurnModel) {
		for (let index = 0; index < 6; index++) {
			if (pLocks[index]) {
				pTurn.dices[index].isLocked = true;
			}
		}
	
	}
}

export default GameController