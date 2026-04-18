import mysql.connector
import random

def generate():
    print("Generating massive dummy data...")
    try:
        conn = mysql.connector.connect(host='localhost', user='root', password='JaTIN!2508', database='airline_reservation')
        cursor = conn.cursor()
        
        first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"]
        cities = [("Toronto", "ON", "Canada"), ("Montreal", "QC", "Canada"), ("New York", "NY", "USA"), ("Chicago", "IL", "USA"), ("London", "ENG", "UK"), ("Paris", "IDF", "France"), ("Berlin", "BE", "Germany"), ("Rome", "LAZ", "Italy"), ("Madrid", "MD", "Spain"), ("Delhi", "ND", "India")]
        
        # Generate 100 random customers
        for i in range(4, 105): # IDs 4 to 104
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            city, prov, country = random.choice(cities)
            pc = f"{random.randint(100, 999)} {random.randint(100, 999)}"
            
            cursor.execute(f"INSERT IGNORE INTO Customers (customer_id, first_name, last_name, street, city, province, postal_code, country) VALUES ({i}, '{fn}', '{ln}', '{random.randint(1, 999)} Random St', '{city}', '{prov}', '{pc}', '{country}')")
            
            # Give them an email
            cursor.execute(f"INSERT IGNORE INTO Customer_Emails (customer_id, email) VALUES ({i}, '{fn.lower()}.{ln.lower()}{i}@example.com')")
            
            # Sometimes give a phone number
            if random.random() > 0.3:
                cursor.execute(f"INSERT IGNORE INTO Customer_Phones (customer_id, country_code, area_code, local_number) VALUES ({i}, '1', '{random.randint(200, 999)}', '{random.randint(111, 999)}-{random.randint(1111, 9999)}')")

        # Generate 200 random bookings
        flights = [('AC100', '2026-05-15 08:00:00', 1), ('US200', '2026-05-16 10:00:00', 3), ('BA300', '2026-06-01 12:00:00', 5)] 
        
        # Add BA300 flight availability so the foreign key succeeds
        cursor.execute("INSERT IGNORE INTO Flight_Availabilities (flight_no, dep_time, arr_time, origin_city_id, dest_city_id, total_business, booked_business, total_economy, booked_economy, base_price) VALUES ('BA300', '2026-06-01 12:00:00', '2026-06-01 14:00:00', 5, 6, 40, 10, 200, 150, 450.00)")
        
        status = ['Booked', 'Booked', 'Booked', 'Booked', 'Canceled', 'Canceled']
        cl = ['Economy', 'Economy', 'Economy', 'Business']
        
        for i in range(3, 203):
            cid = random.randint(1, 104)
            flight, dep, orig_city = random.choice(flights)
            stat = random.choice(status)
            c = random.choice(cl)
            price = random.uniform(200.0, 900.0)
            flight_price = price - random.uniform(30.0, 80.0)
            amount_paid = price if stat != 'Canceled' else 0.0
            
            cursor.execute(f"INSERT IGNORE INTO Bookings (booking_no, booking_city_id, booking_date, flight_no, dep_time, class, total_price, flight_price, status, payer_customer_id, amount_paid, outstanding_balance) VALUES ({i}, {orig_city}, '2026-04-10', '{flight}', '{dep}', '{c}', {price}, {flight_price}, '{stat}', {cid}, {amount_paid}, 0.0)")

        conn.commit()
        print("Success! Inserted hundreds of fake records.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to generate: {e}")

if __name__ == '__main__':
    generate()
