import React from "react";
import Dice from "./Dice/Dice";
import "./DiceSection.css";
import { DiceModel } from "../../models/DiceModel";

export interface DiceSectionProps {
	dices: DiceModel[];
	onRoll: () => any;
	onBank: () => any;
	onDiceChecked: (isChecked: boolean, index: number) => any;
}

class DiceSection extends React.Component<DiceSectionProps> {
	constructor(props: any) {
		super(props);

	}

	render() {
		return (
			<div className="dice-section">
				<div className="dices">
					{this.props.dices.map((dice, index) => {
						return (
							<Dice
								value={dice.value.toString()}
								isLocked={dice.isLocked}
								key={index}
								index={index}
								onCheckChange={this.props.onDiceChecked}
								isChecked={dice.isChecked}
							></Dice>
						);
					})}
				</div>
				<div className="dice-button-section">
					<div className="dice-button" onClick={this.props.onRoll}>Roll</div>
					<div className="dice-button" onClick={this.props.onBank}>Bank</div>
				</div>
			</div>
		);
	}
}

export default DiceSection;
