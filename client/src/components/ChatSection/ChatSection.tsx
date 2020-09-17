import React from "react";
import { ScoreModel } from "../../models/ScoreModel";
import "./ChatSection.css";

export interface ChatSectionProps {
	messages: { name: string; message: string }[];
	scores: ScoreModel[];
}

class ChatSection extends React.Component<ChatSectionProps> {
	constructor(props: ChatSectionProps) {
		super(props);
	}

	getMessages = () => {
		return this.props.messages.map((message, index) => {
			return (
				<div className="message" key={index}>
					{message.name}: {message.message}
				</div>
			);
		});
	};

	getScores = () => {
		return this.props.scores.map((score, index) => {
			return (
				<div className="message" key={index}>
					{score.name}: Current Score: {score.currScore}.  Bank Score: {score.bankScore}
				</div>
			);
		});
	}

	render() {
		return (
			<div className="chat-container">
				<div className="container-message">{this.getMessages()}</div>
				<div className="container-score">{this.getScores()}</div>
			</div>
		);
	}
}

export default ChatSection;
