import { DiceModel } from "./DiceModel";
import { ScoreModel } from "./ScoreModel";

export interface RollModel {
	score: number;
	bankScore: number;
	roll: { dices: DiceModel[] };
	isReset: boolean;
	message: string;
	playerScores: ScoreModel[];
}
