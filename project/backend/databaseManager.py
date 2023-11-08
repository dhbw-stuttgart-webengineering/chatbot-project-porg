import sqlite3
import os

def create_connection():
    path = os.path.dirname(os.path.abspath(__file__))
    db_file = path + "/database.db"
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except sqlite3.Error as e:
        print(e)
    return conn

def add_key(uuid, message=None, trial=False):
    conn = create_connection()
    getData = f"""SELECT * FROM [Daten] WHERE [UUID] = '{uuid}';"""
    cur = conn.cursor()
    cur.execute(getData)
    data = cur.fetchall()
    if message == None: message = data[0][1]
    if trial == False:
        trial = data[0][2]
    elif trial == None:
        trial = 0
    else:
        trial = int(data[0][2]) + 1
    sql = "INSERT INTO [Daten] ([UUID], [Messages], [Trial]) VALUES (?, ?, ?);"
    values = (uuid, str(message), trial)
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

def get_trial(uuid):
    conn = create_connection()
    sql = f"""SELECT * FROM [Daten] WHERE [UUID] = '{uuid}';"""
    cur = conn.cursor()
    cur.execute(sql)
    data = cur.fetchall()
    if len(data) == 0:
        return None
    return int(data[0][2])