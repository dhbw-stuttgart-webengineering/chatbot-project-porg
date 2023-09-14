/*
* Declare Variables
*/
let talking = false;
let uuid = getCookie("uuid");
let jahrgang = getCookie("jahrgang");
let username = getCookie("username");
let endpoint = "https://programmentwurf-project-porg-oa69-main-i26p7quipa-ew.a.run.app";

/**
 * Wait for DOM to load before executing code.
 */
window.addEventListener('DOMContentLoaded', ()=>{
    // Check if UUID is set
    if (!checkCookie("uuid")) {
        uuid = uuidv4();
        setCookie("uuid", uuid);
    }
    // Check if Jahrgang is set
    if (!checkCookie("jahrgang")) {
        jahrgang = document.getElementById("jahrgang").value;
        setCookie("jahrgang", jahrgang);
    } else {
        document.getElementById("jahrgang").value = jahrgang;
    }
    // Check if Username is set
    if (checkCookie("username")) {
        username = getCookie("username");
        document.getElementById("username").value = username;
    }
    // Add event listener to jahrgang input
    document.getElementById("jahrgang").addEventListener("change", function() {
        jahrgang = document.getElementById("jahrgang").value;
        setCookie("jahrgang", jahrgang);
    });
    // Add event listener to username input
    document.getElementById("username").addEventListener("change", function() {
        username = document.getElementById("username").value;
        setCookie("username", username);
    });
    // Add event listener to send message button
    window.addEventListener('keyup', function (event) {
        if (event.key === 'Enter' && !talking) {
            sendMessage();
        }
    });
    // Add Messages from Database
    addMessages();

    // Load font-size from cookies
    let slider = document.getElementById("fontSize");
    
    slider.value = getCookie("fontSize");
    changeFontSize(slider.value);

    slider.addEventListener("mousemove", function() {
        changeFontSize(slider.value);
        setCookie("fontSize", slider.value);
    });
});

/**
 * Receives a message from bot and appends it to the chat window.
 * @param {string} message - The message to be displayed.
 * @param {boolean} [animate=true] - Whether or not to animate the message.
 */
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
        document.getElementById("sendMessage").style.backgroundColor= 'var(--secondary-color)';
        document.getElementById('reportBug').style.display = 'block';
        talking = false;
    }
}

/**
 * Sends a message to the chat interface.
 * @param {string} message - The message to be sent. If empty, the function will use the value of the user input field.
 * message parameter is necassary for recreating messages from the database.
 */
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


/**
 * Clears the chat messages and sends a POST request to reset the chat history in the database.
 * Also adds a bot message and a selector to the chat.
 * @function
 */
function clearChat() {
    let messages = document.getElementsByClassName('messages');
    while (messages[0].firstChild) {
        messages[0].removeChild(messages[0].firstChild);
    }
    const Http = new XMLHttpRequest();
    const url=endpoint + '/reset';
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


/**
 * Looks for links in a given message and returns an HTML anchor element with the link.
 * If no link is found, returns the original message.
 * @param {string} message - The message to search for links.
 * @returns {string} - The original message or an HTML anchor element with the link.
 */
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


/**
 * Changes the font size of the chat container.
 * @param {number} amount - The amount to change the font size by.
 */
function changeFontSize(amount) {
    let nachrichten = document.getElementsByClassName("chat-container");
    for (const element of nachrichten) {
        element.style.fontSize = amount/50 + "em";
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

/**
 * Sends a message to a GPT chatbot server and receives a response.
 * @param {string} message - The message to send to the chatbot.
 */
function askGPT(message){
    const Http = new XMLHttpRequest();
    const url=endpoint + '/chat';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Access-Control-Allow-Origin", "*");
    Http.send(JSON.stringify({"query": message, "uuid": uuid}));
    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            console.log(response);
            receiveMessage(response.response);
        }
    }
}

/**
 * This function simulates a typewriter effect by printing out a given text message character by character.
 * @param {string} txt - The text message to be printed out.
 * @param {number} messageNumber - The ID of the message to be printed out.
 * @param {string} quelle - The source of the message to be printed out.
 */
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

/**
 * Sends an HTTP POST request to a mail server with the chat history as the request body.
 */
function sendMail(){
    const Http = new XMLHttpRequest();
    const url=endpoint + '/mail';
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

/**
 * Creates and displays an alert message for the report with a close button.
 * @function
 * @returns {void}
 */
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

/**
 * Sends a POST request to a specified URL to retrieve conversation data and adds the messages to the chat window.
 * @function addMessages
 * @returns {void}
 */
function addMessages(){
    const Http = new XMLHttpRequest();
    const url=endpoint + '/getData';
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


/**
 * Generates a random UUID v4 string.
 * @returns {string} The generated UUID v4 string.
 */
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * Retrieves the value of a cookie by its name.
 * @param {string} cname - The name of the cookie to retrieve.
 * @returns {string} The value of the cookie, or an empty string if the cookie does not exist.
 */
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(const element of ca) {
      let c = element;
      while (c.startsWith(' ')) {
        c = c.substring(1);
      }
      if (c.startsWith(name)) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}


/**
 * Sets a cookie with the given name and value.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 */
function setCookie(name, value) {
    document.cookie = name + "=" + value + "; expires=Thu, 31 Dec 2100 12:00:00 UTC; path=/";
}


/**
 * Checks if a cookie with the given name exists.
 * @param {string} name - The name of the cookie to check.
 * @returns {boolean} - Returns true if the cookie exists, false otherwise.
 */
function checkCookie(name) {
    let cookie = getCookie(name);
    if (cookie != "") {
        return true;
    } else {
        return false;
    }
}


/**
 * Switches between light and dark theme by toggling the 'data-theme' attribute of the root element.
 */
function switchTheme() {
    let a = document.documentElement.getAttribute('data-theme');
    if (a == "light") {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
    }    
}
