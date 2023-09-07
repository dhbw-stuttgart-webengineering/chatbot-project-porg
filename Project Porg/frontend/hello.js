console.log("hello world!");
function receiveMessage(message) {
    if (message.trim() !== '') {
        const botMessageContainer = document.createElement('div');
        const botMessage = document.createElement('div');
        botMessage.className = 'message';
        botMessage.textContent = message;
        if(message.includes("Quelle:") && message.includes("https://")){
            botMessage.innerHTML = message.split("Quelle:")[0];
            botMessage.innerHTML += "<br>";
            quelle = lookForLinks(message.split("Quelle:")[1]);
            botMessage.innerHTML += quelle;
        }
        botMessageContainer.appendChild(botMessage);
        document.querySelector('.messages').appendChild(botMessageContainer);
        message.value = '';
        botMessageContainer.scrollIntoView();
        document.getElementById("sendMessage").disabled = false;
        document.getElementById("sendMessage").style.backgroundColor= '#e2011b';
    }
}
function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'user-message';
        const userMessage = document.createElement('div');
        userMessage.className = 'message';
        userMessage.textContent = userInput;
        userMessageContainer.appendChild(userMessage);
        document.querySelector('.messages').appendChild(userMessageContainer);
        document.getElementById('user-input').value = '';
        userMessageContainer.scrollIntoView();
        document.getElementById('sendMessage').disabled = true;
        document.getElementById("sendMessage").style.backgroundColor= '#7d878d';
        askGPT(userInput);
    }
}
function clearChat() {
    let messages = document.getElementsByClassName('messages');
    while (messages[0].firstChild) {
        messages[0].removeChild(messages[0].firstChild);
    }
    const botMessage = document.createElement('div');
    botMessage.className = 'message';
    botMessage.textContent = "Hallo, ich bin dein treuer Porg! Wie kann ich dir heute helfen?";
    document.querySelector('.messages').append(botMessage);
    botMessage.scrollIntoView();
}
function lookForLinks(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!message.match(urlRegex)) {
        return message;
    }
    const a = document.createElement('a');
    a.style.fontSize = "12px";
    a.href = message.match(urlRegex)[0];
    a.target = '_blank';
    a.textContent = "Quelle zu diesen Informationen"
    return a.outerHTML;
}
function addLinktoList(beschreibung, link){
    const linkLi = document.createElement('li');
    const linkA = document.createElement('a');
    linkA.textContent = beschreibung;
    linkA.href = link;
    linkLi.appendChild(linkA);
    document.getElementById("father").append(linkLi);
}
function askGPT(message){
    const Http = new XMLHttpRequest();
    const url='http://127.0.0.1:5050/chat';
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