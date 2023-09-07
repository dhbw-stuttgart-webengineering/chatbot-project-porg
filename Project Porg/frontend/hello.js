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
        document.querySelector('.user-message').appendChild(userMessageContainer);
        document.getElementById('user-input').value = '';
        askGPT(userInput);
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
        document.querySelector('.chat-container').appendChild(botMessageContainer);
        message.value = '';
    }
}

function lookForLinks(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    })
}

function askGPT(message){
    const Http = new XMLHttpRequest();
    const url='http://127.0.0.1:5000/chat';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Access-Control-Allow-Origin", "*");
    Http.send(JSON.stringify({"query": message}));
    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            console.log(response);
            receiveMessage(response.response);
        }
    }
}