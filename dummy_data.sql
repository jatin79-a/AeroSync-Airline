-- Dummy Data Inserts for Airline Reservation Schema
-- Run this AFTER the DDL schema has been created in your MySQL Database!

USE airline_reservation;

-- Countries
INSERT IGNORE INTO Countries (country_code, name, currency_name) VALUES 
('CAN', 'Canada', 'Canadian Dollar'),
('USA', 'United States', 'US Dollar'),
('GBR', 'United Kingdom', 'British Pound'),
('FRA', 'France', 'Euro'),
('DEU', 'Germany', 'Euro'),
('ITA', 'Italy', 'Euro');

-- Cities
INSERT IGNORE INTO Cities (city_id, city_name, country_code, airport_code, airport_tax) VALUES 
(1, 'Toronto', 'CAN', 'YYZ', 25.50),
(2, 'Montreal', 'CAN', 'YUL', 20.00),
(3, 'New York', 'USA', 'JFK', 35.00),
(4, 'Chicago', 'USA', 'ORD', 30.00),
(5, 'London', 'GBR', 'LHR', 45.00),
(6, 'Paris', 'FRA', 'CDG', 40.00);

-- Airlines
INSERT IGNORE INTO Airlines (airline_code, name, country_code) VALUES 
('AC', 'AirCan', 'CAN'),
('US', 'USAir', 'USA'),
('BA', 'BritAir', 'GBR'),
('AF', 'AirFrance', 'FRA');

-- Customers
INSERT IGNORE INTO Customers (customer_id, first_name, last_name, street, city, province, postal_code, country) VALUES 
(1, 'John', 'Doe', '123 Maple St', 'Toronto', 'ON', 'M5V 2H1', 'Canada'),
(2, 'Jane', 'Smith', '456 Oak Ave', 'New York', 'NY', '10001', 'USA'),
(3, 'Alan', 'Turing', '789 Main St', 'London', 'ENG', 'SW1A 1AA', 'UK');

-- Exchange Rates (Requirement Q3)
INSERT IGNORE INTO Exchange_Rates (from_currency, to_currency, rate) VALUES 
('Canadian Dollar', 'US Dollar', 0.74),
('US Dollar', 'Canadian Dollar', 1.35),
('Euro', 'US Dollar', 1.05),
('British Pound', 'US Dollar', 1.25);

-- Flights
INSERT IGNORE INTO Flights (flight_no, airline_code, business_class_indicator, smoking_allowed) VALUES 
('AC100', 'AC', TRUE, FALSE),
('US200', 'US', TRUE, FALSE),
('BA300', 'BA', TRUE, FALSE);

-- Flight Availabilities (Requirement Q4)
INSERT IGNORE INTO Flight_Availabilities (flight_no, dep_time, arr_time, origin_city_id, dest_city_id, total_business, booked_business, total_economy, booked_economy, base_price) VALUES 
('AC100', '2026-05-15 08:00:00', '2026-05-15 09:30:00', 1, 3, 20, 5, 150, 50, 200.00),
('US200', '2026-05-16 10:00:00', '2026-05-16 12:30:00', 3, 5, 30, 25, 200, 180, 500.00);

-- Bookings (Requirement Q7 Canceled)
INSERT IGNORE INTO Bookings (booking_no, booking_city_id, booking_date, flight_no, dep_time, class, total_price, flight_price, status, payer_customer_id, amount_paid, outstanding_balance) VALUES 
(1, 1, '2026-05-01', 'AC100', '2026-05-15 08:00:00', 'Economy', 260.50, 200.00, 'Booked', 1, 260.50, 0.00),
(2, 3, '2026-05-02', 'US200', '2026-05-16 10:00:00', 'Business', 850.00, 750.00, 'Canceled', 2, 0.00, 0.00);

-- Phones/Emails (Requirement Q10)
INSERT IGNORE INTO Customer_Emails (customer_id, email) VALUES 
(1, 'john.doe@example.com'),
(2, 'jane.smith@example.com');

INSERT IGNORE INTO Customer_Phones (customer_id, country_code, area_code, local_number) VALUES 
(1, '1', '416', '111-2222'),
(2, '1', '212', '555-0198');
