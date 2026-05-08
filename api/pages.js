import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pages (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Kunde inte skapa tabell:", err);
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM pages ORDER BY created_at ASC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    else if (req.method === 'POST') {
        const { title, content } = req.body;
        // Skapa en URL-vänlig slug av titeln (t.ex. "Om Oss" -> "om-oss")
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        try {
            await pool.query(
                'INSERT INTO pages (title, slug, content) VALUES ($1, $2, $3)', 
                [title, slug, content]
            );
            return res.status(201).json({ message: 'Sida skapad!' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    else if (req.method === 'DELETE') {
        const { id } = req.body;
        try {
            await pool.query('DELETE FROM pages WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Borttagen' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}