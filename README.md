# AeroSync - Airline Reservation System (B.Tech Case Study)

This is a complete full-stack web application designed for a Database Technology (DBMS) Case Study. It features a modern, responsive, light-themed premium dashboard. 

## Features
- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript (Chart.js for analytics)
- **Backend**: Python 3, Flask framework
- **Database**: MySQL Server
- Includes live KPIs, Dashboard graphics, and all 10 SQL required queries processed on the backend.

## Setup Instructions for Viva Presentation

### 1. Database Setup
1. Open XAMPP / WAMP and Start **MySQL**.
2. Open phpMyAdmin (or MySQL Workbench).
3. First, run the `database.sql` script to create the schema `airline_reservation` and all the tables.
4. Second, run the `dummy_data.sql` script in the same database to insert mock customers, flights, and bookings so the dashboard shows real numbers!

### 2. Backend Setup
1. Make sure Python is installed.
2. Open terminal in this project folder (`Airline-Assignment`).
3. Install reqs:
   ```bash
   pip install flask mysql-connector-python
   ```
4. Double check `app.py` line 12 where the database connection is. Make sure the `user` and `password` match your local MySQL configuration (Default for XAMPP is `user='root'` and `password='`').

### 3. Run the Application
1. Start the Flask server:
   ```bash
   python app.py
   ```
2. Open your browser and navigate to: `http://localhost:8000`
3. Click "Login to Dashboard" and begin your presentation!

Good luck with your B.Tech Viva!
