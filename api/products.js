import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Lägger till vikt-kolumnen om den inte redan finns
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS weight INT DEFAULT 0;`);
    } catch (err) {
        console.error("Database error:", err);
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    else if (req.method === 'POST') {
        const { name, price, image_url, weight } = req.body;
        try {
            await pool.query(
                'INSERT INTO products (name, price, image_url, weight) VALUES ($1, $2, $3, $4)', 
                [name, price, image_url, weight || 0]
            );
            return res.status(201).json({ message: 'Produkt skapad' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM products WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Borttagen' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}