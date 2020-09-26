import React from "react";
import "./ParentDisabler.css";

export interface ParentDisablerProps {
	onCLick: () => any;
}

class ParentDisabler extends React.Component<ParentDisablerProps> {
	render() {
		return <div className="parent-disable" onClick={this.props.onCLick}></div>;
	}
}

export default ParentDisabler;
