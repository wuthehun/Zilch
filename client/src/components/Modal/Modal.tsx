import React from "react";
import "./Modal.css";

export interface ModalProps {
	isShown: boolean;
	text: string;
	onConfirm?: (value: string) => any;
	onCancel?: () => any;
	isShowInput: boolean;
}

export interface ModalState {
	inputValue: string;
}

let nameInput: HTMLInputElement | null;

class Modal extends React.Component<ModalProps, ModalState> {
	constructor(props: ModalProps) {
		super(props);

		this.state = {
			inputValue: "",
		};
	}

	componentDidMount() {
		if (nameInput) {
			nameInput.focus();
		}
	}

	handleOKCLick = () => {
		if (this.props.onConfirm) {
			this.props.onConfirm(this.state.inputValue);
		}
	};

	handleCancelClick = () => {
		if (this.props.onCancel) {
			this.props.onCancel();
		}
	};

	handleInputChange = (event: any) => {
		this.setState({ inputValue: event.target.value });
	};

	handleKeyDown = (event: any) => {
		if (event.key === "Enter") {
			this.handleOKCLick();
		}
	};

	render() {
		return this.props.isShown ? (
			<>
				<div className="parent-disable" onClick={this.handleCancelClick}></div>
				<div className="modal-body">
					<div className="modal-text">{this.props.text}</div>
					{this.props.isShowInput && (
						<div className="modal-input">
							<input
								type="text"
								name="modalText"
								value={this.state.inputValue}
								onChange={this.handleInputChange}
								autoComplete="off"
								onKeyDown={this.handleKeyDown}
								ref={(input) => {
									nameInput = input;
								}}
							></input>
						</div>
					)}
					<div className="modal-buttons">
						<div onClick={this.handleOKCLick}>OK</div>
						<div onClick={this.handleCancelClick}>Cancel</div>
					</div>
				</div>
			</>
		) : (
			<></>
		);
	}
}

export default Modal;
