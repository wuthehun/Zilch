import React from "react";
import "./Dice.css";

export interface DiceProps {
	value: string;
	isLocked: boolean;
	onCheckChange: (isChecked: boolean, index: number) => any;
	index: number;
	isChecked: boolean;
}

class Dice extends React.Component<DiceProps> {
	constructor(props: DiceProps) {
		super(props);

		this.state = {
			isChecked: props.isLocked,
		};
	}

	getDiceClass = (): string => {
		let sClass: string = "dice";
		if (this.props.value === "0") {
			return sClass;
		}

		if (this.props.isChecked || this.props.isLocked) {
			sClass = sClass + " locked-dice";
		}

		// if locked is from props, we fully lock it out
		if (this.props.isLocked) {
			sClass = sClass + " locked-cursor";
		}

		return sClass;
	};

	getValueClass = (): string => {
		let sClass: string = "value-text";
		if (this.props.isChecked || this.props.isLocked) {
			sClass = sClass + " locked-value";
		}

		return sClass;
	};

	handleDiceOnClick = () => {
		if (!this.props.isLocked && this.props.value !== "0") {
			const bIsChecked: boolean = this.props.isChecked;
			this.setState({ isChecked: !bIsChecked });
			this.props.onCheckChange(!bIsChecked, this.props.index);
		}
	};

	render() {
		return (
			<div className={this.getDiceClass()} onClick={this.handleDiceOnClick}>
				<div className={this.getValueClass()}>{this.props.value}</div>
				{this.props.isChecked || this.props.isLocked ? (
					<div className="locked-text">Locked</div>
				) : (
					<></>
				)}
			</div>
		);
	}
}

export default Dice;
