import React from "react";
import Drawer from "../Drawer/Drawer";

export interface RulesDrawerProps {
	isShown: boolean;
	onClose: () => any;
}

class RulesDrawer extends React.Component<RulesDrawerProps> {
	handleCloseClick = () => {
		this.props.onClose();
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
			<Drawer
				isShown={this.props.isShown}
				header="Zilch Rules"
				textElements={this.getRules()}
				onClose={this.props.onClose}
			></Drawer>
		) 
	}
}

export default RulesDrawer;
