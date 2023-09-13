import sqlite3
import os

# Create a database connection
def create_connection():
    path = os.path.dirname(os.path.abspath(__file__))
    db_file = path + "/database.db"
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except sqlite3.Error as e:
        print(e)
    return conn

def add_key(uuid, message=None):
    conn = create_connection()
    getData = f"""SELECT * FROM [Daten] WHERE [UUID] = '{uuid}';"""
    cur = conn.cursor()
    cur.execute(getData)
    data = cur.fetchall()
    if message == None: message = data[0][1]
    sql = "INSERT INTO [Daten] ([UUID], [Messages]) VALUES (?, ?);"
    values = (uuid, str(message))
    cur = conn.cursor()
    cur.execute(sql, values)
    conn.commit()

def get_key(uuid):
    conn = create_connection()
    sql = f"""SELECT * FROM [Daten] WHERE [UUID] = '{uuid}';"""
    cur = conn.cursor()
    cur.execute(sql)
    data = cur.fetchall()
    if len(data) == 0:
        return None
    return data