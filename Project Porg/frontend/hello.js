console.log("hello world!");
talking = false;
window.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' && !talking) {
        sendMessage();
    }
});

function receiveMessage(message) {
    message = message.replace("Antwort: ", "");
    if (message.trim() !== '') {
        const botMessageContainer = document.createElement('div');
        const botMessage = document.createElement('div');
        let messageNumber = document.getElementsByClassName('message').length;
        botMessage.className = 'message';
        botMessage.id = 'bot-message-' + messageNumber;
        botMessageContainer.id = 'bot-message-container-' + messageNumber;
        let text = message.split("Quelle:");
        let quelle = "<br>";
        if(message.includes("Quelle:")){
            text = message.split("Quelle:")[0];
            if(message.includes("https://")){
                quelle += lookForLinks(message.split("Quelle:")[1]);
            }
        }
        botMessageContainer.appendChild(botMessage);
        document.querySelector('.messages').insertBefore(botMessageContainer, document.querySelector('#selector'));
        typeWriter(text.trim(), messageNumber, quelle);
        message.value = '';
        document.getElementById("selector").scrollIntoView();
        document.getElementById("sendMessage").disabled = false;
        document.getElementById("sendMessage").style.backgroundColor= '#e2011b';
        talking = false;
    }
}

function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        talking = true;
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'user-message';
        const userMessage = document.createElement('div');
        userMessage.className = 'message';
        userMessage.textContent = userInput;
        userMessageContainer.appendChild(userMessage);
        document.querySelector('.messages').insertBefore(userMessageContainer, document.querySelector('#selector'));
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
    const selector = document.createElement('div');
    selector.id = 'selector';
    document.querySelector('.messages').append(botMessage);
    document.querySelector('.messages').append(selector);
    botMessage.scrollIntoView();
}
function lookForLinks(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!message.match(urlRegex)) {
        return message;
    }
    const a = document.createElement('a');
    a.style.fontSize = "12px";
    let url = message.match(urlRegex)[0];
    if (url.match(/[^\w\d]$/)) {
        url = url.slice(0, url.length - 1);
    }
    a.href = url;
    a.target = '_blank';
    a.textContent = "Quelle zu diesen Informationen"
    return a.outerHTML;
}
function addLinktoList(beschreibung, link){
    const linkLi = document.createElement('li');
    const linkA = document.createElement('a');
    linkA.textContent = beschreibung;
    linkA.href = link;
    linkA.className = 'removeTag';
    linkLi.className ='removeTag';
    linkLi.appendChild(linkA);
    document.getElementById("father").append(linkLi);
}
function removeLinksfromList() {
    let speicher = document.getElementsByClassName('link-list');
    while (speicher[0].firstChild) {
        speicher[0].removeChild(speicher[0].firstChild);
    }
    const linkLi = document.createElement('li');
    linkLi.textContent = 'hier kommt eine link liste hin';
    linkLi.id= 'father';
    document.getElementById("ol").append(linkLi);
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

function typeWriter(txt, messageNumber, quelle) {
    let i = 0;
    const txtArray = txt.toString().split("");
    if (i < txt.length) {
        let speed = Math.floor(Math.random() * 10) + 10;
        if (txtArray[i] === "\n") {
            txtArray[i] = "<br>";
        }
        document.getElementById("bot-message-" + messageNumber).innerHTML += txtArray[i];
        document.getElementById("selector").scrollIntoView();
        let talk = Math.floor(Math.random() * 2);
        if (talk === 1) {
            document.getElementById("porg").setAttribute("src", "files/Porg_Speaking.png")
        } else {
            document.getElementById("porg").setAttribute("src", "files/Porg.png")
        }
        txtArray.shift();
        i++;
        setTimeout(typeWriter, speed, txtArray.join(""), messageNumber, quelle);
    } else {
        document.getElementById("porg").setAttribute("src", "files/Porg.png")
        document.getElementById('bot-message-' + messageNumber).innerHTML += quelle;
    }
}