/*
* Declare Variables
*/
let talking = false;
let uuid = getCookie("uuid");
let jahrgang = getCookie("jahrgang");
let username = getCookie("username");
let openai_api_key = getCookie("openai_api_key");
let semester = 1;
let lehrjahr = 1;
let endpoint = "https://porg-n9hc.onrender.com";
// let endpoint = "http://127.0.0.1:8080";
let cookieRefused = false;

let games = {
    "D&D": "egg/DD/dist/index.html",
    "TT": "egg/TT/dist/index.html",
    "Wordle": "https://wordle.at/",
    "MS": "https://minesweeper.one/spielen/"
}

// get json from personen.json
let personen = {};
fetch("personen.json")
    .then(response => response.json())
    .then(data => personen = data);

/**
 * Wait for DOM to load before executing code.
 */
window.addEventListener('DOMContentLoaded', ()=> {
    if (getCookie("cookies") === "accepted") {
        settingsFromCookies();
        setCookies();
        setMessageFromDatabase();
    }
    setPorg();
    setEventListener();

    document.getElementById("loading").classList.add("remove");

    set_lehrjahr_and_semester();

    // let Porg blink
    setInterval(blinkingAnimation, 100);
});
function setCookies(){
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
    // Check if Open API Key is set
    if (checkCookie("openai_api_key")) {
        openai_api_key = getCookie("openai_api_key");
        document.getElementById("openai_api_key").value = openai_api_key;
    }
}
function settingsFromCookies(){
    if (checkCookie("systemmode")) {
        if (getCookie("systemmode") == "dark") {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById("switch").checked = true;
        }
    }
    if (checkCookie("cookies")) {
        document.getElementById("cookies").style.display = "none";
    }
}
function setEventListener(){
    // Add event listener to jahrgang input
    document.getElementById("jahrgang").addEventListener("change", function() {
        jahrgang = document.getElementById("jahrgang").value;
        set_lehrjahr_and_semester();
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
            sendMessage(document.getElementById('user-input').value);
        }
    });
    // Add event listener for openai_api_key input
    document.getElementById("openai_api_key").addEventListener("change", function() {
        key = document.getElementById("openai_api_key").value;
        setCookie("openai_api_key", key);
        openai_api_key = key;
    });
    // Add event listener to check if resized display all elements again
    window.addEventListener('resize', backToDesktop);
    // Add event listener to change font size slider
    let slider = document.getElementById("fontSize");
    
    slider.value = getCookie("fontSize");
    changeFontSize(slider.value);

    slider.addEventListener("mousemove", function() {
        changeFontSize(slider.value);
        setCookie("fontSize", slider.value);
    });
}
async function setMessageFromDatabase(){
// Add Messages from Database
let isMessagesSet = false;
let i = 0;
while (!isMessagesSet) {
    isMessagesSet = await connectToDatabase();
    i++;
    if (i === 10) {
        document.getElementById("loading-text").textContent = "Versuche Chatverlauf zu laden ...";
    } else if (i === 20) {
        document.getElementById("loading-text").textContent = "Habe Probleme, aber gebe mein Bestes ...";
    } else if (i === 30) {
        document.getElementById("loading-text").textContent = "Verbindung zum Server konnte nicht hergestellt werden. Bitte versuche es später erneut.";
        // delete loading-img
        document.getElementById("loading-img").remove();
    }
    await new Promise(r => setTimeout(r, 1000));
}
}
function setPorg(){
    let a = document.documentElement.getAttribute('data-theme');
    if (a == "light") {
        document.getElementById("porg").src = porgLight+"Porg.png";
        document.getElementById("tabicon").href = porgLight+"icon.png";
    } else {
        document.getElementById("porg").src = porgDark+"Porg.png";
        document.getElementById("tabicon").href = porgDark+"icon.png";
    }
}

async function connectToDatabase() {
    try {
        const response = await fetch(endpoint + '/getData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({"uuid": uuid})
        });
        const data = await response.json();
        let conversation = eval(data["response"][0][1])
        disableSettings();
        if (conversation === undefined){
            return true;
        }
        for(const element of conversation){
            if(element["role"] === "assistant"){
                addBotMessage(element["content"], false);
            }else{
                addUserMessage(element["content"]);
            }
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

function set_lehrjahr_and_semester() {
    // berechne Lehrjahr und Semester.
    // Semester wird immer ab September und März berechnet.
    let date = new Date();
    let month = date.getMonth() + 1;
    if (month >= 9) {
        semester = 1;
        lehrjahr = date.getFullYear() - jahrgang + 1;
    } else if (month <= 3) {
        semester = 1;
        lehrjahr = date.getFullYear() - jahrgang;
    } else {
        semester = 2;
        lehrjahr = date.getFullYear() - jahrgang;
    }
    semester = semester + (lehrjahr-1) * 2;
}

/**
 * Receives a message from bot and appends it to the chat window.
 * @param {string} message - The message to be displayed.
 * @param {boolean} [animate=true] - Whether or not to animate the message.
 */
function receiveMessage(message) {
    if (message.trim() !== '') {
        disableSettings();
        addBotMessage(message);
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
function addUserMessage(message) {
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'user-message';
    const userMessage = document.createElement('div');
    userMessage.className = 'message';
    userMessage.textContent = message;
    userMessageContainer.appendChild(userMessage);
    document.querySelector('.messages').insertBefore(userMessageContainer, document.querySelector('#selector'));
    userMessage.scrollIntoView();
}

function addBotMessage(message, typewrite = true) {
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
    let keys = Object.keys(personen);
    for (const key of keys) {
        if (text.includes(key)) {
            let person = personen[key];
            if (person["bild"] === undefined) {
                person["bild"] = "files/anonym.png";
            }
            let brief = new Steckbrief(person["name"], person["bild"], person["info"], person["data"]);
            showInfo(brief);
        }
    }
    botMessageContainer.appendChild(botMessage);
    document.querySelector('.messages').insertBefore(botMessageContainer, document.querySelector('#selector'));
    if (typewrite) typeWriter(text, messageNumber, quelle)
    else botMessage.innerHTML = text + quelle;
}

function sendMessage(message) {
    if (message.trim() === '') return;
    document.getElementById('user-input').value = '';
    disableSettings();
    if (message.startsWith('/play')) {
        let gameName = message.split(" ")[1];
        if (gameName in games) {
            let link = games[gameName];
            let gameLink = new Game(link);
            showInfo(gameLink);
            addUserMessage(message);
            if (username !== "") {
                addBotMessage("Viel Spaß beim Spielen, " + username + "!");
            } else {
                addBotMessage("Viel Spaß beim Spielen!");
            }
            return;
        }
    } else {
        talking = true;
        addUserMessage(message);
        document.getElementById('sendMessage').disabled = true;
        document.getElementById("sendMessage").style.backgroundColor= '#7d878d';
        let a = document.documentElement.getAttribute('data-theme');
        if (a == "light") {
            document.getElementById("porg").src = porgLight+"Porg_waiting.gif";
        } else {
            document.getElementById("porg").src = porgDark+"Porg_waiting.gif";
        }
        askGPT(message);
    }
}


/**
 * Clears the chat messages and sends a POST request to reset the chat history in the database.
 * Also adds a bot message and a selector to the chat.
 * @function
 */
function clearChat() {
    let messages = document.getElementsByClassName('messages');
    document.getElementById("info").innerHTML = "";
    while (messages[0].firstChild) {
        messages[0].removeChild(messages[0].firstChild);
    }
    disableSettings();
    const botMessage = document.createElement('div');
    botMessage.className = 'message';
    botMessage.textContent = "Hallo, ich bin Porg! Wie kann ich dir heute helfen?";
    const selector = document.createElement('div');
    selector.id = 'selector';
    document.querySelector('.messages').append(botMessage);
    document.querySelector('.messages').append(selector);
    botMessage.scrollIntoView();
    document.getElementById('reportBug').style.display = 'none';
    
    $.ajax({
        type: "POST",
        url: endpoint + '/reset',
        data: JSON.stringify({"uuid": uuid}),
        contentType: "application/json",
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        success: function(response) {
            console.log(response);
        }
    });
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
    a.className = 'messageLink';
    let url = message.match(urlRegex)[0];
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
    let beispielText = document.getElementById("beispielText");
    beispielText.style.fontSize = amount/50 + "em";
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
function addFunctionLinktoList(beschreibung, link, functionToCall){
    const linkLi = document.createElement('li');
    const linkA = document.createElement('a');
    linkA.textContent = beschreibung;
    linkA.href = link;
    linkA.onclick = functionToCall;
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
    $.ajax({
        url: endpoint + '/chat',
        type: 'POST',
        data: JSON.stringify({"query": message, "uuid": uuid, "openai_api_key": openai_api_key , "information": {"jahrgang": "Jahrgang " + jahrgang.toString(), "username": username, "semester": "Semester " + semester.toString(), "lehrjahr": "Lehrjahr " + lehrjahr.toString(), "Heutiges Datum": new Date().toLocaleDateString()}}),
        contentType: 'application/json',
        crossDomain: true,
        success: function(response) {
            receiveMessage(response.response);
        }
    });
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
        let a = document.documentElement.getAttribute('data-theme');
        let src;
        if (a == "light") {
            src = porgLight;
        } else {
            src = porgDark;
        }
        if (talk === 1) {
            document.getElementById("porg").setAttribute("src", src+"/Porg_Speaking.png")
        } else {
            document.getElementById("porg").setAttribute("src", src+"/Porg.png")
        }
        txtArray.shift();
        i++;
        setTimeout(typeWriter, speed, txtArray.join(""), messageNumber, quelle);
    } else {
        document.getElementById('bot-message-' + messageNumber).innerHTML += quelle;
    }
}

/**
 * Sends an HTTP POST request to a mail server with the chat history as the request body.
 */
function sendMail(){
    const messages = document.getElementsByClassName('message');
    let text = "";
    for(const element of messages){
        if (element.id.includes("bot-message")) {
            text += "Bot: " + element.textContent.trim() + "\n\n";
        } else {
            text += "User: " + element.textContent.trim() + "\n\n";
        }
    }
    $.ajax({
        url: endpoint + '/mail',
        type: 'POST',
        data: JSON.stringify({"query": text}),
        contentType: 'application/json',
        success: function(response) {
            console.log(response);
            addAlert();
        }
    });
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
    document.getElementById('reportBug').style.display = 'none';
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
    if (cookieRefused) return;
    document.cookie = name + "=" + value + "; expires=Thu, 31 Dec 2100 12:00:00 UTC; path=/" + "; SameSite=Strict";

}


/**
 * Checks if a cookie with the given name exists.
 * @param {string} name - The name of the cookie to check.
 * @returns {boolean} - Returns true if the cookie exists, false otherwise.
 */
function checkCookie(name) {
    let cookie = getCookie(name);
    return cookie != "";
}


/**
 * Switches between light and dark theme by toggling the 'data-theme' attribute of the root element.
 */

let porgDark ="files/dark/";
let porgLight ="files/light/";
function switchTheme() {
    let a = document.documentElement.getAttribute('data-theme');
    if (a == "light") {
        document.documentElement.setAttribute('data-theme', 'dark');
        setCookie("systemmode", "dark");
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
        setCookie("systemmode", "light");
    }    
    setPorg();
}


/**
 * Disables the "jahrgang" and "username" input fields if there is at least one element with the "user-message" class.
 * Otherwise, enables the input fields.
 */
function disableSettings(){
    if (document.getElementsByClassName("user-message").length !== 0){
        document.getElementById("jahrgang").disabled = true;
        document.getElementById("username").disabled = true;
    } else {
        document.getElementById("jahrgang").disabled = false;
        document.getElementById("username").disabled = false;
    }
}

/**
 * Function that handles the blinking animation of the Porg image.
 * @function
 * @name blinkingAnimation
 * @returns {void}
 */
function blinkingAnimation() {
    let blink = Math.floor(Math.random() * 20);
    let a = document.documentElement.getAttribute('data-theme');
    if (talking) return;
    if (a == "light") {
        if (blink === 1) {
            document.getElementById("porg").src = porgLight+"Porg_closed_eyes.png";
        } else if (!talking) {
                document.getElementById("porg").src = porgLight+"Porg.png";
            }
    } else if (blink === 1) {
            document.getElementById("porg").src = porgDark+"Porg_closed_eyes.png";
        } else if (!talking) {
                document.getElementById("porg").src = porgDark+"Porg.png";
            }
}

function acceptCookies() {
    document.getElementById("cookies").style.display = "none";
    setCookie("cookies", "accepted");
}

function refuseCookies() {
    document.getElementById("cookies").style.display = "none";
    cookieRefused = true;
}

//function to open and close the tabs in mobile version

function openChat() {
    document.getElementById("switchtochat").style.backgroundColor = "#5e6061";
    document.getElementById("switchtosettings").style.backgroundColor = "#7d878d";
    document.getElementById("switchtooverview").style.backgroundColor = "#7d878d";

    document.getElementsByClassName("chat")[0].style.display = "block";
    document.getElementsByClassName("settings-container")[0].style.display = "none";
    document.getElementById("info").style.display = "none";
}

function openSettings() {
    document.getElementById("switchtochat").style.backgroundColor = "#7d878d";
    document.getElementById("switchtosettings").style.backgroundColor = "#5e6061";
    document.getElementById("switchtooverview").style.backgroundColor = "#7d878d";

    document.getElementsByClassName("chat")[0].style.display = "none";
    document.getElementsByClassName("settings-container")[0].style.display = "block";
    document.getElementById("info").style.display = "none";
}

function openOverview() {
    document.getElementById("switchtochat").style.backgroundColor = "#7d878d";
    document.getElementById("switchtosettings").style.backgroundColor = "#7d878d";
    document.getElementById("switchtooverview").style.backgroundColor = "#5e6061";
    document.getElementById("switchtooverview").style.animation = "none";

    document.getElementsByClassName("chat")[0].style.display = "none";
    document.getElementsByClassName("settings-container")[0].style.display = "none";
    document.getElementById("info").style.display = "block";
}


function backToDesktop(){
    //if width over 600 px
    if (window.innerWidth > 600) {
        //clear all element.style properties
        document.getElementsByClassName("chat")[0].style.display = "";
        document.getElementsByClassName("settings-container")[0].style.display = "";
        document.getElementById("info").style.display = "";
        document.getElementById("switchtochat").style.backgroundColor = "#5e6061";
        document.getElementById("switchtosettings").style.backgroundColor = "#7d878d";
        document.getElementById("switchtooverview").style.backgroundColor = "#7d878d";
    }
}

function showInfo(element){
    let info = document.getElementById("info");
    info.innerHTML = "";
    info.appendChild(element.generateHTML());

}

class Steckbrief {
    constructor(name, bild, info, data) {
        this.name = name;
        this.bild = bild;
        this.info = info;
        this.data = data;
    }

    // generate html code for the steckbrief
    generateHTML() {
        notification();
        let steckbrief = document.createElement("div");
        steckbrief.className = "steckbrief";

        let steckbriefTop = document.createElement("div");
        steckbriefTop.className = "steckbriefTop";

        let steckbriefBild = document.createElement("img");
        steckbriefBild.className = "steckbriefBild";
        steckbriefBild.src = this.bild;
        steckbriefTop.appendChild(steckbriefBild);

        let steckbriefInfo = document.createElement("div");
        steckbriefInfo.className = "steckbriefInfo";
        let steckbriefName = document.createElement("h2");
        steckbriefName.className = "steckbriefName";
        steckbriefName.textContent = this.name;
        steckbriefInfo.appendChild(steckbriefName);
        let steckbriefKontakt = document.createElement("p");
        steckbriefKontakt.className = "steckbriefKontakt";
        // if "\\n" in this.info, split it and create a new paragraph for each element
        if (this.info.includes("\\n")) {
            let infoArray = this.info.split("\\n");
            for (const element of infoArray) {
                let p = document.createElement("p");
                p.textContent = element;
                steckbriefKontakt.appendChild(p);
            }
        } else {
            steckbriefKontakt.textContent = this.info;
        }
        steckbriefInfo.appendChild(steckbriefKontakt);
        steckbriefTop.appendChild(steckbriefInfo);

        let steckbriefBottom = document.createElement("div");
        steckbriefBottom.className = "steckbriefBottom";

        // if "\\n" in this.data, split it and create a new paragraph for each element
        if (this.data.includes("\\n")) {
            let dataArray = this.data.split("\\n");
            for (const element of dataArray) {
                let steckbriefData = document.createElement("p");
                steckbriefData.className = "steckbriefData";
                steckbriefData.textContent = element;
                steckbriefBottom.appendChild(steckbriefData);
            }
        } else {
            let steckbriefData = document.createElement("p");
            steckbriefData.className = "steckbriefData";
            steckbriefData.textContent = this.data;
            steckbriefBottom.appendChild(steckbriefData);
        }
        
        steckbrief.appendChild(steckbriefTop);
        steckbrief.appendChild(steckbriefBottom);

        return steckbrief;
    }
}

class Game {
    constructor(link) {
        this.link = link;
    }
    
    generateHTML() {
        notification();
        let div = document.createElement("div");
        div.id = "gameDiv";
        let frameHTML = document.createElement("iframe");
        frameHTML.id = "frame";
        let closeGame = document.createElement("button");
        closeGame.id = "closegame";
        closeGame.className = "button";
        closeGame.title = "Spiel schließen";
        closeGame.textContent = "X";
        closeGame.onclick = function() {
            document.getElementById("info").innerHTML = "";
        };
        frameHTML.src = this.link;
        div.appendChild(closeGame);
        div.appendChild(frameHTML);
        return div;
    }
}

function notification() {
    let notification = document.getElementById("switchtooverview");
    notification.style.animation = "notification 1s infinite";
}