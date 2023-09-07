import openai
import pinecone
import sys
import os
import pandas

pinecone.init(api_key=os.getenv("PINECONE_API_KEY") or "", environment=os.getenv("PINECONE_ENV") or "")

pinecone_index = pinecone.Index("projectporg")

def readCSV(path):
    df = pandas.read_csv(path, encoding="utf-8", sep=";", names=["text", "link"])
    return df

def embedding(df):
    texts = []
    metadata = []
    for _, row in df.iterrows():
        texts.append(row.text)
        metadata.append({"text": row.text, "link": row.link})
    res = openai.Embedding.create(input=texts, engine="text-embedding-ada-002")
    embeddings = [vec["embedding"] for vec in res["data"]]
    return embeddings, metadata

def upsert(df):
    embeds, meta = embedding(df)
    try:
        pinecone_index.upsert(vectors=[{"id": str(n), "values": vec, "metadata": meta[n]} for n, vec in enumerate(embeds)])
        print("Upsert successful")
    except Exception as e:
        print("Upsert failed")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    df = readCSV("DataSet.csv")
    upsert(df)