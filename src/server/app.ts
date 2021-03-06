import express from "express";
import ScoreModel from "./game/ScoreModel";
import PlayerModel from "./game/PlayerModel";
import GameController from "./game/GameController";

/**
 * things to do:
 * - clean up
 * -- * refactor out game controller that is in app.ts
 * -- * app.ts should only handle FE comm
 * -- maybe create a main class for FE comm
 * -- * revise user messages to make them look nicer
 * -- probably need to add a list of all socket.io message names
 * -- probably need to break up files.  app.ts and gamecontroller.ts should be smaller
 * -- player refresh and keep
 * - FE
 * -- figma
 * -- react
 * -- add score board
 * - new features
 * -- multiple running games
 * -- game rooms
 * -- some sort of landing page
 * - future
 * -- strapi
 */

// Setup express and socket.io servers
const app = express();
const port = process.env.PORT || 3000;
app.set("port", process.env.PORT || 3000);

const http = require("http").Server(app);
const io = require("socket.io")(http);

app.use(express.static("./client/build"));

const server = http.listen(port, (err) => {
	if (err) {
		return console.error(err);
	}
	return console.log(`server is listening on ${port}`);
});
// end setup

const users = {};
const game: GameController = new GameController();

io.on("connection", (socket) => {
	socket.on("new-user", (name: string) => {
		if (!game.isGameStarted()) {
			game.startNewGame();
		}

		let playerName: string = name;
		let isAdmin: boolean = false;
		if (name.startsWith("Admin-")) {
			playerName = name.replace("Admin-", "");
			isAdmin = true;
		}

		let player: PlayerModel = null;
		try {
			player = game.setupPlayer(playerName, socket.id, isAdmin);
		} catch (e) {
			socket.emit("chat-message", {
				message: "Cannot add player: " + e.message,
				name: "SYSTEM",
			});
			return;
		}

		users[socket.id] = playerName;
		socket.broadcast.emit("user-connected", playerName);

		socket.emit("connected", {
			message: "You joined",
			score: player.bankScore,
			isAdmin: isAdmin,
			isManualMode: game.getManualMode(),
		});

		updateTurnSingle(socket);
	});

	socket.on("send-chat-message", (message) => {
		socket.broadcast.emit("chat-message", {
			message: message,
			name: users[socket.id],
		});
	});

	socket.on("disconnect", () => {
		console.log("bye " + socket.id + " " + game.getNumPlayers());

		if (users[socket.id] == undefined) {
			console.log("not found");
			return;
		}

		if (game != undefined && !game.doesPlayerExist(socket.id)) {
			delete users[socket.id];
			return;
		}

		if (game != undefined && game.isGameStarted()) {
			const currentPlayer: PlayerModel = game.getCurrentPlayer();
			if (currentPlayer != null) {
				const isCurrentPlayer: boolean =
					game.getCurrentPlayer().playerID === socket.id;
				game.removePlayer(socket.id);

				if (game.getNumPlayers() === 0 || game.isGameOver()) {
					console.log("reset");
					game.clearGame();
				} else if (isCurrentPlayer) {
					console.log("update all");
					updateTurnAll(socket);
				}
			}
		}

		socket.broadcast.emit("user-disconnected", users[socket.id]);
		delete users[socket.id];
	});

	socket.on("roll", (dataIsLocked: boolean[]) => {
		let player: PlayerModel = game.getCurrentPlayer();
		if (player.playerID !== socket.id) {
			socket.emit("chat-message", {
				message: "Not your turn",
				name: "SYSTEM",
			});
			return;
		}

		if (game.isGameOver()) {
			socket.emit("chat-message", {
				message: "Game is over",
				name: "SYSTEM",
			});
			return;
		}

		if (game.isFirstRoll(player.currTurn)) {
			handleRollDice(socket, player, false);
		} else {
			handleReroll(socket, dataIsLocked);
		}
	});

	socket.on(
		"roll-manual",
		(manualDice: { value: number; isChecked: boolean }[]) => {
			let player: PlayerModel = game.getCurrentPlayer();
			if (player.playerID !== socket.id) {
				socket.emit("chat-message", {
					message: "Not your turn",
					name: "SYSTEM",
				});
				return;
			}

			if (game.isGameOver()) {
				socket.emit("chat-message", {
					message: "Game is over",
					name: "SYSTEM",
				});
				return;
			}

			handleRollManual(socket, manualDice);
		}
	);

	socket.on("bank", (dataIsLocked: boolean[]) => {
		let player: PlayerModel = game.getCurrentPlayer();
		if (player.playerID !== socket.id) {
			socket.emit("chat-message", {
				message: "Not your turn",
				name: "SYSTEM",
			});
			return;
		}

		if (game.isGameOver()) {
			socket.emit("chat-message", {
				message: "Game is over",
				name: "SYSTEM",
			});
			return;
		}

		game.applyPlayerLocks(dataIsLocked, player.currTurn);

		try {
			game.processTurn(player, true);
		} catch (e) {
			socket.emit("chat-message", {
				message: e.message,
				name: "SYSTEM",
			});
			return;
		}

		let message: string = player.playerName + " bank";
		socket.broadcast.emit("chat-message", {
			message: message,
			name: users[socket.id],
			playerScores: game.getPlayerScores(),
		});

		socket.emit("roll-message", {
			message: message,
			name: users[socket.id],
			roll: player.currTurn,
			score: player.currentScore,
			bankScore: player.bankScore,
			isReset: true,
			playerScores: game.getPlayerScores(),
		});

		handleTurnChange(socket);
	});
	
	socket.on("bank-manual", (manualDice: { value: number; isChecked: boolean }[]) => {
		let player: PlayerModel = game.getCurrentPlayer();
		if (player.playerID !== socket.id) {
			socket.emit("chat-message", {
				message: "Not your turn",
				name: "SYSTEM",
			});
			return;
		}

		if (game.isGameOver()) {
			socket.emit("chat-message", {
				message: "Game is over",
				name: "SYSTEM",
			});
			return;
		}

		game.applyManualRoll(manualDice, player.currTurn);
		let scores:ScoreModel[] = game.getBestScores(player.currTurn);

		try {
			game.processTurn(player, true);
		} catch (e) {
			socket.emit("chat-message", {
				message: e.message,
				name: "SYSTEM",
			});
			return;
		}

		let message: string = player.playerName + " bank\n";
		message = message + "Manual Roll: ";
		for (let dice of player.currTurn.dices) {
			message = message + dice.value.toString() + " ";
		}
		message = message + "\nBest Scores: \n";

		for (let score of scores) {
			message =
				message + " - " + score.scoreType + " " + score.value.toString() + "\n";
		}
	
		socket.broadcast.emit("chat-message", {
			message: message,
			name: users[socket.id],
			playerScores: game.getPlayerScores(),
		});

		socket.emit("roll-message", {
			message: message,
			name: users[socket.id],
			roll: player.currTurn,
			score: player.currentScore,
			bankScore: player.bankScore,
			isReset: true,
			playerScores: game.getPlayerScores(),
		});

		handleTurnChange(socket);
	});

	socket.on("reset", () => {
		let player: PlayerModel = game.findPlayerByID(socket.id);
		if (player) {
			game.resetGame(player.isAdmin);
		} else {
			game.resetGame(false);
		}

		updateTurnAll(socket);
	});

	socket.on("get-scores", () => {
		let scores: string = "\n";

		for (let player of game.getActivePlayers()) {
			scores =
				scores + player.playerName + ": " + player.bankScore.toString() + "\n";
		}

		socket.emit("chat-message", {
			message: scores,
			name: "SCORES",
		});
	});

	socket.on("toggle-manual-mode", () => {
		let player: PlayerModel = game.findPlayerByID(socket.id);
		if (player && player.isAdmin) {
			let isManual: boolean = game.getManualMode();
			game.setManualMode(!isManual);
			updateManualMode(socket, game.getManualMode());
		}
	});
});

function handleTurnChange(socket) {
	game.moveToNextPlayer();

	if (game.isGameOver()) {
		handleGameOver(socket);
	} else {
		updateTurnAll(socket);
	}
}

function updateTurnAll(socket) {
	if (game.getCurrentPlayer().playerID === socket.id) {
		socket.emit("your-turn", "you");
		socket.broadcast.emit("turn-change", game.getCurrentPlayer().playerName);
	} else {
		for (let player of game.getActivePlayers()) {
			if (player.playerID !== game.getCurrentPlayer().playerID) {
				io.to(player.playerID).emit(
					"turn-change",
					game.getCurrentPlayer().playerName
				);
			}
		}

		io.to(game.getCurrentPlayer().playerID).emit("your-turn", "you");
	}
}

function updateTurnSingle(socket) {
	if (game.getCurrentPlayer().playerID === socket.id) {
		socket.emit("your-turn", "you");
	} else {
		socket.emit("turn-change", game.getCurrentPlayer().playerName);
	}
}

function handleGameOver(socket) {
	if (game.getWinner().playerID === socket.id) {
		socket.emit("you-win", "you");
		socket.broadcast.emit("player-wins", game.getWinner().playerName);
	} else {
		for (let player of game.getActivePlayers()) {
			if (player.playerID !== game.getCurrentPlayer().playerID) {
				io.to(player.playerID).emit("player-wins", game.getWinner().playerName);
			}
		}

		io.to(game.getWinner().playerID).emit("you-win", "you");
	}
}

function handleReroll(socket, dataIsLocked) {
	let player: PlayerModel = game.getCurrentPlayer();

	game.applyPlayerLocks(dataIsLocked, player.currTurn);

	try {
		game.processTurn(player, false);
	} catch (e) {
		socket.emit("chat-message", {
			message: e.message,
			name: "SYSTEM",
		});
		return;
	}

	// if all dice are used, reset roll
	// begin again
	if (game.areAllDiceUsed(player.currTurn)) {
		game.resetAfterUsedAllDice(player.currTurn);

		// send reset message to client
		socket.broadcast.emit("chat-message", {
			message: "All dice used!  Continuing roll",
			name: users[socket.id],
		});

		socket.emit("roll-reset", {
			message: "All dice used!  Resetting locks and continuing roll",
			name: "You",
		});
	}
	handleRollDice(socket, player, true);
}

function handleRollDice(socket, pPlayer: PlayerModel, pIsReroll: boolean) {
	let scores: ScoreModel[] = game.rollDice(pPlayer.currTurn);

	let message: string = "Roll: ";
	if (pIsReroll) {
		message = "Reroll: ";
	}

	for (let dice of pPlayer.currTurn.dices) {
		message = message + dice.value.toString() + " ";
	}

	message = message + "\nPossible Scores: \n";

	for (let score of scores) {
		message =
			message + " - " + score.scoreType + " " + score.value.toString() + "\n";
	}

	socket.broadcast.emit("chat-message", {
		message: message,
		name: users[socket.id],
		playerScores: game.getPlayerScores(),
	});

	socket.emit("roll-message", {
		message: message,
		name: users[socket.id],
		roll: pPlayer.currTurn,
		score: pPlayer.currentScore,
		bankScore: pPlayer.bankScore,
		playerScores: game.getPlayerScores(),
	});

	if (scores.length === 0) {
		pPlayer.currTurn = game.getNewTurn();
		socket.broadcast.emit("chat-message", {
			message: "ZILCH! Next Player Turn!",
			name: users[socket.id],
		});

		socket.emit("zilch-message", {
			message: "ZILCH! Next Player Turn!",
			name: "You",
		});
		handleTurnChange(socket);
	}
}

function handleRollManual(socket, manualDice: { value: number; isChecked: boolean }[]) {
	let player: PlayerModel = game.getCurrentPlayer();

	game.applyManualRoll(manualDice, player.currTurn);
	let scores:ScoreModel[] = game.getBestScores(player.currTurn);

	try {
		game.processTurn(player, false);
	} catch (e) {
		socket.emit("chat-message", {
			message: e.message,
			name: "SYSTEM",
		});
		return;
	}

	// if all dice are used, reset roll
	// begin again
	if (game.areAllDiceUsed(player.currTurn)) {
		game.resetAfterUsedAllDice(player.currTurn);

		// send reset message to client
		socket.broadcast.emit("chat-message", {
			message: "All dice used!  Continuing roll",
			name: users[socket.id],
		});

		socket.emit("roll-reset", {
			message: "All dice used!  Resetting locks and continuing roll",
			name: "You",
		});
	}

	let message: string = "Manual Roll: ";
	for (let dice of player.currTurn.dices) {
		message = message + dice.value.toString() + " ";
	}

	message = message + "\nBest Scores: \n";

	for (let score of scores) {
		message =
			message + " - " + score.scoreType + " " + score.value.toString() + "\n";
	}

	socket.broadcast.emit("chat-message", {
		message: message,
		name: users[socket.id],
		playerScores: game.getPlayerScores(),
	});

	socket.emit("roll-message", {
		message: message,
		name: users[socket.id],
		roll: player.currTurn,
		score: player.currentScore,
		bankScore: player.bankScore,
		playerScores: game.getPlayerScores(),
	});

	if (scores.length === 0) {
		player.currTurn = game.getNewTurn();
		socket.broadcast.emit("chat-message", {
			message: "ZILCH! Next Player Turn!",
			name: users[socket.id],
		});

		socket.emit("zilch-message", {
			message: "ZILCH! Next Player Turn!",
			name: "You",
		});
		handleTurnChange(socket);
	}

}

function updateManualMode(socket, pIsManual: boolean) {
	socket.broadcast.emit("update-manual", {
		data: pIsManual,
	});

	socket.emit("update-manual", pIsManual);
}
