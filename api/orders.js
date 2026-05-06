import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    // POST: Create a new order (from the Swish modal)
    if (req.method === 'POST') {
        const { service_name, customer_phone } = req.body;
        try {
            await pool.query('INSERT INTO orders (service_name, customer_phone) VALUES ($1, $2)', [service_name, customer_phone]);
            return res.status(201).json({ message: 'Order skapad!' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    
    // GET: Fetch all orders (for the Admin Panel)
    else if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // PUT: Update an order status to "Betald" (for the Admin Panel)
    else if (req.method === 'PUT') {
        const { id, status } = req.body;
        try {
            await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
            return res.status(200).json({ message: 'Status uppdaterad' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // If a wrong method is used
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}