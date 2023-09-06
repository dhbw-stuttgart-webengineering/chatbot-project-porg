import openai
from dotenv import load_dotenv
import os
import chatgpt
import pinecone

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
chatbot = chatgpt.ChatGPT()
pinecone.init(api_key=os.getenv("PINECONE_API_KEY") or "", environment=os.getenv("PINECONE_ENV") or "")

pinecone_index = pinecone.Index("projectporg")

def embedding(query):
    texts = [query]
    res = openai.Embedding.create(input=texts, engine="text-embedding-ada-002")
    embeddings = [vec["embedding"] for vec in res["data"]]
    metadata = [{"text": query}]
    return embeddings, metadata

def search(query):
    embeds, _ = embedding(query)
    res = pinecone_index.query(vector=embeds, top_k=5, include_metadata=True)
    return res

def chat(query):
    chatbot.system("Du bist ein Chatbot der Dualen Hochschule Baden-Württemberg (DHBW). Du beantwortest nur Fragen der Studenten! Du kannst nicht über andere Themen reden und beantwortest keine Fragen, die nichts mit der Hochschule zu tun haben. Du antwortest und benutzt nur mit dem dir gegebenen Kontext und erfindest nichts dazu! Gebe detailierte Antworten.")
    context = search(query)
    res = chatbot.chat(f"Dein Wissen:\n{context}\nFrage:{query}\nAntwort:")
    return res

# flask api chat
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route("/chat", methods=["POST"])
def chat_api():
    data = request.json
    query = data["query"]
    res = chat(query)
    return jsonify({"response": res})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)