import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    // 1. SKAPA TABELLEN OM DEN INTE FINNS (Detta löser Vercel-problemet!)
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                before_image_url TEXT,
                after_image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Kunde inte skapa tabell:", err);
    }

    // 2. HANTERA ANROP
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    else if (req.method === 'POST') {
        const { before_image_url, after_image_url } = req.body;
        try {
            await pool.query('INSERT INTO projects (before_image_url, after_image_url) VALUES ($1, $2)', [before_image_url, after_image_url]);
            return res.status(201).json({ message: 'Projekt tillagt!' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM projects WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Projekt borttaget' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'PUT') {
        const { id, before_image_url, after_image_url } = req.body;
        try {
            await pool.query('UPDATE projects SET before_image_url = $1, after_image_url = $2 WHERE id = $3', [before_image_url, after_image_url, id]);
            return res.status(200).json({ message: 'Projekt uppdaterat' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}