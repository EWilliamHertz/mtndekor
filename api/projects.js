import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { before_image_url, after_image_url } = req.body;
        try {
            await pool.query('INSERT INTO projects (before_image_url, after_image_url) VALUES ($1, $2)', [before_image_url, after_image_url]);
            return res.status(201).json({ message: 'Projekt tillagt!' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}