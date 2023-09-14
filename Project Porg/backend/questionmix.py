import chatgpt
import openai
import os
from dotenv import load_dotenv

fragen = [
    "Wie groß sind Giraffen?",
    "Elefanten?",
    "Warum haben Elefanten große Ohren?",
    "Wie viele Zähne hat ein erwachsener Mensch?",
    "Wie viele Zähne hat ein Kind?",
    "Welche Farbe haben die Augen von Neugeborenen?",
    "Welche Augenfarbe haben die meisten Erwachsenen?",
    "Welche Augenfarbe ist am seltensten?",
    "Welche Farbe hat der Himmel tagsüber?",
    "Und nachts?",
    "Was ist der Hauptbestandteil der Erdatmosphäre?",
    "Wie hoch ist die durchschnittliche Temperatur auf der Erde?",
    "Wie hoch ist die höchste jemals gemessene Temperatur auf der Erde?",
    "Und die niedrigste?",
    "Wie viele Kontinente gibt es auf der Erde?",
    "Wie viele Länder gibt es in Europa?",
    "Welches Land ist das größte in Südamerika?",
    "Welches Land grenzt an die meisten anderen Länder?",
    "Welches ist das kleinste Land der Welt?",
    "Wie viele Sterne gibt es in unserer Milchstraße?",
    "Wie viele Monde hat der Planet Mars?",
    "Wie lange dauert eine Umdrehung der Erde um ihre Achse?",
    "Und eine Umrundung der Sonne?",
    "Was ist die Geschwindigkeit des Lichts?",
    "Welches ist das schnellste Tier auf der Erde?",
    "Wie schnell kann ein Gepard laufen?",
    "Wie schnell kann ein Wanderfalke stoßen?",
    "Wie tief ist der Marianengraben im Pazifischen Ozean?",
    "Wie tief ist der Atlantische Ozean an seiner tiefsten Stelle?",
    "Wie tief ist der Lake Baikal in Sibirien?",
    "Was ist der längste Fluss der Welt?",
    "Welcher ist der kälteste bewohnte Ort auf der Erde?",
    "Und welcher der heißeste?",
    "Wie hoch ist der höchste Berg der Welt?",
    "Wie hoch ist der Mount Everest?",
    "Wie tief ist die Arktis-Eiskappe im Durchschnitt?",
    "Wie tief ist die Antarktis-Eiskappe im Durchschnitt?",
    "Was ist die größte Wüste der Welt?",
    "Welcher Planet ist der Sonne am nächsten?",
    "Und welcher am weitesten entfernt?",
    "Wie viele Monde hat der Jupiter?",
    "Wie viele Ringe hat der Saturn?",
    "Wie viele Jahre dauert ein Neptun-Jahr?",
    "Was ist das größte bekannte Sternbild?",
    "Und das kleinste?"
]

last = ""


load_dotenv()
openai.api_key = f"{os.getenv('OPENAI_API_KEY')}" + f"{os.getenv('OPENAI_API_KEY_2')}"
chatbot = chatgpt.ChatGPT("test")

for frage in fragen:
    chatbot.system("")
    res = chatbot.chat(f"Wenn die neue Frage keine vollständige Frage ist, schaue, ob es eine Ergänzung der alten Frage ist. Wenn ja, fasse diese zusammen und gebe die Frage zurück. Ansonsten gib mir die neue Frage unverändert zurück! Schreibe nichts anderes als die Frage!\n\nAlte Frage: {last}\nNeue Frage: {frage}", replace_last=True)
    last = res
    print(last)