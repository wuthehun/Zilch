import React from "react";
import ParentDisabler from "../ParentDisabler/ParentDisabler";
import "./Drawer.css";

export interface DrawerProps {
	isShown: boolean;
	textElements: JSX.Element;
	header: string;
	onClose: () => any;
}

class Drawer extends React.Component<DrawerProps> {
	handleCloseClick = () => {
		this.props.onClose();
	};

	render() {
		return this.props.isShown ? (
			<>
				<ParentDisabler onCLick={this.handleCloseClick}></ParentDisabler>
				<div className="drawer-body">
					<div className="drawer-header">{this.props.header}</div>
					<div className="drawer-text">{this.props.textElements}</div>
				</div>
			</>
		) : (
			<></>
		);
	}
}

export default Drawer;
