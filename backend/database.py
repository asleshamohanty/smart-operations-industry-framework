from supabase import create_client, Client
import os
from dotenv import load_dotenv
import sqlite3
import json
from typing import Dict, Any, List

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check if Supabase credentials are available
USE_SUPABASE = all([SUPABASE_URL, SUPABASE_KEY])

if USE_SUPABASE:
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Using Supabase database")
else:
    print("Supabase credentials not found, using local SQLite database")
    # Initialize SQLite database
    DB_PATH = "smart_ops.db"
    
    def init_sqlite_db():
        """Initialize SQLite database with required tables"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create projects table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER UNIQUE NOT NULL,
                project_name TEXT NOT NULL,
                location TEXT NOT NULL,
                project_budget REAL NOT NULL,
                project_type TEXT,
                description TEXT,
                raw_materials TEXT,
                estimated_duration_days INTEGER,
                team_size INTEGER,
                environmental_goals TEXT,
                social_goals TEXT,
                governance_goals TEXT,
                created_at TEXT
            )
        ''')
        
        # Create materials table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                import_location TEXT NOT NULL,
                project_id INTEGER NOT NULL,
                created_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
        ''')
        
        # Create tasks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER UNIQUE NOT NULL,
                task_name TEXT NOT NULL,
                planned_start_date TEXT,
                planned_end_date TEXT,
                duration_days INTEGER,
                labor_count INTEGER,
                labor_cost_per_day REAL,
                equipment_cost_per_day REAL,
                material TEXT,
                material_quantity REAL,
                material_unit_cost REAL,
                planned_task_cost REAL,
                e_score REAL,
                s_score REAL,
                g_score REAL,
                carbon_footprint_kg REAL,
                water_usage_m3 REAL,
                energy_usage_kwh REAL,
                sdg_alignment_score REAL,
                predicted_delay_days INTEGER,
                predicted_task_cost REAL,
                predicted_esg_score REAL,
                profit_impact REAL,
                project_id INTEGER,
                created_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("SQLite database initialized")
    
    # Initialize database
    init_sqlite_db()

class SQLiteClient:
    """SQLite client that mimics Supabase client interface"""
    
    def __init__(self):
        self.db_path = DB_PATH
    
    def table(self, table_name: str):
        return SQLiteTable(table_name, self.db_path)

class SQLiteTable:
    """SQLite table that mimics Supabase table interface"""
    
    def __init__(self, table_name: str, db_path: str):
        self.table_name = table_name
        self.db_path = db_path
        self._select_fields = "*"
        self._where_conditions = []
        self._insert_data = None
        self._update_data = None
        self._delete_flag = False
    
    def select(self, fields: str = "*"):
        self._select_fields = fields
        return self
    
    def eq(self, column: str, value: Any):
        self._where_conditions.append((column, "=", value))
        return self
    
    def insert(self, data: Dict[str, Any]):
        self._insert_data = data
        return self
    
    def update(self, data: Dict[str, Any]):
        self._update_data = data
        return self
    
    def delete(self):
        self._delete_flag = True
        return self
    
    def execute(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            if self._insert_data:
                # Insert operation
                columns = list(self._insert_data.keys())
                values = list(self._insert_data.values())
                placeholders = ", ".join(["?" for _ in values])
                
                query = f"INSERT INTO {self.table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                cursor.execute(query, values)
                conn.commit()
                
                # Return the inserted data
                last_id = cursor.lastrowid
                cursor.execute(f"SELECT * FROM {self.table_name} WHERE id = ?", (last_id,))
                result = cursor.fetchone()
                
                if result:
                    columns = [description[0] for description in cursor.description]
                    data_dict = dict(zip(columns, result))
                    return MockResult([data_dict])
                else:
                    return MockResult([])
                
            elif self._update_data:
                # Update operation
                set_clause = ", ".join([f"{k} = ?" for k in self._update_data.keys()])
                where_clause = " AND ".join([f"{col} = ?" for col, op, val in self._where_conditions])
                
                query = f"UPDATE {self.table_name} SET {set_clause}"
                if where_clause:
                    query += f" WHERE {where_clause}"
                
                values = list(self._update_data.values()) + [val for col, op, val in self._where_conditions]
                cursor.execute(query, values)
                conn.commit()
                
                # Return updated data
                if self._where_conditions:
                    where_clause = " AND ".join([f"{col} = ?" for col, op, val in self._where_conditions])
                    cursor.execute(f"SELECT * FROM {self.table_name} WHERE {where_clause}", 
                                 [val for col, op, val in self._where_conditions])
                    result = cursor.fetchone()
                    
                    if result:
                        columns = [description[0] for description in cursor.description]
                        data_dict = dict(zip(columns, result))
                        return MockResult([data_dict])
                
            elif self._delete_flag:
                # Delete operation
                where_clause = " AND ".join([f"{col} = ?" for col, op, val in self._where_conditions])
                
                query = f"DELETE FROM {self.table_name}"
                if where_clause:
                    query += f" WHERE {where_clause}"
                
                values = [val for col, op, val in self._where_conditions]
                cursor.execute(query, values)
                conn.commit()
                
                return MockResult([{"deleted": True}])
            
            else:
                # Select operation
                where_clause = " AND ".join([f"{col} = ?" for col, op, val in self._where_conditions])
                
                query = f"SELECT {self._select_fields} FROM {self.table_name}"
                if where_clause:
                    query += f" WHERE {where_clause}"
                
                values = [val for col, op, val in self._where_conditions]
                cursor.execute(query, values)
                results = cursor.fetchall()
                
                if results:
                    columns = [description[0] for description in cursor.description]
                    data_list = [dict(zip(columns, row)) for row in results]
                    return MockResult(data_list)
                else:
                    return MockResult([])
        
        except Exception as e:
            print(f"SQLite error: {e}")
            return MockResult([])
        finally:
            conn.close()
        
        return MockResult([])

class MockResult:
    """Mock result object that mimics Supabase result"""
    
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data

# Database helper functions
def get_supabase():
    """Get Supabase client"""
    if USE_SUPABASE:
        return supabase
    else:
        return SQLiteClient()

# For compatibility with existing code
def get_db():
    """Get database client (Supabase or SQLite)"""
    if USE_SUPABASE:
        return supabase
    else:
        return SQLiteClient()

def get_supabase_client():
    """Get Supabase client specifically"""
    if USE_SUPABASE:
        return supabase
    else:
        return None