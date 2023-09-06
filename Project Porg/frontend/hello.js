console.log("hello world!");
function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'user-message';
        const userMessage = document.createElement('div');
        userMessage.className = 'message';
        userMessage.textContent = userInput;
        userMessageContainer.appendChild(userMessage);huhu
        document.querySelector('.user-message').appendChild(userMessageContainer);
        document.getElementById('user-input').value = '';
    }
}

function receiveMessage(message) {
    if (message.trim() !== '') {
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'user-message';
        const userMessage = document.createElement('div');
        userMessage.className = 'message';
        userMessage.textContent = userInput;
        userMessageContainer.appendChild(userMessage);
        document.querySelector('.user-message').appendChild(userMessageContainer);
        document.getElementById('user-input').value = '';
    }
}