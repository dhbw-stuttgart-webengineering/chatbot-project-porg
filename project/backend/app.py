import openai
import os
import chatgpt
import pinecone
import mail
import databaseManager
import datetime
from dotenv import load_dotenv

load_dotenv()
pinecone.init(api_key=os.getenv("PINECONE_API_KEY") or "", environment=os.getenv("PINECONE_ENV") or "")

chatbots = {}

pinecone_index = pinecone.Index(os.getenv("PINECONE_INDEX") or "")

def embedding(query):
    texts = [query]
    res = openai.Embedding.create(input=texts, engine="text-embedding-ada-002")
    embeddings = [vec["embedding"] for vec in res["data"]]
    metadata = [{"text": query}]
    return embeddings, metadata

def search(query, k=7, text=True):
    embeds, _ = embedding(query)
    res = pinecone_index.query(vector=embeds, top_k=k, include_metadata=True)
    if text: 
        messages = [f"{i+1}. {message['metadata']['text']}. Quelle: {message['metadata']['link']}\n" for i, message in enumerate(res["matches"])]
        res = "".join(messages)
    else:
        score = res["matches"][0]["score"]
        if float(score) < 0.88:
            return None
        messages = res["matches"][0]["metadata"]
        res = messages
    return res

def chat(chatbot, query, information, semanticquestion, openai_api_key):
    chatbot.system("""
    Du bist ein Chatbot der Dualen Hochschule Baden-Württemberg (DHBW). Dein Name ist Porg. 
    Du kannst nicht über andere Themen reden und beantwortest keine Fragen, die nichts mit der Hochschule zu tun haben.
    Keine Quellenangabe!
    Bei Aufzählungen immer \n- verwenden.   """)
    context = search(f"{semanticquestion}\n{information}")
    res = chatbot.chat(f'Keine Quellenangabe! Stelle wenn wirklich notwendig Rückfragen. Erfinde nichts dazu! Benutze für deine Antwort nur diese Daten:\n{context}\nInformationen zum mir:\n{information}\n########\n\n{query}', openai_api_key=openai_api_key)
    check_for_old_chatbots()
    return res

def asksemanticbot(chatbot, query, lastquestion, openai_api_key):
    chatbot.system("")
    res = chatbot.chat(f"Wenn die neue Frage keine vollständige Frage ist, schaue, ob es eine Ergänzung der alten Frage ist. Wenn ja, fasse diese zusammen und gebe die Frage zurück. Wenn die nichts damit zu tun hat, gebe einfach die neue Frage zurück. Schreibe nichts anderes als die Frage! \n\nAlte Frage: {lastquestion}\nNeue Frage: {query}", replace_last=True, openai_api_key=openai_api_key)
    chatbot.lastQuestion = res
    return res

def get_chatbot(uuid):
    if uuid in chatbots:
        chatbots[uuid]["chatbot"]["lastUsed"] = datetime.datetime.now()
        return chatbots[uuid]["chatbot"]["chatbot"], chatbots[uuid]["semanticbot"]
    chatbot = chatgpt.ChatGPT(uuid)
    semanticbot = chatgpt.ChatGPT(uuid + "semantic")
    result = databaseManager.get_key(uuid)
    if result == None:
        databaseManager.add_key(uuid, "", None)
        result = databaseManager.get_key(uuid)
        if result[0][1] == None:
            messages = eval(result[0][1])
            chatbot.setMessages(messages)
    chatbots[uuid] = {}
    chatbots[uuid]["chatbot"] = {"chatbot": chatbot, "lastUsed": datetime.datetime.now()}
    chatbots[uuid]["semanticbot"] = semanticbot
    return chatbot, semanticbot

def check_for_old_chatbots():
    delete = []
    for uuid in chatbots:
        print(uuid + ": " + str((datetime.datetime.now() - chatbots[uuid]["chatbot"]["lastUsed"]).total_seconds()))
        if (datetime.datetime.now() - chatbots[uuid]["chatbot"]["lastUsed"]).total_seconds() > 60:
            delete.append(uuid)
    for uuid in delete:
        print("Deleting chatbot uuid: " + uuid)
        del chatbots[uuid]

from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/chat": {"origins": "*"}, r"/mail": {"origins": "*"}, r"/getData": {"origins": "*"}, r"/reset": {"origins": "*"}, r"/semantic": {"origins": "*"}})

@app.route("/chat", methods=["POST"])
def chat_api():
    data = request.json
    query = data["query"]
    uuid = data["uuid"]
    openai_api_key = data["openai_api_key"]
    information = data["information"]
    if openai_api_key.strip() == "":
        openai_api_key = f"{os.getenv('OPENAI_API_KEY')}" + f"{os.getenv('OPENAI_API_KEY_2')}"
        trial_count = databaseManager.get_trial(uuid)
        if trial_count >= 3:
            return jsonify({"response": "Du hast dein Kontingent an Anfragen für die gratis Version erreicht. Bitte trage im Einstellungsfenster einen OpenAI API Key ein, um weiterhin den Chatbot zu nutzen. Eine Anleitung findest du hier: https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/. "})
        trial = True
    else:
        trial = False
    print(openai.api_key)
    chatbot, semanticbot = get_chatbot(uuid)
    try:
        semanticquestion = asksemanticbot(semanticbot, query, semanticbot.lastQuestion, openai_api_key)
        result = chat(chatbot, query, information, semanticquestion, openai_api_key)
    except openai.error.AuthenticationError:
        return jsonify({"response": "Der OpenAI API Key ist ungültig. Bitte überprüfe ihn und versuche es erneut."})
    except openai.error.ServiceUnavailableError:
        return jsonify({"response": "Der OpenAI Server ist nicht erreichbar. Bitte versuche es später erneut."})
    except:
        chatbot._messages = chatbot._messages[:-1]
        return jsonify({"response": "Es ist ein Fehler aufgetreten. Bitte versuche es erneut."})
    link = search(result, k=1, text=False)
    if link != None:
        link = link["link"]
        result = result + f" Quelle: {link}"
        chatbot.replaceLastAnswer(result)
    messages = chatbot.getMessages()
    if uuid != "":
        databaseManager.add_key(uuid, messages, trial)
    response = jsonify({"response": result})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/getData", methods=["POST"])
def get_data_api():
    data = request.json
    uuid = data["uuid"]
    if uuid == "":
        return jsonify({"response": "No uuid given"})
    result = databaseManager.get_key(uuid)
    chatbot = get_chatbot(uuid)[0]
    if result == None:
        databaseManager.add_key(uuid, "")
        result = databaseManager.get_key(uuid)
    if result[0][1].strip() != "":
        messages = eval(result[0][1])
        chatbot.setMessages(messages)
    if result == None:
        response = jsonify({"response": "No data found"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    response = jsonify({"response": result})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/reset", methods=["POST"])
def reset_api():
    data = request.json
    uuid = data["uuid"]
    if uuid == "":
        return jsonify({"response": "No uuid given"})
    databaseManager.add_key(uuid, "")
    chatbot = get_chatbot(uuid)[0]
    chatbot.reset()
    response = jsonify({"response": "success"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/mail", methods=["POST"])
def mail_api():
    data = request.json
    query = data["query"]
    mail.send_mail(query)
    response = jsonify({"response": "success"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 8080)),host='0.0.0.0',debug=True)