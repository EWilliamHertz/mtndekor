import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hero_slides (
                id SERIAL PRIMARY KEY,
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Database error:", err);
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM hero_slides ORDER BY created_at ASC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    else if (req.method === 'POST') {
        const { image_url } = req.body;
        try {
            await pool.query('INSERT INTO hero_slides (image_url) VALUES ($1)', [image_url]);
            return res.status(201).json({ message: 'Bild uppladdad' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM hero_slides WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Borttagen' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}