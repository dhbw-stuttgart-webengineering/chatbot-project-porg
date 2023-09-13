let talking = false;
setCookie();
let uuid = getCookie("uuid");
addMessages();
window.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' && !talking) {
        sendMessage();
    }
});

window.addEventListener('DOMContentLoaded', ()=>{
    let slider = document.getElementById("schriftgroeße");
    
    /* Load the font-size saved in the cookies */
    slider.value = getCookie("fontSize");
    changeFontSize(slider.value);

    slider.addEventListener("mousemove", function() {
        console.log(slider.value);
        changeFontSize(slider.value);
        document.cookie = "fontSize=" + slider.value + "; expires=Thu, 31 Dec 2100 12:00:00 UTC; path=/";
    });
});

function receiveMessage(message, animate = true) {
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
            text = message.split("Quelle:")[0].trim();
            if(message.includes("https://")){
                quelle += lookForLinks(message.split("Quelle:")[1]);
            }
        }
        botMessageContainer.appendChild(botMessage);
        document.querySelector('.messages').insertBefore(botMessageContainer, document.querySelector('#selector'));
        if (animate) {
            typeWriter(text, messageNumber, quelle);
        } else {
            botMessage.innerHTML = text + quelle;
        }
        message.value = '';
        document.getElementById("selector").scrollIntoView();
        document.getElementById("sendMessage").disabled = false;
        document.getElementById("sendMessage").style.backgroundColor= '#e2011b';
        document.getElementById('reportBug').style.display = 'block';
        talking = false;
    }
}

function sendMessage(message="") {
    let userInput = document.getElementById('user-input').value;
    if (message.trim() !== '') {
        userInput = message;
    }
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
        if (message.trim() === '') { 
            askGPT(userInput);
        }
    }
}

function clearChat() {
    let messages = document.getElementsByClassName('messages');
    while (messages[0].firstChild) {
        messages[0].removeChild(messages[0].firstChild);
    }
    const Http = new XMLHttpRequest();
    const url='http://127.0.0.1:5050/reset';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Access-Control-Allow-Origin", "*");
    Http.send(JSON.stringify({"uuid": uuid}));
    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            console.log(response);
        }
    }
    const botMessage = document.createElement('div');
    botMessage.className = 'message';
    botMessage.textContent = "Hallo, ich bin Porg! Wie kann ich dir heute helfen?";
    const selector = document.createElement('div');
    selector.id = 'selector';
    document.querySelector('.messages').append(botMessage);
    document.querySelector('.messages').append(selector);
    botMessage.scrollIntoView();
    document.getElementById('reportBug').style.display = 'none';
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
function changeFontSize(amount) {
    let nachrichten = document.getElementsByClassName("chat-container");
    for (let i = 0; i < nachrichten.length; i++) {
        nachrichten[i].style.fontSize = amount/50 + "em";
    }
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
    linkLi.id= 'father';
    document.getElementById("ol").append(linkLi);
}

function askGPT(message){
    const Http = new XMLHttpRequest();
    const url='http://127.0.0.1:5050/chat';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Access-Control-Allow-Origin", "*");
    Http.send(JSON.stringify({"query": message, "uuid": uuid, "jahrgang": "2022"}));
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

function sendMail(){
    const Http = new XMLHttpRequest();
    const url='http://127.0.0.1:5050/mail';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Access-Control-Allow-Origin", "*");
    const messages = document.getElementsByClassName('message');
    let text = "";
    for(const element of messages){
        if (element.id.includes("bot-message")) {
            text += "Bot: " + element.textContent.trim() + "\n\n";
        } else {
            text += "User: " + element.textContent.trim() + "\n\n";
        }
    }
    Http.send(JSON.stringify({"query": text}));
    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            console.log(response);
            addAlert();
        }
    }
}

function addAlert(){
    const alert = document.createElement('div');
    alert.className = 'alert abled';
    const span = document.createElement('span');
    span.className = 'closebtn';
    span.textContent = "x";
    span.onclick = function() {
        alert.classList.remove("abled");
        alert.classList.add("disabled");
    };
    const strong = document.createElement('strong');
    strong.textContent = "Reported!";
    alert.appendChild(strong);
    alert.textContent = " Ihr Chatverlauf wurde dem Team von Project Porg zugesendet und wird überprüft.";
    alert.appendChild(span);
    document.querySelector('body').appendChild(alert);
    alert.scrollIntoView();
}

function addMessages(){
    const Http = new XMLHttpRequest();
    const url='http://127.0.0.1:5050/getData';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Access-Control-Allow-Origin", "*");
    Http.send(JSON.stringify({"uuid": uuid}));
    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            let conversation = eval(response["response"][0][1])
            if (conversation === undefined){
                return;
            }
            for(const element of conversation){
                if(element["role"] === "assistant"){
                    receiveMessage(element["content"], false);
                }else{
                    sendMessage(element["content"]);
                }
            }
        }
    }
}
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

function setCookie() {
    let cookie = getCookie("uuid");
    if (cookie === "") {
        cookie = uuidv4();
        document.cookie = "uuid=" + cookie + "; expires=Thu, 31 Dec 2100 12:00:00 UTC; path=/";
        console.log("Cookie set");
    } else {
        console.log("Cookie already set");
    }
}