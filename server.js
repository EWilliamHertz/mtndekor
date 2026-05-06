import express from 'express';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// Secure Database Connection
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_NwE4iXkU9dqS@ep-bitter-morning-apn7gijy-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

// Initialize Database Tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                service_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'Väntar på bekräftelse',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                before_image_url TEXT,
                after_image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database tables initialized.");
    } catch (err) {
        console.error("DB Init error:", err);
    }
}
initDB();

// --- API ROUTES ---

// Create a new order (Swish checkout)
app.post('/api/orders', async (req, res) => {
    const { service_name, customer_phone } = req.body;
    try {
        await pool.query('INSERT INTO orders (service_name, customer_phone) VALUES ($1, $2)', [service_name, customer_phone]);
        res.status(201).json({ message: 'Order skapad!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all orders (For Admin Panel)
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status (For Admin Panel)
app.put('/api/orders/:id', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ message: 'Status uppdaterad' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new project (For Admin Panel)
app.post('/api/projects', async (req, res) => {
    const { before_image_url, after_image_url } = req.body;
    try {
        await pool.query('INSERT INTO projects (before_image_url, after_image_url) VALUES ($1, $2)', [before_image_url, after_image_url]);
        res.status(201).json({ message: 'Projekt tillagt!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(\`Backend server running on http://localhost:\${PORT}\`);
});