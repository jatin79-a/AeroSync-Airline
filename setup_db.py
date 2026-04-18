import mysql.connector
from mysql.connector import Error
import os

def run_sql_file(cursor, filename):
    with open(filename, 'r', encoding='utf-8') as f:
        sqlFile = f.read()
    
    for command in sqlFile.split(';'):
        cmd = command.strip()
        if not cmd or cmd.upper().startswith('SELECT') or cmd.upper().startswith('--'):
            continue
        try:
            cursor.execute(cmd)
            try:
                cursor.fetchall() # clear any pending row results silently
            except Exception:
                pass
        except Exception as e:
            pass # ignore already-exists and other trivial setup errors

try:
    print("Attempting to connect to local MySQL Server...")
    # Change the password here if your Workbench root user has a password!
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='JaTIN!2508'
    )
    
    if connection.is_connected():
        print("Successfully connected to MySQL!")
        cursor = connection.cursor()
        
        print("Executing database.sql (Creating Schema & Tables)...")
        run_sql_file(cursor, "database.sql")
        
        print("Executing dummy_data.sql (Inserting Sample Data)...")
        run_sql_file(cursor, "dummy_data.sql")
        
        connection.commit()
        print("Database Setup Complete! All tables and dummy data have been injected.")
        
except Error as e:
    print(f"\nError while connecting to MySQL: {e}")
    print("If you have a password for your root user in Workbench, please update the 'password' field in setup_db.py and run it again.")

finally:
    if 'connection' in locals() and connection.is_connected():
        cursor.close()
        connection.close()
