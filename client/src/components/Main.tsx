import React from "react";
import Header from "./Header/Header";
import DiceSection from "./DiceSection/DiceSection";
import ChatSection from "./ChatSection/ChatSection";
import "./Main.css";
import Modal from "./Modal/Modal";
import Alert from "./Alert/Alert";
import RulesDrawer from "./RulesDrawer/RulesDrawer";
import io from "socket.io-client";
import { RollModel } from "../models/RollModel";
import { DiceModel } from "../models/DiceModel";
import { ScoreModel } from "../models/ScoreModel";
import Menu from "./Menu/Menu";
import { MenuItem } from "../models/MenuItemModel";

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
	scores: ScoreModel[];
	isAdmin: boolean;
	isShowGameRules: boolean;
	isShowMenu: boolean;
	themeName: string;
	isManual: boolean;
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
			scores: [],
			isAdmin: false,
			isShowGameRules: false,
			isShowMenu: false,
			themeName: "rams",
			isManual: false,
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
		socket.on("update-manual", this.handleManualMode);
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

	// start socket message handlers

	handleConnected = (data: {
		name: string;
		message: string;
		isAdmin: boolean;
	}) => {
		this.addChatMessage({ name: "SYSTEM", message: data.message });
		this.setState({
			isAdmin: data.isAdmin,
		});
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
				scores: roll.playerScores,
			});
		} else {
			this.setState({
				currScore: roll.score.toString(),
				bankScore: roll.bankScore.toString(),
				dices: roll.roll.dices,
				scores: roll.playerScores,
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

	handleManualMode = (isManual: boolean) => {
		this.addChatMessage({
			name: "SYSTEM",
			message: "Manual Mode: " + (isManual ? "ON" : "OFF"),
		});
		this.setState({
			isManual: isManual,
		});
	};

	// end socket message handlers

	addChatMessage = (data: {
		name: string;
		message: string;
		playerScores?: ScoreModel[];
	}) => {
		let messages: { name: string; message: string }[] = this.state.messages;
		messages.splice(0, 0, { name: data.name, message: data.message });

		if (data.playerScores) {
			this.setState({
				messages: messages,
				scores: data.playerScores,
			});
		} else {
			this.setState({
				messages: messages,
			});
		}
	};

	showAlert = (message: string) => {
		this.setState({
			isShowAlertModal: true,
			alertMessage: this.state.alertMessage + " " + message,
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
				message: "you must lock one number",
			});
			return;
		}

		socket.emit("roll", dataIsLocked);
	};

	handleOnSendRoll = () => {
		let dices = [];
		let hasLocked = false;

		let isReroll = false;
		for (let index = 0; index < 6; index++) {
			if (this.state.dices[index].isChecked) {
				hasLocked = true;
			}

			if (this.state.dices[index].value !== 0) {
				isReroll = true;
			}

			dices.push({
				value: this.state.dices[index].value,
				isChecked: this.state.dices[index].isChecked,
			});
		}

		socket.emit("roll-manual", dices);
	};

	handleOnDiceValueChange = (value: number, index: number) => {
		let currDices: DiceModel[] = this.state.dices;
		currDices[index].value = value;

		this.setState({
			dices: currDices,
		});
	};

	handleOnBank = () => {
		if (this.state.isManual) {
			let dices = [];

			for (let index = 0; index < 6; index++) {
				dices.push({
					value: this.state.dices[index].value,
					isChecked: this.state.dices[index].isChecked,
				});
			}
			socket.emit("bank-manual", dices);
		} else {
			let dataIsLocked = [];

			for (let index = 0; index < 6; index++) {
				dataIsLocked.push(this.state.dices[index].isChecked);
			}

			socket.emit("bank", dataIsLocked);
		}
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
		});

		socket.emit("reset", "reset");
	};

	handleRulesClose = () => {
		this.setState({
			isShowGameRules: false,
		});
	};

	handleRulesOnClick = () => {
		this.setState({
			isShowGameRules: true,
			isShowMenu: false,
		});
	};

	handleMenuOnClick = () => {
		this.setState({
			isShowMenu: true,
		});
	};

	handleMenuOnClose = () => {
		this.setState({
			isShowMenu: false,
		});
	};

	getMenuFunctions = (): MenuItem[] => {
		let menuItems: MenuItem[] = [];

		menuItems.push({
			menuName: "Rules",
			menuOnClick: this.handleRulesOnClick,
		});
		menuItems.push({
			menuName: "Rams Theme",
			menuOnClick: this.setRamsTheme,
		});
		menuItems.push({
			menuName: "49ers Theme",
			menuOnClick: this.setNinersTheme,
		});
		if (this.state.isAdmin) {
			menuItems.push({
				menuName: this.state.isManual ? "Set Normal Game" : "Set Manual Game",
				menuOnClick: this.toggleManualFlag,
			});
		}

		return menuItems;
	};

	setRamsTheme = () => {
		this.setState({
			themeName: "rams",
		});
	};

	setNinersTheme = () => {
		this.setState({
			themeName: "niners",
		});
	};

	toggleManualFlag = () => {
		socket.emit("toggle-manual-mode");
	};

	getMainClassName = (): string => {
		let mainClass: string = "main main-body-theme-" + this.state.themeName;

		return mainClass;
	};

	render() {
		return (
			<div className={this.getMainClassName()}>
				<Header
					isUserAdmin={this.state.isAdmin}
					onReset={this.handleOnReset}
					onHeaderClick={this.handleMenuOnClick}
				></Header>
				<div className="body">
					<Menu
						onClose={this.handleMenuOnClose}
						isShown={this.state.isShowMenu}
						menuFunctions={this.getMenuFunctions()}
					></Menu>
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
						onSendRoll={this.handleOnSendRoll}
						onDiceValueChange={this.handleOnDiceValueChange}
						isManual={this.state.isManual}
					></DiceSection>
					<ChatSection
						messages={this.state.messages}
						scores={this.state.scores}
					></ChatSection>
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
				<RulesDrawer
					isShown={this.state.isShowGameRules}
					onClose={this.handleRulesClose}
				></RulesDrawer>
			</div>
		);
	}
}

export default Main;
