import GameStateModel from "./GameStateModel";
import PlayerModel from "./PlayerModel";
import TurnModel from "./TurnModel";
import ZilchEngine from "./ZilchEngine";
import ScoreModel from "./ScoreModel";
import PlayerScoreModel from "./PlayerScoreModel";

class GameController {
	private gameState: GameStateModel;

	public startNewGame() {
		this.gameState = new GameStateModel();
		this.gameState.isLastRound = false;
		this.gameState.players = [];
		this.gameState.inactivePlayers = [];
		this.gameState.isGameOver = false;
	}

	public resetGame(pIsForceReset:boolean) {
		if (!(this.gameState.isGameOver || pIsForceReset)) {
			return;
		}

		this.gameState.isLastRound = false;
		this.gameState.isGameOver = false;
		this.gameState.lastRoundPlayerID = "";

		for (let player of this.gameState.players) {
			player.bankScore = 0;
			player.currentScore = 0;
		}

		for (let player of this.gameState.inactivePlayers) {
			player.bankScore = 0;
			player.currentScore = 0;
		}
	}

	public clearGame() {
		this.resetGame(true);

		this.gameState.players = [];
		this.gameState.inactivePlayers = [];
	}

	public isGameStarted(): boolean {
		return this.gameState != null && this.gameState != undefined;
	}

	public addPlayer(poPlayer: PlayerModel) {
		this.gameState.players.push(poPlayer);
	}

	public removePlayer(pID: string) {
		if (
			typeof this.gameState === "undefined" ||
			typeof this.gameState.players === "undefined"
		) {
			return;
		}

		let removeIndex: number = -1;
		for (let index = 0; index < this.gameState.players.length; index++) {
			if (this.gameState.players[index].playerID === pID) {
				removeIndex = index;
			}
		}

		if (removeIndex >= 0) {
			let removePlayer: PlayerModel = this.gameState.players[removeIndex];
			this.gameState.inactivePlayers.push(removePlayer);
			this.gameState.players.splice(removeIndex, 1);
		} else {
			this.gameState.players = [];
		}
	}

	public getCurrentPlayer(): PlayerModel {
		if (this.gameState == undefined) {
			return null;
		}

		if (this.getActivePlayers().length === 0) {
			return null;
		}

		return this.getActivePlayers()[0];
	}

	public moveToNextPlayer() {
		if (this.gameState == undefined) {
			return;
		}

		const prevPlayer: PlayerModel = this.getCurrentPlayer();
		prevPlayer.currentScore = 0;

		this.gameState.players.splice(0, 1);
		this.gameState.players.push(prevPlayer);

		this.getCurrentPlayer().currentScore = 0;
		this.getCurrentPlayer().currTurn = this.getNewTurn();

		if (this.gameState.isLastRound) {
			if (
				this.getCurrentPlayer().playerID === this.gameState.lastRoundPlayerID ||
				this.getCurrentPlayer().isStartedLastTurn
			) {
				this.gameState.isGameOver = true;
			} else {
				prevPlayer.isStartedLastTurn = true;
			}
		} else {
			this.updateEndGameState(prevPlayer);
		}
	}

	public processTurn(poPlayer: PlayerModel, pIsBankScore: boolean) {
		const zEngine: ZilchEngine = new ZilchEngine();
		if (pIsBankScore) {
			this.bankCurrentTurn(poPlayer);
		} else {
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
			newTurn.dices.push({
				value: 0,
				isLocked: false,
				isLockedPrev: false,
				isUsed: false,
			});
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

	public rollDice(poTurn: TurnModel): ScoreModel[] {
		const zEngine: ZilchEngine = new ZilchEngine();
		zEngine.rollDice(poTurn);

		return zEngine.getPossibleScoreCombos(poTurn);
	}

	protected addCurrentTurn(poPlayer: PlayerModel) {
		let currScore: number = 0;
		const zEngine: ZilchEngine = new ZilchEngine();
		currScore = zEngine.getBestScore(poPlayer.currTurn);
		if (currScore === 0) {
			throw new Error("Must lock a score value");
		}
		poPlayer.currentScore = poPlayer.currentScore + currScore;
	}

	protected bankCurrentTurn(poPlayer: PlayerModel) {
		let currScore: number = 0;
		const zEngine: ZilchEngine = new ZilchEngine();
		currScore = poPlayer.currentScore + zEngine.getBestScore(poPlayer.currTurn);

		if (
			!((poPlayer.bankScore >= 500 && currScore >= 300) || currScore >= 500)
		) {
			throw new Error("Current score not high enough to bank");
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
		for (let player of this.getActivePlayers()) {
			if (highestPlayer == null) {
				highestPlayer = player;
			} else if (highestPlayer.bankScore < player.bankScore) {
				highestPlayer = player;
			}
		}

		return highestPlayer;
	}

	public isGameOver(): boolean {
		if (this.gameState == undefined || this.gameState == null) {
			return false;
		}

		return this.gameState.isGameOver;
	}

	public getActivePlayers(): PlayerModel[] {
		if (this.gameState == undefined || this.gameState == null) {
			return [];
		}

		return this.gameState.players;
	}

	public getInactivePlayers(): PlayerModel[] {
		if (this.gameState == undefined || this.gameState == null) {
			return [];
		}

		return this.gameState.inactivePlayers;
	}

	public areAllDiceUsed(poTurn: TurnModel): boolean {
		for (let dice of poTurn.dices) {
			if (!dice.isUsed) {
				return false;
			}
		}

		return true;
	}

	public resetAfterUsedAllDice(poTurn: TurnModel) {
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

		return this.getActivePlayers().length;
	}

	public doesPlayerExist(pSocketID: string): boolean {
		for (let player of this.getActivePlayers()) {
			if (player.playerID === pSocketID) {
				return true;
			}
		}

		return false;
	}

	public setupPlayer(
		pName: string,
		pSocketID: string,
		pIsAdmin: boolean
	): PlayerModel {
		let newPlayer: PlayerModel = null;

		for (let index = 0; index < this.getActivePlayers().length; index++) {
			let player: PlayerModel = this.getActivePlayers()[index];
			if (player.playerName.toUpperCase() === pName.toUpperCase()) {
				throw new Error("Duplicate name not allowed!");
			}
		}

		// if found in inactive list, pull it out
		for (let index = 0; index < this.getInactivePlayers().length; index++) {
			let player: PlayerModel = this.getInactivePlayers()[index];

			newPlayer = player;
			this.gameState.inactivePlayers.splice(index, 1);
			// this is causing ordering issues. current player index gets screwed up
			console.log(newPlayer.playerName + " found");
			continue;
		}

		if (newPlayer == null) {
			newPlayer = new PlayerModel();
			newPlayer.bankScore = 0;
			newPlayer.playerName = pName;
			newPlayer.isStartedLastTurn = false;
			newPlayer.isAdmin = pIsAdmin;
		}

		newPlayer.currentScore = 0;
		newPlayer.currTurn = this.getNewTurn();
		newPlayer.playerID = pSocketID;

		this.addPlayer(newPlayer);
		return newPlayer;
	}

	public applyPlayerLocks(pLocks: boolean[], pTurn: TurnModel) {
		for (let index = 0; index < 6; index++) {
			if (pLocks[index]) {
				pTurn.dices[index].isLocked = true;
			}
		}
	}

	public getPlayerScores(): PlayerScoreModel[] {
		let scores: PlayerScoreModel[] = [];

		for (let player of this.getActivePlayers()) {
			scores.push({
				name: player.playerName,
				currScore: player.currentScore.toString(),
				bankScore: player.bankScore.toString(),
			});
		}

		return scores;
	}

	public findPlayerByID(pID: string): PlayerModel {
		for (let index = 0; index < this.gameState.players.length; index++) {
			if (this.gameState.players[index].playerID === pID) {
				return this.gameState.players[index];
			}
		}

		return null;
	}
}

export default GameController;
