import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sender_email = "demirerkagan0808@gmail.com"
receiver_email = "demirerkagan0808@gmail.com"
subject = "Project Porg Report"

def send_mail(text):
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = subject

    msg.attach(MIMEText(text, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, "murnncjssejzwwew")
    text = msg.as_string()
    server.sendmail(sender_email, receiver_email, text)
    server.quit()
    