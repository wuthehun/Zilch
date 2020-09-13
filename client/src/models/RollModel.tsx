import { DiceModel } from "./DiceModel";

export interface RollModel {
	score: number;
	bankScore: number;
	roll: { dices: DiceModel[] };
	isReset: boolean;
	message: string;
}
