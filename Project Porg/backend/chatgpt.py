import openai

class ChatGPT:

    def __init__(self, uuid, model="gpt-3.5-turbo-16k"):
        self.model = model
        self.history = []
        self._messages = []
        self.lastQuestion = ""
        self.uuid = uuid

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
            temperature=0.2
        )
        self.history.append((messages, completion))
        return completion
    
    def call(self):
        completion = self._make_completion(self.messages)
        return completion["choices"][0]["message"]["content"].strip()
    
    def chat(self, message, replace_last=False):
        if replace_last:
            self._messages = self._messages[:-2]
        self.user(message)
        response = self.call()
        self.assistant(response)
        self.removeContentFromMessage()
        return response
    
    def getMessages(self):
        return self._messages
    
    def setMessages(self, messages):
        self._messages = messages
        
    def removeContentFromMessage(self):
        indexOfFrage = self._messages[-2]["content"].find("########\n\n")
        self._messages[-2]["content"] = self._messages[-2]["content"][indexOfFrage+10:]