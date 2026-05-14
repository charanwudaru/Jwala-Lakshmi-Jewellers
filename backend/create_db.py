import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_db():
    try:
        conn = psycopg2.connect(user="postgres", password="Admin@2003", host="localhost", port="5432", database="postgres")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute('CREATE DATABASE jewelbridge')
        cur.close()
        conn.close()
        print("Database 'jewelbridge' created successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_db()
