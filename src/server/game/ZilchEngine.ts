import TurnModel from "./TurnModel";
import ScoreModel from "./ScoreModel";
import { eScoreType } from "./Enums";

class ZilchEngine {
	// turn
	// user input: roll
	// system: random 6 dice
	// system: get dice results and possible scores
	// system: determine player state (allowed to continue or end turn)
	// system: return results and scores
	// user input: select dices to lock and reroll or end turn
	// system: calculate score with locked dice and add to current score
	// system: reroll unlocked
	// system: get dice results and possible scores
	// system: determine player state (allowed to continue or end turn)
	// system: return results and scores
	// repeat

	// 6 of a kind (1 10000, x 6000)
	// 5 of a kind (1 5500, x 5000)
	// 4 of a kind (1 2500, x 2000)
	// 3 pair (3000)
	// straight (4000)
	// 3 of a kind (1 1000, x * 100)
	// 1 - 100
	// 5 - 50

	public rollDice(poTurn: TurnModel) {
		for (let dice of poTurn.dices) {
			if (!dice.isLocked) {
				dice.value = this.getNewRoll();
			}
		}
	}

	protected getNewRoll(): number {
		return Math.floor(Math.random() * 6) + 1;
	}

	protected isBust(poTurn: TurnModel): boolean {
		let result: ScoreModel[] = this.getPossibleScoreCombos(poTurn);

		return result.length === 0;
	}

	protected prepPossibleScore(poTurn: TurnModel): number[] {
		let arrDice: number[] = [0, 0, 0, 0, 0, 0];

		for (let dice of poTurn.dices) {
			if (!dice.isLocked && !dice.isLockedPrev && dice.value > 0) {
				arrDice[dice.value - 1] = arrDice[dice.value - 1] + 1;
			}
		}

		return arrDice;
	}

	protected prepActualScore(poTurn: TurnModel): number[] {
		let arrDice: number[] = [0, 0, 0, 0, 0, 0];

		for (let dice of poTurn.dices) {
			if (dice.isLocked && !dice.isLockedPrev && dice.value > 0) {
				arrDice[dice.value - 1] = arrDice[dice.value - 1] + 1;
			}
		}

		return arrDice;
	}

	public getBestScore(poTurn: TurnModel): number {
		let arrDice: number[] = this.prepActualScore(poTurn);
		let availDice: number = 0;

		for (let total of arrDice) {
			availDice = availDice + total;
		}

		let result: ScoreModel[] = [];

		switch (true) {
			case availDice === 6: {
				result = result.concat(this.getSixKind(arrDice, true, poTurn));
				result = result.concat(this.getStraight(arrDice, true, poTurn));
				result = result.concat(this.getThreePair(arrDice, true, poTurn));
			}
			case availDice >= 5: {
				result = result.concat(this.getFiveKind(arrDice, true, poTurn));
			}
			case availDice >= 4: {
				result = result.concat(this.getFourKind(arrDice, true, poTurn));
			}
			case availDice >= 3: {
				result = result.concat(this.getThreeKind(arrDice, true, poTurn));
			}
			case availDice >= 1: {
				result = result.concat(this.getFive(arrDice, true, poTurn));
				result = result.concat(this.getOne(arrDice, true, poTurn));
			}
			default: {
			}
		}

		let totalScore: number = 0;
		for (let score of result) {
			totalScore = totalScore + score.value;
		}

		return totalScore;
	}

	public getPossibleScoreCombos(poTurn: TurnModel): ScoreModel[] {
		let arrDice: number[] = this.prepPossibleScore(poTurn);
		let availDice: number = 0;

		for (let total of arrDice) {
			availDice = availDice + total;
		}

		let result: ScoreModel[] = [];

		switch (true) {
			case availDice === 6: {
				result = result.concat(this.getSixKind(arrDice, false, poTurn));
				result = result.concat(this.getStraight(arrDice, false, poTurn));
				result = result.concat(this.getThreePair(arrDice, false, poTurn));
			}
			case availDice >= 5: {
				result = result.concat(this.getFiveKind(arrDice, false, poTurn));
			}
			case availDice >= 4: {
				result = result.concat(this.getFourKind(arrDice, false, poTurn));
			}
			case availDice >= 3: {
				result = result.concat(this.getThreeKind(arrDice, false, poTurn));
			}
			case availDice >= 1: {
				result = result.concat(this.getFive(arrDice, false, poTurn));
				result = result.concat(this.getOne(arrDice, false, poTurn));
			}
			default: {
			}
		}

		return result;
	}

	protected getSixKind(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		for (let index: number = 0; index < 6; index++) {
			if (parrDice[index] === 6) {
				if (pIsConsumeDice) {
					parrDice[index] = 0;
					for (let dice of poTurn.dices) {
						dice.isUsed = true;
					}
				}

				if (index === 0) {
					return [{ value: 10000, scoreType: eScoreType.SIX_OF_KIND_1S }];
				} else {
					return [{ value: 6000, scoreType: eScoreType.SIX_OF_KIND }];
				}
			}
		}

		return [];
	}

	protected getFiveKind(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		for (let index: number = 0; index < 6; index++) {
			if (parrDice[index] === 5) {
				if (pIsConsumeDice) {
					parrDice[index] = 0;

					for (let dice of poTurn.dices) {
						if ((dice.value === (index + 1)) && dice.isLocked && !dice.isLockedPrev ) {
							dice.isUsed = true;
						}
					}

				}

				if (index === 0) {
					return [{ value: 5500, scoreType: eScoreType.FIVE_OF_KIND_1S }];
				} else {
					return [{ value: 5000, scoreType: eScoreType.FIVE_OF_KIND }];
				}
			}
		}

		return [];
	}

	protected getFourKind(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		for (let index: number = 0; index < 6; index++) {
			if (parrDice[index] === 4) {
				if (pIsConsumeDice) {
					parrDice[index] = 0;

					for (let dice of poTurn.dices) {
						if ((dice.value === (index + 1)) && dice.isLocked && !dice.isLockedPrev ) {
							dice.isUsed = true;
						}
					}

				}

				if (index === 0) {
					return [{ value: 2500, scoreType: eScoreType.FOUR_OF_KIND_1S }];
				} else {
					return [{ value: 2000, scoreType: eScoreType.FOUR_OF_KIND }];
				}
			}
		}

		return [];
	}

	protected getThreeKind(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		let results: ScoreModel[] = [];

		for (let index: number = 0; index < 6; index++) {
			if (parrDice[index] === 3) {
				if (pIsConsumeDice) {
					parrDice[index] = 0;

					for (let dice of poTurn.dices) {
						if ((dice.value === (index + 1)) && dice.isLocked && !dice.isLockedPrev ) {
							dice.isUsed = true;
						}
					}

				}

				if (index === 0) {
					results.push({ value: 1000, scoreType: eScoreType.THREE_OF_KIND_1S });
				} else {
					results.push({
						value: 100 * (index + 1),
						scoreType: eScoreType.THREE_OF_KIND,
					});
				}
			}
		}

		return results;
	}

	protected getStraight(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		let isAllHaveOne: boolean = true;

		if (parrDice.length !== 6) {
			return [];
		}

		for (let index: number = 0; index < 6; index++) {
			if (parrDice[index] !== 1) {
				isAllHaveOne = false;
			}
		}

		if (isAllHaveOne) {
			if (pIsConsumeDice) {
				for (let index: number = 0; index < 6; index++) {
					parrDice[index] = 0;
				}
				for (let dice of poTurn.dices) {
					dice.isUsed = true;
				}

			}
			return [{ value: 4000, scoreType: eScoreType.STRAIGHT }];
		}

		return [];
	}

	protected getThreePair(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		let numPairs: number = 0;

		for (let index: number = 0; index < 6; index++) {
			if (parrDice[index] === 2) {
				numPairs = numPairs + 1;
			}
		}

		if (numPairs === 3) {
			if (pIsConsumeDice) {
				for (let index: number = 0; index < 6; index++) {
					parrDice[index] = 0;
				}
				for (let dice of poTurn.dices) {
					dice.isUsed = true;
				}

			}

			return [{ value: 3000, scoreType: eScoreType.THREE_PAIR }];
		}

		return [];
	}

	protected getOne(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		let result: ScoreModel[] = [];

		for (let index: number = 0; index < parrDice[0]; index++) {
			result.push({ value: 100, scoreType: eScoreType.ONE });
		}

		if (pIsConsumeDice) {
			parrDice[0] = 0;

			for (let dice of poTurn.dices) {
				if ((dice.value === 1) && dice.isLocked && !dice.isLockedPrev ) {
					dice.isUsed = true;
				}
			}

		}

		return result;
	}

	protected getFive(
		parrDice: number[],
		pIsConsumeDice: boolean,
		poTurn: TurnModel
	): ScoreModel[] {
		let result: ScoreModel[] = [];

		for (let index: number = 0; index < parrDice[4]; index++) {
			result.push({ value: 50, scoreType: eScoreType.FIVE });
		}

		if (pIsConsumeDice) {
			parrDice[4] = 0;

			for (let dice of poTurn.dices) {
				if ((dice.value === 5) && dice.isLocked && !dice.isLockedPrev ) {
					dice.isUsed = true;
				}
			}

		}

		return result;
	}
}

export default ZilchEngine;
