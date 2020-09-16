import React, { useState, useEffect } from "react";
import Header from "./Header/Header";
import DiceSection from "./DiceSection/DiceSection";
import ChatSection from "./ChatSection/ChatSection";
import "./Main.css";
import Modal from "./Modal/Modal";
import Alert from "./Alert/Alert";
import io from "socket.io-client";
import { RollModel } from "../models/RollModel";
import { DiceModel } from "../models/DiceModel";

export interface MainState {
	name: string;
	messages: { name: string; message: string }[];
	currScore: string;
	bankScore: string;
	isShowNameModal: boolean;
	isShowAlertModal: boolean;
	alertMessage: string;
	dices: DiceModel[];
	isShowReset: boolean;
}

let socket: SocketIOClient.Socket;

class Main extends React.Component<any, MainState> {
	constructor(props: any) {
		super(props);

		this.state = {
			name: "Player 1",
			messages: [],
			currScore: "0",
			bankScore: "0",
			isShowNameModal: true,
			isShowAlertModal: false,
			alertMessage: "",
			dices: this.getResetDice(),
			isShowReset: false,
		};

		socket = io();
		socket.on("chat-message", this.handleChatMessage);
		socket.on("connected", this.handleConnected);
		socket.on("user-disconnected", this.handleUserDisconnected);
		socket.on("user-connected", this.handleUserConnected);

		socket.on("turn-change", this.handleTurnChange);
		socket.on("your-turn", this.handleYourTurn);
		socket.on("roll-message", this.handleRollMessage);
		socket.on("zilch-message", this.handleZilchMessage);
		socket.on("player-wins", this.handlePlayerWin);
		socket.on("you-win", this.handleYouWin);
		socket.on("roll-reset", this.handleRollReset);
	}

	getResetDice = (): DiceModel[] => {
		return [
			{ value: 0, isLocked: false, isChecked: false },
			{ value: 0, isLocked: false, isChecked: false },
			{ value: 0, isLocked: false, isChecked: false },
			{ value: 0, isLocked: false, isChecked: false },
			{ value: 0, isLocked: false, isChecked: false },
			{ value: 0, isLocked: false, isChecked: false },
		];
	};

	handleConnected = (data: { name: string; message: string }) => {
		this.addChatMessage({ name: "SYSTEM", message: data.message });
	};

	handleUserDisconnected = (name: string) => {
		this.addChatMessage({ name: "SYSTEM", message: name + " disconnected" });
	};

	handleUserConnected = (name: string) => {
		this.addChatMessage({ name: "SYSTEM", message: name + " connected" });
	};

	handleChatMessage = (data: { name: string; message: string }) => {
		this.addChatMessage(data);
	};

	handleTurnChange = (name: string) => {
		this.addChatMessage({ name: "SYSTEM", message: name + "'s Turn" });
		this.showAlert(name + "'s Turn");
	};

	handleYourTurn = () => {
		this.addChatMessage({ name: "SYSTEM", message: "Your Turn" });
		this.showAlert("Your Turn");

		this.setState({
			currScore: "0",
			dices: this.getResetDice(),
		});
	};

	handleRollMessage = (roll: RollModel) => {
		this.addChatMessage({ name: "SYSTEM", message: roll.message });

		if (roll.isReset) {
			this.setState({
				currScore: "0",
				bankScore: roll.bankScore.toString(),
				dices: roll.roll.dices,
			});
		} else {
			this.setState({
				currScore: roll.score.toString(),
				bankScore: roll.bankScore.toString(),
				dices: roll.roll.dices,
			});
		}
	};

	handleZilchMessage = (data: { message: string }) => {
		this.addChatMessage({ name: "SYSTEM", message: data.message });
		this.showAlert(data.message);

		this.setState({
			dices: this.getResetDice(),
			currScore: "0",
		});
	};

	handlePlayerWin = (name: string) => {
		this.showAlert(name + " Wins!");
		this.addChatMessage({ name: "SYSTEM", message: name + " Wins!" });

		this.setState({
			currScore: "0",
			bankScore: "0",
			dices: this.getResetDice(),
			isShowReset: true,
		});
	};

	handleYouWin = () => {
		this.showAlert("You Win!");
		this.addChatMessage({ name: "SYSTEM", message: "You Win!" });

		this.setState({
			currScore: "0",
			bankScore: "0",
			dices: this.getResetDice(),
			isShowReset: true,
		});
	};

	handleRollReset = (data: { message: string }) => {
		this.addChatMessage({ name: "SYSTEM", message: data.message });
		this.setState({
			dices: this.getResetDice(),
		});
	};

	addChatMessage = (data: { name: string; message: string }) => {
		let messages: { name: string; message: string }[] = this.state.messages;
		messages.splice(0, 0, { name: data.name, message: data.message });

		this.setState({
			messages: messages,
		});
	};

	showAlert = (message: string) => {
		this.setState({
			isShowAlertModal: true,
			alertMessage: message,
		});

		setTimeout(() => {
			this.setState({
				isShowAlertModal: false,
				alertMessage: "",
			});
		}, 2500);
	};

	handleModalConfirm = (value: string) => {
		this.setState({
			name: value,
			isShowNameModal: false,
		});

		socket.emit("new-user", value);
	};

	handleModalCancel = () => {
		this.setState({
			isShowNameModal: false,
		});
	};

	handleAlertClose = () => {
		this.setState({
			isShowAlertModal: false,
		});
	};

	handleOnRoll = () => {
		let dataIsLocked = [];
		let hasLocked = false;

		let isReroll = false;
		for (let index = 0; index < 6; index++) {
			if (this.state.dices[index].isChecked) {
				hasLocked = true;
			}

			if (this.state.dices[index].value !== 0) {
				isReroll = true;
			}

			dataIsLocked.push(this.state.dices[index].isChecked);
		}

		if (isReroll && !hasLocked) {
			this.addChatMessage({
				name: "SYSTEM",
				message: "you much lock one number",
			});
			return;
		}

		socket.emit("roll", dataIsLocked);
	};

	handleOnBank = () => {
		let dataIsLocked = [];
		let hasLocked = false;

		for (let index = 0; index < 6; index++) {
			if (this.state.dices[index].isChecked) {
				hasLocked = true;
			}

			dataIsLocked.push(this.state.dices[index].isChecked);
		}

		socket.emit("bank", dataIsLocked);
	};

	handleOnDiceChecked = (isChecked: boolean, index: number) => {
		let currDices: DiceModel[] = this.state.dices;
		currDices[index].isChecked = isChecked;

		this.setState({
			dices: currDices,
		});
	};

	handleOnReset = () => {
		this.setState({
			isShowReset: false,
		})
	
		socket.emit('reset', 'reset');
	}
	

	render() {
		return (
			<div className="main">
				<Header></Header>
				<div className="body">
					<div className="player-name">{this.state.name}</div>
					<div className="player-score">
						<table>
							<tr>
								<td>Current Score:</td>
								<td>{this.state.currScore}</td>
							</tr>
							<tr>
								<td>Bank Score:</td>
								<td>{this.state.bankScore}</td>
							</tr>
						</table>
					</div>
					<DiceSection
						dices={this.state.dices}
						onRoll={this.handleOnRoll}
						onBank={this.handleOnBank}
						onDiceChecked={this.handleOnDiceChecked}
					></DiceSection>
					<ChatSection messages={this.state.messages}></ChatSection>
				</div>
				<Modal
					isShown={this.state.isShowNameModal}
					text="What is your name?"
					onCancel={this.handleModalCancel}
					onConfirm={this.handleModalConfirm}
					isShowInput={true}
				></Modal>
				<Modal
					isShown={this.state.isShowReset}
					text="Resetting Game!"
					onCancel={this.handleOnReset}
					onConfirm={this.handleOnReset}
					isShowInput={false}
				></Modal>
				<Alert
					isShown={this.state.isShowAlertModal}
					text={this.state.alertMessage}
					onClose={this.handleAlertClose}
				></Alert>

			</div>
		);
	}
}

export default Main;
