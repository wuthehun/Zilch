import React from "react";
import "./ChatSection.css";

export interface ChatSectionProps {
	messages: { name: string; message: string }[];
}

class ChatSection extends React.Component<ChatSectionProps> {
	constructor(props: ChatSectionProps) {
		super(props);
	}

	getMessages = () => {
		return this.props.messages.map((message, index) => {
			return <div className="message" key={index}>{message.name}: {message.message}</div>;
		});
	};

	render() {
		return <div className="message-container">{this.getMessages()}</div>;
	}
}

export default ChatSection;
