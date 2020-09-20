import React from "react";
import Header from "./Header/Header";
import DiceSection from "./DiceSection/DiceSection";
import ChatSection from "./ChatSection/ChatSection";
import "./Main.css";
import Modal from "./Modal/Modal";
import Alert from "./Alert/Alert";
import Drawer from "./Drawer/Drawer";
import io from "socket.io-client";
import { RollModel } from "../models/RollModel";
import { DiceModel } from "../models/DiceModel";
import { ScoreModel } from "../models/ScoreModel";

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
				message: "you much lock one number",
			});
			return;
		}

		socket.emit("roll", dataIsLocked);
	};

	handleOnBank = () => {
		let dataIsLocked = [];

		for (let index = 0; index < 6; index++) {
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
		});
	};

	getRules = (): JSX.Element => {
		return (
			<>
				<h3>Rules</h3>
				<h4>Player Turn</h4>
				<p>
					Zilch is a dice game where you roll 6 dice to score points. Each roll
					must result in a scoring combo. If no scoring combo is found, the
					player has ZILCHED, the current score is lost, and their turn is over.
					After every roll, the player must lock at least one score combo. The
					points from that locked combo are then added to the player's score.
					When the player reaches a score of 500 (if the current bank score is
					0, 300 otherwise), they are able to BANK the score. This will add the
					current score into the bank score and the turn is over. Also if the
					player is able to use all their dice in scoring combos, the dice locks
					will reset upon the next roll. The player can now continue thier turn
					with all 6 dice.
				</p>
				<h4>End Game</h4>
				<p>
					When one player reaches 10000+ bank points, this will start the last
					round. During the last round, each player except the player with
					10000+ points will get one final turn. After all the turns are over,
					the player with the highest score wins the game.
				</p>
				<h3>Scoring combos</h3>
				<p>
					<ul>
						<li>6 of a kind (1 - 10000, other - 6000)</li>
						<li>5 of a kind (1 - 5500, other - 5000)</li>
						<li>4 of a kind (1 - 2500, other - 2000)</li>
						<li>3 pair (3000)</li>
						<li>straight (4000)</li>
						<li>3 of a kind (1 - 1000, other - other * 100)</li>
						<li>single dice (1 - 100, 5 - 50)</li>
					</ul>
				</p>
			</>
		);
	};

	render() {
		return (
			<div className="main">
				<Header
					isUserAdmin={this.state.isAdmin}
					onReset={this.handleOnReset}
				></Header>
				<div className="body">
					<div className="rules-button" onClick={this.handleRulesOnClick}>
						Rules
					</div>
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
				<Drawer
					isShown={this.state.isShowGameRules}
					header="Zilch Rules"
					textElements={this.getRules()}
					onClose={this.handleRulesClose}
				></Drawer>
			</div>
		);
	}
}

export default Main;
