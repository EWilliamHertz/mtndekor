import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects_v2 (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                main_image TEXT NOT NULL,
                gallery JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Kunde inte skapa tabell:", err);
    }

    if (req.method === 'GET') {
        const { id } = req.query;
        try {
            if (id) {
                const result = await pool.query('SELECT * FROM projects_v2 WHERE id = $1', [id]);
                return res.status(200).json(result.rows[0]);
            }
            const result = await pool.query('SELECT * FROM projects_v2 ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    else if (req.method === 'POST') {
        const { title, description, main_image, gallery } = req.body;
        try {
            await pool.query(
                'INSERT INTO projects_v2 (title, description, main_image, gallery) VALUES ($1, $2, $3, $4)', 
                [title, description, main_image, JSON.stringify(gallery || [])]
            );
            return res.status(201).json({ message: 'Projekt skapat!' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM projects_v2 WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Borttaget' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'PUT') {
        const { id, title, description } = req.body;
        try {
            await pool.query('UPDATE projects_v2 SET title = $1, description = $2 WHERE id = $3', [title, description, id]);
            return res.status(200).json({ message: 'Projekt uppdaterat' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}