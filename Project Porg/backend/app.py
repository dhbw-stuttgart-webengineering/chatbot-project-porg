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

pinecone_index = pinecone.Index("projectporg")

def embedding(query):
    texts = [query]
    res = openai.Embedding.create(input=texts, engine="text-embedding-ada-002")
    embeddings = [vec["embedding"] for vec in res["data"]]
    metadata = [{"text": query}]
    return embeddings, metadata

def search(query):
    embeds, _ = embedding(query)
    res = pinecone_index.query(vector=embeds, top_k=10, include_metadata=True)
    return res

def chat(chatbot, query, information):
    chatbot.system("""Antworte im Format: <Antwort> Quelle: <Quellen>.
    Du bist ein Chatbot der Dualen Hochschule Baden-Württemberg (DHBW). Dein Name ist Porg. 
    Du kannst nicht über andere Themen reden und beantwortest keine Fragen, die nichts mit der Hochschule zu tun haben.
    Bei Aufzählungen immer \n- verwenden.""")
    context = search(f"{query}\n{information}")
    res = chatbot.chat(f"Erfinde nichts dazu! Benutze für deine Antwort nur diese Daten:\n{context}\nInformationen zum mir:\n{information}########\n\n{query}")
    checkForOldChatbots()
    return res

def getChatbot(uuid):
    if uuid in chatbots:
        chatbots[uuid]["lastUsed"] = datetime.datetime.now()
        return chatbots[uuid]["chatbot"]
    chatbot = chatgpt.ChatGPT(uuid)
    result = databaseManager.get_key(uuid)
    if result == None:
        databaseManager.add_key(uuid, "") 
        result = databaseManager.get_key(uuid)
        messages = eval(result[0][1])
        chatbot.setMessages(messages)
    chatbots[uuid] = {"chatbot": chatbot, "lastUsed": datetime.datetime.now()}
    return chatbot

def checkForOldChatbots():
    delete = []
    for uuid in chatbots:
        print(uuid + ": " + str((datetime.datetime.now() - chatbots[uuid]["lastUsed"]).total_seconds()))
        if (datetime.datetime.now() - chatbots[uuid]["lastUsed"]).total_seconds() > 300:
            delete.append(uuid)
    for uuid in delete:
        print("Deleting chatbot uuid: " + uuid)
        del chatbots[uuid]

from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/chat": {"origins": "*"}, r"/mail": {"origins": "*"}, r"/getData": {"origins": "*"}, r"/reset": {"origins": "*"}})

@app.route("/chat", methods=["POST"])
def chat_api():
    data = request.json
    query = data["query"]
    uuid = data["uuid"]
    information = data["information"]
    result = chat(getChatbot(uuid), query, information)
    chatbot = getChatbot(uuid)
    messages = chatbot.getMessages()
    databaseManager.add_key(uuid, messages)
    response = jsonify({"response": result})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/getData", methods=["POST"])
def getData_api():
    data = request.json
    uuid = data["uuid"]
    result = databaseManager.get_key(uuid)
    chatbot = getChatbot(uuid)
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
    databaseManager.add_key(uuid, "")
    chatbot = getChatbot(uuid)
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