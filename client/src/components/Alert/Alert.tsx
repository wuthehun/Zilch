import React from "react";
import "./Alert.css";

export interface AlertProps {
	isShown: boolean;
	text: string;
	onClose: () => any;
}

class Alert extends React.Component<AlertProps> {
	constructor(props: AlertProps) {
		super(props);

		this.state = {
			inputValue: "",
		};
	}

	handleCloseClick = () => {
		if (this.props.onClose) {
			this.props.onClose();
		}
	};

	render() {
		return this.props.isShown ? (
			<>
				<div className="parent-disable" onClick={this.handleCloseClick}></div>
				<div className="alert-body">
					<div className="alert-text">{this.props.text}</div>
				</div>
			</>
		) : (
			<></>
		);
	}
}

export default Alert;
