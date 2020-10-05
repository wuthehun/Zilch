import React from "react";
import Dice from "./Dice/Dice";
import "./DiceSection.css";
import { DiceModel } from "../../models/DiceModel";

export interface DiceSectionProps {
	dices: DiceModel[];
	onRoll: () => any;
	onSendRoll: () => any;
	onBank: () => any;
	onDiceChecked: (isChecked: boolean, index: number) => any;
	onDiceValueChange: (value: number, index: number) => any;
	isManual: boolean;
}

class DiceSection extends React.Component<DiceSectionProps> {
	render() {
		return (
			<div className="dice-section">
				<div className="dices">
					{this.props.dices.map((dice, index) => {
						return (
							<Dice
								value={dice.value}
								isLocked={dice.isLocked}
								key={index}
								index={index}
								onCheckChange={this.props.onDiceChecked}
								isChecked={dice.isChecked}
								isManual={this.props.isManual}
								onDiceValueChange={this.props.onDiceValueChange}
							></Dice>
						);
					})}
				</div>
				<div className="dice-button-section">
					{this.props.isManual ? (
						<div className="dice-button" onClick={this.props.onSendRoll}>
							Send
						</div>
					) : (
						<div className="dice-button" onClick={this.props.onRoll}>
							Roll
						</div>
					)}

					<div className="dice-button" onClick={this.props.onBank}>
						Bank
					</div>
				</div>
			</div>
		);
	}
}

export default DiceSection;
