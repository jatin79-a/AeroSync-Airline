-- ==========================================
-- AIRLINE RESERVATION SYSTEM - MYSQL SCRIPT
-- ==========================================

CREATE DATABASE IF NOT EXISTS airline_reservation;
USE airline_reservation;

-- ==========================================
-- 1. TABLE CREATIONS (DDL)
-- ==========================================

CREATE TABLE Countries (
    country_code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    currency_name VARCHAR(20) NOT NULL
);

CREATE TABLE Cities (
    city_id INT PRIMARY KEY AUTO_INCREMENT,
    city_name VARCHAR(50) NOT NULL,
    country_code VARCHAR(3),
    airport_code VARCHAR(3) UNIQUE NOT NULL,
    airport_tax DECIMAL(10,4) NOT NULL,
    FOREIGN KEY (country_code) REFERENCES Countries(country_code)
);

CREATE TABLE Airlines (
    airline_code VARCHAR(5) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    country_code VARCHAR(3),
    FOREIGN KEY (country_code) REFERENCES Countries(country_code)
);

CREATE TABLE Customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    street VARCHAR(100),
    city VARCHAR(50),
    province VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50)
);

CREATE TABLE Customer_Phones (
    customer_id INT,
    country_code VARCHAR(5),
    area_code VARCHAR(5),
    local_number VARCHAR(15),
    PRIMARY KEY (customer_id, country_code, area_code, local_number),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE Customer_Faxes (
    customer_id INT,
    country_code VARCHAR(5),
    area_code VARCHAR(5),
    local_number VARCHAR(15),
    PRIMARY KEY (customer_id, country_code, area_code, local_number),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE Customer_Emails (
    customer_id INT,
    email VARCHAR(100) UNIQUE,
    PRIMARY KEY (customer_id, email),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE Exchange_Rates (
    from_currency VARCHAR(20),
    to_currency VARCHAR(20),
    rate DECIMAL(10,4) NOT NULL,
    PRIMARY KEY (from_currency, to_currency)
);

CREATE TABLE Flights (
    flight_no VARCHAR(10) PRIMARY KEY,
    airline_code VARCHAR(5),
    business_class_indicator BOOLEAN DEFAULT TRUE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (airline_code) REFERENCES Airlines(airline_code)
);

CREATE TABLE Flight_Availabilities (
    flight_no VARCHAR(10),
    dep_time DATETIME,
    arr_time DATETIME,
    origin_city_id INT,
    dest_city_id INT,
    total_business INT DEFAULT 0,
    booked_business INT DEFAULT 0,
    total_economy INT DEFAULT 0,
    booked_economy INT DEFAULT 0,
    base_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (flight_no, dep_time),
    FOREIGN KEY (flight_no) REFERENCES Flights(flight_no),
    FOREIGN KEY (origin_city_id) REFERENCES Cities(city_id),
    FOREIGN KEY (dest_city_id) REFERENCES Cities(city_id)
);

CREATE TABLE Bookings (
    booking_no INT PRIMARY KEY AUTO_INCREMENT,
    booking_city_id INT,
    booking_date DATE,
    flight_no VARCHAR(10),
    dep_time DATETIME,
    class ENUM('Business', 'Economy'),
    total_price DECIMAL(10,2),
    flight_price DECIMAL(10,2),
    status ENUM('Booked', 'Canceled', 'Scratched') DEFAULT 'Booked',
    payer_customer_id INT,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    ticket_first_name VARCHAR(50),
    ticket_last_name VARCHAR(50),
    FOREIGN KEY (booking_city_id) REFERENCES Cities(city_id),
    FOREIGN KEY (flight_no, dep_time) REFERENCES Flight_Availabilities(flight_no, dep_time),
    FOREIGN KEY (payer_customer_id) REFERENCES Customers(customer_id)
);

-- ==========================================
-- 10 REQUIRED QUERIES
-- ==========================================

-- Q1. Give all the customers who lives in Canada and sort by customer_id.
SELECT * 
FROM Customers 
WHERE country = 'Canada' 
ORDER BY customer_id;

-- Q2. List all different customers who made bookings.
SELECT DISTINCT c.* 
FROM Customers c
JOIN Bookings b ON c.customer_id = b.payer_customer_id;

-- Q3. Display all currency exchange rate is greater than 1. Please sort them by from_currency and to_currency.
SELECT * 
FROM Exchange_Rates 
WHERE rate > 1 
ORDER BY from_currency, to_currency;

-- Q4. List all the flight availabilities between Toronto (airport code is 'YYZ') and New York (airport code is 'JFK'). 
-- Please display flight_no, origin, destination, depature_time, and arrival_time.Please sort them by flight_no.
SELECT 
    fa.flight_no, 
    c1.city_name AS origin, 
    c2.city_name AS destination, 
    fa.dep_time AS depature_time, 
    fa.arr_time AS arrival_time
FROM Flight_Availabilities fa
JOIN Cities c1 ON fa.origin_city_id = c1.city_id
JOIN Cities c2 ON fa.dest_city_id = c2.city_id
WHERE c1.airport_code = 'YYZ' AND c2.airport_code = 'JFK'
ORDER BY fa.flight_no;

-- Q5. List all customers who did not place any booking. Please display customer_id only,and sort records by customer_id.
SELECT c.customer_id 
FROM Customers c 
LEFT JOIN Bookings b ON c.customer_id = b.payer_customer_id 
WHERE b.booking_no IS NULL 
ORDER BY c.customer_id;

-- Q6. Display all customer's first_name, last_name, phone_no (format like 416-111- 2222)and email. Please sort them by customer_id.
SELECT 
    c.customer_id,
    c.first_name, 
    c.last_name, 
    CONCAT(cp.area_code, '-', SUBSTRING(cp.local_number, 1, 3), '-', SUBSTRING(cp.local_number, 4)) AS phone_no, 
    ce.email
FROM Customers c
LEFT JOIN Customer_Phones cp ON c.customer_id = cp.customer_id
LEFT JOIN Customer_Emails ce ON c.customer_id = ce.customer_id
ORDER BY c.customer_id;

-- Q7. List all canceled bookngs. please display booking_no, customer_id, flight_no, origin, destination, class, status, and booking_city. 
-- Please also sort by booking_no,customer_id and flight_no.
SELECT 
    b.booking_no, 
    b.payer_customer_id AS customer_id, 
    b.flight_no, 
    orig.city_name AS origin, 
    dest.city_name AS destination, 
    b.class, 
    b.status, 
    bc.city_name AS booking_city
FROM Bookings b
JOIN Flight_Availabilities fa ON b.flight_no = fa.flight_no AND b.dep_time = fa.dep_time
JOIN Cities orig ON fa.origin_city_id = orig.city_id
JOIN Cities dest ON fa.dest_city_id = dest.city_id
JOIN Cities bc ON b.booking_city_id = bc.city_id
WHERE b.status = 'Canceled'
ORDER BY b.booking_no, b.payer_customer_id, b.flight_no;

-- Q8. List total_price, total_payment and total_balance for each city. Please exclude canceled bookings and sort records by city_name.
-- Note: 'each city' means 'booking_city' in this context
SELECT 
    c.city_name,
    SUM(b.total_price) AS total_price, 
    SUM(b.amount_paid) AS total_payment, 
    SUM(b.outstanding_balance) AS total_balance
FROM Bookings b
JOIN Cities c ON b.booking_city_id = c.city_id
WHERE b.status != 'Canceled'
GROUP BY c.city_name
ORDER BY c.city_name;

-- Q9. Calculate new total_price for each booking if origin airport tax increase by 0.01 anddestination airport tax decrease by 0.005. 
-- Please display booking_no, origin, destination, flight_price, previous_total_price and new_total_price.
SELECT 
    b.booking_no,
    orig.city_name AS origin,
    dest.city_name AS destination,
    b.flight_price,
    b.total_price AS previous_total_price,
    (b.flight_price + (orig.airport_tax + 0.01) + (dest.airport_tax - 0.005)) AS new_total_price
FROM Bookings b
JOIN Flight_Availabilities fa ON b.flight_no = fa.flight_no AND b.dep_time = fa.dep_time
JOIN Cities orig ON fa.origin_city_id = orig.city_id
JOIN Cities dest ON fa.dest_city_id = dest.city_id;

-- Q10. List number_of_bookings, number_of_emails, number_of_phones and number_of_faxs for each customer.
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(DISTINCT b.booking_no) AS number_of_bookings,
    COUNT(DISTINCT ce.email) AS number_of_emails,
    COUNT(DISTINCT cp.local_number) AS number_of_phones,
    COUNT(DISTINCT cf.local_number) AS number_of_faxs
FROM Customers c
LEFT JOIN Bookings b ON c.customer_id = b.payer_customer_id
LEFT JOIN Customer_Emails ce ON c.customer_id = ce.customer_id
LEFT JOIN Customer_Phones cp ON c.customer_id = cp.customer_id
LEFT JOIN Customer_Faxes cf ON c.customer_id = cf.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name;
