import express from "express";
import path from "path";
import ScoreModel from "./game/ScoreModel";
import PlayerModel from "./game/PlayerModel";
import GameController from "./game/GameController";

/**
 * things to do:
 * - clean up
 * -- refactor out game controller that is in app.ts
 * -- app.ts should only handle FE comm
 * -- maybe create a main class for FE comm
 * -- revise user messages to make them look nicer
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
const port = 3000;
app.set("port", process.env.PORT || 3000);

const http = require("http").Server(app);
const io = require("socket.io")(http);

app.get("/", (req, res) => {
	res.sendFile(path.resolve("./src/client/index.html"));
});

app.get("/script.js", (req, res) => {
	res.sendFile(path.resolve("./src/client/script.js"));
});

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
	socket.on("new-user", (name) => {
		if (!game.isGameStarted()) {
			game.startNewGame();
		}

		console.log(socket.id + " " + game.getNumPlayers());

		game.setupPlayer(name, socket.id);

		users[socket.id] = name;
		socket.broadcast.emit("user-connected", name);

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

		if (game != undefined && !game.doesPlayerExist(socket.id)) {
			delete users[socket.id];
			return;
		}

		if (game != undefined && game.isGameStarted()) {

			const currentPlayer: PlayerModel = game.getCurrentPlayer();
			if (currentPlayer != null) {
				const isCurrentPlayer: boolean = game.getCurrentPlayer().playerID === socket.id;
				game.removePlayer(socket.id);

				if (game.getNumPlayers() === 0 || game.isGameOver()) {
					game.resetGame();
				} 
				else if(isCurrentPlayer) {
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
		}
		else {
			handleReroll(socket, dataIsLocked);
		}
	});

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
		});

		socket.emit("roll-message", {
			message: message,
			name: users[socket.id],
			roll: player.currTurn,
			score: player.currentScore,
			bankScore: player.bankScore,
			isReset: true,
		});

		handleTurnChange(socket);
	});

	socket.on("reset", () => {
		game.resetGame();

		updateTurnAll(socket);
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
	} 
	else {
		for (let player of game.getPlayers()) {
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
	} 
	else {
		socket.emit(
			"turn-change",
			game.getCurrentPlayer().playerName
		);
	}
}

function handleGameOver(socket) {
	if (game.getWinner().playerID === socket.id) {
		socket.emit("you-win", "you");
		socket.broadcast.emit(
			"player-wins",
			game.getWinner().playerName
		);
	} else {
		for (let player of game.getPlayers()) {
			if (player.playerID !== game.getCurrentPlayer().playerID) {
				io.to(player.playerID).emit(
					"player-wins",
					game.getWinner().playerName
				);
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
	}
	catch (e) {
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
		message = message + " - " + score.scoreType + " " + score.value.toString() + "\n";
	}

	socket.broadcast.emit("chat-message", {
		message: message,
		name: users[socket.id],
	});

	socket.emit("roll-message", {
		message: message,
		name: users[socket.id],
		roll: pPlayer.currTurn,
		score: pPlayer.currentScore,
		bankScore: pPlayer.bankScore,
	});

	if (scores.length === 0) {
		pPlayer.currTurn = game.getNewTurn();
		handleTurnChange(socket);
		socket.broadcast.emit("chat-message", {
			message: "ZILCH! Next Player Turn!",
			name: users[socket.id],
		});

		socket.emit("zilch-message", {
			message: "ZILCH! Next Player Turn!",
			name: "You",
		});
	}

	
}
