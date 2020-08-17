import express from "express";
import path from "path";
//import ZilchEngine from "./game/ZilchEngine";
import ScoreModel from "./game/ScoreModel";
import PlayerModel from "./game/PlayerModel";
import GameController from "./game/GameController";

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

const users = {};
const game: GameController = new GameController();

io.on("connection", (socket) => {
	socket.on("new-user", (name) => {
		if (!game.isGameStarted()) {
			game.startNewGame();
		}

		console.log(socket.id + " " + game.getNumPlayers());

		let newPlayer: PlayerModel = new PlayerModel();
		newPlayer.bankScore = 0;
		newPlayer.currentScore = 0;
		newPlayer.playerID = socket.id;
		newPlayer.playerName = name;

		game.addPlayer(newPlayer);

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

	socket.on("roll", () => {
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

		player.currTurn = game.startTurn();

		let scores: ScoreModel[] = game.rollDice(player.currTurn);

		let message: string = "";
		for (let score of scores) {
			message = message + score.scoreType + " " + score.value.toString() + " ";
		}

		for (let dice of player.currTurn.dices) {
			message = message + dice.value.toString() + " ";
		}

		socket.broadcast.emit("chat-message", {
			message: message,
			name: users[socket.id],
		});

		socket.emit("roll-message", {
			message: message,
			name: users[socket.id],
			roll: player.currTurn,
		});

		if (scores.length === 0) {
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
	});

	socket.on("reroll", (dataIsLocked: boolean[]) => {
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

		for (let index = 0; index < 6; index++) {
			if (dataIsLocked[index]) {
				player.currTurn.dices[index].isLocked = true;
			}
		}

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

		let scores: ScoreModel[] = game.rollDice(player.currTurn);

		let message: string = "Reroll: ";
		for (let score of scores) {
			message = message + score.scoreType + " " + score.value.toString() + " ";
		}

		for (let dice of player.currTurn.dices) {
			message = message + dice.value.toString() + " ";
		}

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
		});

		if (scores.length === 0) {
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

		// if all dice used, clear board and allow turn to continue
		// clear locked
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

		for (let index = 0; index < 6; index++) {
			if (dataIsLocked[index]) {
				player.currTurn.dices[index].isLocked = true;
			}
		}

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
