import React from "react";
import { MenuItem } from "../../models/MenuItemModel";
import ParentDisabler from "../ParentDisabler/ParentDisabler";
import "./Menu.css";

export interface MenuProps {
	isShown: boolean;
	onClose: () => any;
	menuFunctions: MenuItem[];
}

class Menu extends React.Component<MenuProps> {
	getMenuItems = (): JSX.Element => {
		return (
			<div>
				{this.props.menuFunctions.map(
					(item: MenuItem) => {
						return (
							<div className="menu-item" onClick={item.menuOnClick}>
								- {item.menuName}
							</div>
						);
					}
				)}
			</div>
		);
	};

	render() {
		return (
			this.props.isShown && (
				<div>
					<ParentDisabler onCLick={this.props.onClose}></ParentDisabler>
					<div className="menu-body">
						<div className="menu-header">Menu</div>
						<div className="menu-content">
							{this.getMenuItems()}
						</div>
					</div>
				</div>
			)
		);
	}
}

export default Menu;
