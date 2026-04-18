"""
AeroSync — Airline Reservation System Backend
Flask + MySQL Full-Stack Application
B.Tech Database Technology Case Study
"""

from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
import mysql.connector
from mysql.connector import Error
import math
import os

app = Flask(__name__)
app.secret_key = 'aerosync_super_secret_2026'

# ── Database Config ───────────────────────────────────────────
# Reads from environment variables (set in Railway dashboard).
# Falls back to local dev values if env vars are not set.
DB_CONFIG = {
    'host':     os.environ.get('MYSQLHOST',     'localhost'),
    'port':     int(os.environ.get('MYSQLPORT', 3306)),
    'user':     os.environ.get('MYSQLUSER',     'root'),
    'password': os.environ.get('MYSQLPASSWORD', 'JaTIN!2508'),
    'database': os.environ.get('MYSQLDATABASE', 'airline_reservation'),
    'autocommit': True,
}

def get_db():
    """Return a fresh MySQL connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"[DB ERROR] {e}")
        return None

def query_db(sql, params=(), one=False):
    """Execute a SELECT and return rows as dicts."""
    conn = get_db()
    if not conn:
        return [] if not one else None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, params)
        result = cursor.fetchone() if one else cursor.fetchall()
        return result
    except Error as e:
        print(f"[QUERY ERROR] {e}")
        return None if one else []
    finally:
        cursor.close()
        conn.close()

# ── Auth ─────────────────────────────────────────────────────
@app.route('/', methods=['GET'])
def home():
    stats = {
        'customers': query_db("SELECT COUNT(*) AS c FROM Customers", one=True)['c'],
        'bookings':  query_db("SELECT COUNT(*) AS c FROM Bookings",  one=True)['c'],
    }
    return render_template('home.html', stats=stats)

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def do_login():
    flash('Logged in successfully!', 'success')
    return redirect(url_for('dashboard'))

# ── Dashboard ────────────────────────────────────────────────
@app.route('/dashboard')
def dashboard():
    conn = get_db()
    if not conn:
        return render_template('dashboard.html',
            stats={'revenue': 0, 'bookings': 0, 'customers': 0, 'canceled': 0},
            recent_bookings=[], city_labels=[], city_values=[],
            economy_count=0, business_count=0)

    cur = conn.cursor(dictionary=True)

    try:
        cur.execute("SELECT COUNT(*) AS c FROM Customers")
        customers_count = cur.fetchone()['c']

        cur.execute("SELECT COUNT(*) AS c FROM Bookings")
        bookings_count = cur.fetchone()['c']

        cur.execute("SELECT COUNT(*) AS c FROM Bookings WHERE status = 'Canceled'")
        canceled_count = cur.fetchone()['c']

        cur.execute("SELECT COALESCE(SUM(total_price), 0) AS s FROM Bookings WHERE status != 'Canceled'")
        revenue = float(cur.fetchone()['s'])

        # Recent 8 bookings
        cur.execute("""
            SELECT b.booking_no, b.class, b.status, b.total_price,
                   c.first_name, c.last_name, c.customer_id, b.dep_time
            FROM Bookings b
            JOIN Customers c ON b.payer_customer_id = c.customer_id
            ORDER BY b.booking_no ASC LIMIT 8
        """)
        recent_bookings = cur.fetchall()

        # City financials for chart (Q8 data)
        cur.execute("""
            SELECT ci.city_name, SUM(b.total_price) AS total_price
            FROM Bookings b
            JOIN Cities ci ON b.booking_city_id = ci.city_id
            WHERE b.status != 'Canceled'
            GROUP BY ci.city_name ORDER BY total_price DESC LIMIT 6
        """)
        city_rows = cur.fetchall()
        city_labels = [r['city_name'] for r in city_rows]
        city_values = [float(r['total_price']) for r in city_rows]

        # Booking class split
        cur.execute("SELECT COUNT(*) AS c FROM Bookings WHERE class='Economy'")
        economy_count = cur.fetchone()['c']
        cur.execute("SELECT COUNT(*) AS c FROM Bookings WHERE class='Business'")
        business_count = cur.fetchone()['c']

    except Error as e:
        print(f"[DASHBOARD ERROR] {e}")
        return render_template('dashboard.html',
            stats={'revenue': 0, 'bookings': 0, 'customers': 0, 'canceled': 0},
            recent_bookings=[], city_labels=[], city_values=[],
            economy_count=0, business_count=0)
    finally:
        cur.close()
        conn.close()

    return render_template('dashboard.html',
        stats={
            'revenue': revenue,
            'bookings': bookings_count,
            'customers': customers_count,
            'canceled': canceled_count,
        },
        recent_bookings=recent_bookings,
        city_labels=city_labels,
        city_values=city_values,
        economy_count=economy_count,
        business_count=business_count,
    )

# ── Flights ──────────────────────────────────────────────────
@app.route('/flights')
def flights():
    origin       = request.args.get('origin', '').strip()
    dest         = request.args.get('dest',   '').strip()
    class_filter = request.args.get('class',  '').strip()

    sql = """
        SELECT DISTINCT
            f.flight_no, f.airline_code,
            f.business_class_indicator, f.smoking_allowed,
            fa.dep_time, fa.arr_time,
            fa.base_price,
            fa.total_economy, fa.booked_economy,
            (fa.total_economy - fa.booked_economy) AS economy_avail,
            fa.total_business, fa.booked_business,
            (COALESCE(fa.total_business,0) - COALESCE(fa.booked_business,0)) AS business_avail,
            c1.airport_code AS origin_code, c1.city_name AS origin_city,
            c2.airport_code AS dest_code,   c2.city_name AS dest_city
        FROM Flights f
        JOIN Flight_Availabilities fa ON f.flight_no = fa.flight_no
        JOIN Cities c1 ON fa.origin_city_id = c1.city_id
        JOIN Cities c2 ON fa.dest_city_id   = c2.city_id
        WHERE 1=1
    """
    params = []
    if origin:
        sql += " AND (c1.city_name LIKE %s OR c1.airport_code LIKE %s)"
        params += [f'%{origin}%', f'%{origin}%']
    if dest:
        sql += " AND (c2.city_name LIKE %s OR c2.airport_code LIKE %s)"
        params += [f'%{dest}%', f'%{dest}%']
    sql += " ORDER BY fa.dep_time"

    rows = query_db(sql, params)
    return render_template('flights.html',
        flights=rows, origin=origin, dest=dest, class_filter=class_filter)

# ── Bookings ─────────────────────────────────────────────────
@app.route('/bookings')
def bookings():
    rows = query_db("""
        SELECT b.booking_no, b.class, b.status,
               b.total_price, b.amount_paid, b.outstanding_balance,
               b.dep_time,
               c.first_name, c.last_name, c.customer_id,
               f.flight_no,
               orig.city_name AS origin,
               dest.city_name AS destination
        FROM Bookings b
        JOIN Customers c ON b.payer_customer_id = c.customer_id
        JOIN Flight_Availabilities fa ON b.flight_no = fa.flight_no AND b.dep_time = fa.dep_time
        JOIN Cities orig ON fa.origin_city_id = orig.city_id
        JOIN Cities dest ON fa.dest_city_id   = dest.city_id
        JOIN Flights f ON b.flight_no = f.flight_no
        ORDER BY b.booking_no ASC
    """)

    booked_count   = sum(1 for r in rows if r['status'] == 'Booked')
    canceled_count = sum(1 for r in rows if r['status'] == 'Canceled')
    scratched_count= sum(1 for r in rows if r['status'] == 'Scratched')

    return render_template('bookings.html',
        bookings=rows,
        booked_count=booked_count,
        canceled_count=canceled_count,
        scratched_count=scratched_count,
    )

# ── Customers ────────────────────────────────────────────────
@app.route('/customers')
def customers():
    search     = request.args.get('search',     '').strip()
    country    = request.args.get('country',    '').strip()
    booked     = request.args.get('booked',     '').strip()
    no_booking = request.args.get('no_booking', '').strip()
    page       = max(1, int(request.args.get('page', 1)))
    per_page   = 20

    base_sql = """
        SELECT c.customer_id, c.first_name, c.last_name,
               c.street, c.city, c.province, c.postal_code, c.country,
               ce.email,
               CONCAT(cp.area_code, '-', SUBSTRING(cp.local_number,1,3),
                      '-', SUBSTRING(cp.local_number,4)) AS phone_no
        FROM Customers c
        LEFT JOIN Customer_Emails ce ON c.customer_id = ce.customer_id
        LEFT JOIN Customer_Phones cp ON c.customer_id = cp.customer_id
    """
    params = []
    where = []

    if booked:
        base_sql += " JOIN Bookings b ON c.customer_id = b.payer_customer_id"
        where.append("1=1")

    if no_booking:
        base_sql += " LEFT JOIN Bookings bnb ON c.customer_id = bnb.payer_customer_id"
        where.append("bnb.booking_no IS NULL")

    if country:
        where.append("c.country = %s")
        params.append(country)

    if search:
        where.append("(c.first_name LIKE %s OR c.last_name LIKE %s OR c.city LIKE %s OR c.country LIKE %s)")
        params += [f'%{search}%'] * 4

    if where:
        base_sql += " WHERE " + " AND ".join(where)

    if booked:
        base_sql += " GROUP BY c.customer_id"

    base_sql += " ORDER BY c.customer_id"

    # Count total
    all_rows = query_db(base_sql, params)
    total = len(all_rows)
    total_pages = max(1, math.ceil(total / per_page))
    paginated = all_rows[(page - 1) * per_page : page * per_page]

    return render_template('customers.html',
        customers=paginated,
        page=page,
        total_pages=total_pages,
        total=total,
    )

# ── Query Playground ──────────────────────────────────────────
@app.route('/queries')
def queries():
    return render_template('queries.html')

@app.route('/api/query/<int:n>')
def api_query(n):
    """AJAX endpoint — returns query results as JSON."""
    QUERIES = {
        1:  ("SELECT * FROM Customers WHERE country = 'Canada' ORDER BY customer_id", []),
        2:  ("SELECT DISTINCT c.customer_id, c.first_name, c.last_name, c.city, c.country FROM Customers c JOIN Bookings b ON c.customer_id = b.payer_customer_id", []),
        3:  ("SELECT * FROM Exchange_Rates WHERE rate > 1 ORDER BY from_currency, to_currency", []),
        4:  ("""SELECT fa.flight_no, c1.city_name AS origin, c2.city_name AS destination,
                       fa.dep_time AS departure_time, fa.arr_time AS arrival_time
                FROM Flight_Availabilities fa
                JOIN Cities c1 ON fa.origin_city_id = c1.city_id
                JOIN Cities c2 ON fa.dest_city_id   = c2.city_id
                WHERE c1.airport_code = 'YYZ' AND c2.airport_code = 'JFK'
                ORDER BY fa.flight_no""", []),
        5:  ("""SELECT c.customer_id, c.first_name, c.last_name
                FROM Customers c
                LEFT JOIN Bookings b ON c.customer_id = b.payer_customer_id
                WHERE b.booking_no IS NULL ORDER BY c.customer_id""", []),
        6:  ("""SELECT c.customer_id, c.first_name, c.last_name,
                       CONCAT(cp.area_code, '-', SUBSTRING(cp.local_number,1,3), '-', SUBSTRING(cp.local_number,4)) AS phone_no,
                       ce.email
                FROM Customers c
                LEFT JOIN Customer_Phones cp ON c.customer_id = cp.customer_id
                LEFT JOIN Customer_Emails ce ON c.customer_id = ce.customer_id
                ORDER BY c.customer_id""", []),
        7:  ("""SELECT b.booking_no, b.payer_customer_id AS customer_id, b.flight_no,
                       orig.city_name AS origin, dest.city_name AS destination,
                       b.class, b.status, bc.city_name AS booking_city
                FROM Bookings b
                JOIN Flight_Availabilities fa ON b.flight_no = fa.flight_no AND b.dep_time = fa.dep_time
                JOIN Cities orig ON fa.origin_city_id = orig.city_id
                JOIN Cities dest ON fa.dest_city_id   = dest.city_id
                JOIN Cities bc  ON b.booking_city_id  = bc.city_id
                WHERE b.status = 'Canceled'
                ORDER BY b.booking_no, b.payer_customer_id, b.flight_no""", []),
        8:  ("""SELECT ci.city_name,
                       ROUND(SUM(b.total_price), 2)           AS total_price,
                       ROUND(SUM(b.amount_paid), 2)           AS total_payment,
                       ROUND(SUM(b.outstanding_balance), 2)   AS total_balance
                FROM Bookings b
                JOIN Cities ci ON b.booking_city_id = ci.city_id
                WHERE b.status != 'Canceled'
                GROUP BY ci.city_name ORDER BY ci.city_name""", []),
        9:  ("""SELECT b.booking_no,
                       orig.city_name AS origin,
                       dest.city_name AS destination,
                       ROUND(b.flight_price, 2)  AS flight_price,
                       ROUND(b.total_price, 2)   AS previous_total_price,
                       ROUND(b.flight_price + (orig.airport_tax + 0.01) + (dest.airport_tax - 0.005), 2) AS new_total_price
                FROM Bookings b
                JOIN Flight_Availabilities fa ON b.flight_no = fa.flight_no AND b.dep_time = fa.dep_time
                JOIN Cities orig ON fa.origin_city_id = orig.city_id
                JOIN Cities dest ON fa.dest_city_id   = dest.city_id""", []),
        10: ("""SELECT c.customer_id, c.first_name, c.last_name,
                       COUNT(DISTINCT b.booking_no)    AS number_of_bookings,
                       COUNT(DISTINCT ce.email)        AS number_of_emails,
                       COUNT(DISTINCT cp.local_number) AS number_of_phones,
                       COUNT(DISTINCT cf.local_number) AS number_of_faxs
                FROM Customers c
                LEFT JOIN Bookings b        ON c.customer_id = b.payer_customer_id
                LEFT JOIN Customer_Emails ce ON c.customer_id = ce.customer_id
                LEFT JOIN Customer_Phones cp ON c.customer_id = cp.customer_id
                LEFT JOIN Customer_Faxes  cf ON c.customer_id = cf.customer_id
                GROUP BY c.customer_id, c.first_name, c.last_name
                ORDER BY c.customer_id""", []),
    }

    if n not in QUERIES:
        return jsonify({'error': 'Invalid query number'}), 404

    sql, params = QUERIES[n]
    rows = query_db(sql, params)

    if rows is None:
        return jsonify({'error': 'Database query failed'}), 500

    if not rows:
        return jsonify({'columns': [], 'rows': []})

    # Convert to JSON-serialisable dicts
    columns = list(rows[0].keys())
    serialisable = []
    for row in rows:
        clean = {}
        for k, v in row.items():
            if hasattr(v, 'strftime'):  # datetime
                clean[k] = v.strftime('%Y-%m-%d %H:%M')
            elif v is None:
                clean[k] = None
            else:
                clean[k] = v
        serialisable.append(clean)

    return jsonify({'columns': columns, 'rows': serialisable})

# ── API Stats ────────────────────────────────────────────────
@app.route('/api/stats')
def api_stats():
    return jsonify({
        'customers': query_db("SELECT COUNT(*) AS c FROM Customers", one=True)['c'],
        'bookings':  query_db("SELECT COUNT(*) AS c FROM Bookings",  one=True)['c'],
        'flights':   query_db("SELECT COUNT(*) AS c FROM Flights",   one=True)['c'],
        'revenue':   float(query_db("SELECT COALESCE(SUM(total_price),0) AS s FROM Bookings WHERE status!='Canceled'", one=True)['s']),
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print("=" * 48)
    print("  AeroSync — Airline Reservation System")
    print(f"  http://0.0.0.0:{port}")
    print("=" * 48)
    app.run(debug=False, host='0.0.0.0', port=port)
