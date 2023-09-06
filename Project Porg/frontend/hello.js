console.log("hello world!");
function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'user-message';
        const userMessage = document.createElement('div');
        userMessage.className = 'message';
        userMessage.textContent = userInput;
        userMessageContainer.appendChild(userMessage);
        document.querySelector('.chat-container').appendChild(userMessageContainer);
        document.getElementById('user-input').value = '';
        userMessageContainer.scrollIntoView();
        document.getElementById('sendMessage').disabled = true;
        document.getElementById("sendMessage").style.backgroundColor= '#7d878d';
    }
}

function receiveMessage(message) {
    if (message.trim() !== '') {
        message = lookForLinks(message);
        const botMessageContainer = document.createElement('div');
        botMessageContainer.className = message;
        const botMessage = document.createElement('div');
        botMessage.className = 'message';
        botMessage.textContent = message;
        botMessageContainer.appendChild(botMessage);
        document.querySelector('.chat-container').append(botMessageContainer);
        message.value = '';
        botMessageContainer.scrollIntoView();
        document.getElementById("sendMessage").disabled = false;
        document.getElementById("sendMessage").style.backgroundColor= '#e2011b';
    }
}

function lookForLinks(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    })
}