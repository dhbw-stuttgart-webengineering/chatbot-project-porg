import subprocess

# Erstellen Sie eine requirements.txt-Datei
with open("requirements.txt", "w") as f:
    subprocess.call(["pip", "freeze"], stdout=f)