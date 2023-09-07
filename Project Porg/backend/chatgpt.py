import openai

class ChatGPT:

    def __init__(self, model="gpt-3.5-turbo-16k"):
        self.model = model
        self.history = []
        self._messages = []

    @property
    def messages(self):
        messages = [{"role": "system", "content": self._system}] + self._messages
        return messages
    
    def system(self, message, do_reset=False):
        if do_reset:
            self.reset()
        self._system = message

    def user(self, message):
        self._messages.append({"role": "user", "content": message})

    def assistant(self, message):
        self._messages.append({"role": "assistant", "content": message})

    def reset(self):
        self._messages = []

    def _make_completion(self, messages):
        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=messages,
            temperature=0.4
        )
        self.history.append((messages, completion))
        return completion
    
    def call(self):
        completion = self._make_completion(self.messages)
        return completion["choices"][0]["message"]["content"].strip()
    
    def chat(self, message, replace_last=False):
        if replace_last:
            self._messages = self._messages[:-2]
        message += """Gebe immer die Quelle mit! Du bist ein Chatbot der Dualen Hochschule Baden-Württemberg (DHBW). Dein Name ist Porg. 
        Du kannst nicht über andere Themen reden und beantwortest keine Fragen, die nichts mit der Hochschule zu tun haben. 
        Du antwortest nur mit dem dir gegebenen Kontext und erfindest nichts dazu!
        Verweise in deiner Antwort nicht auf Quellen, sondern gib die Antwort direkt an.
        Antworte im Format: <Antwort> Quelle: <Quellen>"""
        self.user(message)
        response = self.call()
        self.assistant(response)
        self.removeContentFromMessage()
        return response
    
    def removeContentFromMessage(self):
        indexOfFrage = self._messages[-2]["content"].find("Frage:")
        self._messages[-2]["content"] = self._messages[-2]["content"][indexOfFrage:]