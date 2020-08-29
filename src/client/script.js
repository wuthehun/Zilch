const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const name = prompt('What is your name?')
const lblName = document.getElementById('lblName');
lblName.innerHTML = name;

socket.emit('new-user', name)

socket.on('connected', data => {
	if (data.score !== '') {
		const lblScore = document.getElementById('lblBankScore');
		lblScore.innerHTML = data.score;

	}

	appendMessage("You: " + data.message);
})

socket.on('chat-message', data => {
	appendMessage(`${data.name}: ${data.message}`)

})

socket.on('user-connected', name => {
	appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
	appendMessage(`${name} disconnected`)
})

socket.on('turn-change', name => {
	const lblPlayer = document.getElementById('lblPlayer');
	lblPlayer.innerHTML = name + '\'s Turn';
	appendMessage(`${name}: ${name}\'s turn`)

})

socket.on('your-turn', data => {
	const lblPlayer = document.getElementById('lblPlayer');
	lblPlayer.innerHTML = 'Your Turn';
	appendMessage(`You: Your Turn`)

})

socket.on('roll-message', data => {
	appendMessage(`You: ${data.message}`)

	for (var index = 0; index < 6; index++) {
		const lblDice = document.getElementById('lblDice' + (index + 1).toString());
		const chkDice = document.getElementById('chkDice' + (index + 1).toString());

		if (data.isReset != null && data.isReset){
			lblDice.innerHTML = '';
			chkDice.checked = false;
		}
		else {
			lblDice.innerHTML = data.roll.dices[index].value.toString();
		}
	}

	if (data.score != null) {
		const lblScore = document.getElementById('lblCurrScore');
		lblScore.innerHTML = data.score.toString();
	}

	if (data.bankScore != null) {
		const lblScore = document.getElementById('lblBankScore');
		lblScore.innerHTML = data.bankScore.toString();
	}
})

socket.on('zilch-message', data => {
	appendMessage(`You: ${data.message}`)

	this.resetPlayerFields(false);
})

socket.on('player-wins', name => {
	const lblPlayer = document.getElementById('lblPlayer');
	lblPlayer.innerHTML = name + ' Wins!';
	appendMessage(`${name}: Winner! You lose`);
	const btnReset = document.getElementById('btnReset');

	resetScoreFields(true);
})

socket.on('you-win', data => {
	const lblPlayer = document.getElementById('lblPlayer');
	lblPlayer.innerHTML = 'You Win!';
	appendMessage(`You: Winner`)
	const btnReset = document.getElementById('btnReset');
	btnReset.hidden = false;

	resetScoreFields(true);
})

socket.on('roll-reset', data => {
	appendMessage(`You: ${data.message}`);

	for (var index = 0; index < 6; index++) {
		const chkDice = document.getElementById('chkDice' + (index + 1).toString());
		chkDice.checked = false;
	}


})

messageForm.addEventListener('submit', e => {
	e.preventDefault()
	
	const message = messageInput.value

	if (message.toUpperCase() === '/SCORES') {
		socket.emit('get-scores')
	}
	else 
	{ 
		appendMessage(`You: ${message}`)
		socket.emit('send-chat-message', message)
	}
	messageInput.value = ''
})

function appendMessage(message) {
	const messageElement = document.createElement('div')
	messageElement.className = "inner-div"
	messageElement.innerText = message
	messageContainer.append(messageElement)

	updateScroll()
}

function roll() {
	var dataIsLocked = [];
	var hasLocked = false;

	var isReroll = false;
	for (var index = 0; index < 6; index++) {
		const chkDice = document.getElementById('chkDice' + (index + 1).toString());
		if (chkDice.checked) {
			hasLocked = true;
		}

		const lblDice = document.getElementById('lblDice' + (index + 1).toString());
		if (lblDice.innerHTML !== '') {
			isReroll = true;
		}

		dataIsLocked.push(chkDice.checked);
	}

	if (isReroll && !hasLocked) {
		appendMessage('SYSTEM: you much lock one number');
		return;
	}

	socket.emit('roll', dataIsLocked)

}

function bankScore() {
	var dataIsLocked = [];
	var hasLocked = false;

	for (var index = 0; index < 6; index++) {
		const chkDice = document.getElementById('chkDice' + (index + 1).toString());
		if (chkDice.checked) {
			hasLocked = true;
		}

		dataIsLocked.push(chkDice.checked);
	}

	socket.emit('bank', dataIsLocked)

}

function resetGame() {
	const btnReset = document.getElementById('btnReset');
	btnReset.hidden = true;

	socket.emit('reset', 'reset');
	this.resetPlayerFields(true);
}

function resetPlayerFields(pbIsResetBankScore) {
	for (var index = 0; index < 6; index++) {
		const lblDice = document.getElementById('lblDice' + (index + 1).toString());
		const chkDice = document.getElementById('chkDice' + (index + 1).toString());

		lblDice.innerHTML = '';
		chkDice.checked = false;
	}

	resetScoreFields(pbIsResetBankScore);
}

function resetScoreFields(pbIsResetBankScore) {
	const lblCurrScore = document.getElementById('lblCurrScore');
	lblCurrScore.innerHTML = '0';

	if (pbIsResetBankScore) {
		const lblBankScore = document.getElementById('lblBankScore');
		lblBankScore.innerHTML = '0';
	}

}

function updateScroll(){
	var element = document.getElementById('message-container');
	element.scrollTop = element.scrollHeight;
}