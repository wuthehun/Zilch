import React from "react";
import "./Header.css";

export interface HeaderProps {
	isUserAdmin: boolean;
	onReset: () => any;
}

class Header extends React.Component<HeaderProps> {
	getAdminClassName = (): string => {
		let className: string = "reset-button";

		// not admin
		if (!this.props.isUserAdmin) {
			className = "hidden-button";
		}

		return className;
	};

	render() {
		return (
			<div className="header">
				<div className="header-text">Zilch</div>
				<div className={this.getAdminClassName()} onClick={this.props.onReset}>
					Reset
				</div>
			</div>
		);
	}
}

export default Header;
