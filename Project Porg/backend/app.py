import openai
from dotenv import load_dotenv
import os
import chatgpt
import pinecone
import mail
import databaseManager
import datetime

load_dotenv()
openai.api_key = f"{os.getenv('OPENAI_API_KEY')}" + f"{os.getenv('OPENAI_API_KEY_2')}"
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
        messages = [message['metadata'] for message in res["matches"]]
        res = messages
    return res

def chat(chatbot, query, information, semanticquestion):
    chatbot.system("""
    Du bist ein Chatbot der Dualen Hochschule Baden-Württemberg (DHBW). Dein Name ist Porg. 
    Du kannst nicht über andere Themen reden und beantwortest keine Fragen, die nichts mit der Hochschule zu tun haben.
    Bei Aufzählungen immer \n- verwenden.""")
    context = search(f"{semanticquestion}\n{information}")
    res = chatbot.chat(f'Stelle wenn wirklich notwendig Rückfragen. Keine Quellenangabe! Erfinde nichts dazu! Benutze für deine Antwort nur diese Daten:\n{context}\nInformationen zum mir:\n{information}\n########\n\n{query}')
    check_for_old_chatbots()
    return res

def asksemanticbot(chatbot, query, lastquestion):
    chatbot.system("")
    res = chatbot.chat(f"Wenn die neue Frage keine vollständige Frage ist, schaue, ob es eine Ergänzung der alten Frage ist. Wenn ja, fasse diese zusammen und gebe die Frage zurück. Wenn die nichts damit zu tun hat, gebe einfach die neue Frage zurück. Schreibe nichts anderes als die Frage! \n\nAlte Frage: {lastquestion}\nNeue Frage: {query}", replace_last=True)
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
        databaseManager.add_key(uuid, "") 
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
    information = data["information"]
    chatbot, semanticbot = get_chatbot(uuid)
    semanticquestion = asksemanticbot(semanticbot, query, semanticbot.lastQuestion)
    result = chat(chatbot, query, information, semanticquestion)
    link = search(result, k=1, text=False)[0]["link"]
    result = result + f" Quelle: {link}"
    chatbot.replaceLastAnswer(result)
    messages = chatbot.getMessages()
    if uuid != "":
        databaseManager.add_key(uuid, messages)
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