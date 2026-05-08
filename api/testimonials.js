import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id SERIAL PRIMARY KEY,
                author VARCHAR(255) NOT NULL,
                rating INT NOT NULL DEFAULT 5,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error('DB init error:', err);
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    else if (req.method === 'POST') {
        const { author, rating, text } = req.body;
        if (!author || !text) return res.status(400).json({ error: 'author och text krävs' });
        try {
            await pool.query(
                'INSERT INTO testimonials (author, rating, text) VALUES ($1, $2, $3)',
                [author, rating || 5, text]
            );
            return res.status(201).json({ message: 'Omdöme sparat' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Borttaget' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
