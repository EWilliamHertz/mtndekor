import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { password } = req.body;
        
        try {
            // Check database first, then fall back to env var
            const storedPassword = await getStoredPassword();
            const envPassword = process.env.ADMIN_PASSWORD;
            
            if (password === storedPassword || password === envPassword) {
                res.status(200).json({ success: true });
            } else {
                res.status(401).json({ success: false });
            }
        } catch (err) {
            console.error('Auth error:', err);
            // Fallback to env var if DB is unavailable
            if (password === process.env.ADMIN_PASSWORD) {
                res.status(200).json({ success: true });
            } else {
                res.status(401).json({ success: false });
            }
        }
    } else {
        res.status(405).end();
    }
}

async function getStoredPassword() {
    try {
        const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['admin_password']);
        if (result.rows.length > 0) {
            return result.rows[0].value;
        }
    } catch (err) {
        console.error('Error reading password from DB:', err);
    }
    return null;
}
