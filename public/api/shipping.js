import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shipping_rates (
                id SERIAL PRIMARY KEY,
                min_weight INT NOT NULL,
                max_weight INT NOT NULL,
                price INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Database error:", err);
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM shipping_rates ORDER BY min_weight ASC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    else if (req.method === 'POST') {
        const { min_weight, max_weight, price } = req.body;
        try {
            await pool.query(
                'INSERT INTO shipping_rates (min_weight, max_weight, price) VALUES ($1, $2, $3)', 
                [min_weight, max_weight, price]
            );
            return res.status(201).json({ message: 'Fraktklass skapad' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM shipping_rates WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Borttagen' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}