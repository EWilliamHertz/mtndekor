import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Båda lösenorden måste anges.' });
        }

        try {
            // Ensure settings table exists
            await pool.query(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);

            // Verify current password matches (either DB or env var)
            const dbPassword = await getStoredPassword();
            const envPassword = process.env.ADMIN_PASSWORD;
            
            const isValid = currentPassword === dbPassword || currentPassword === envPassword;
            
            if (!isValid) {
                return res.status(401).json({ success: false, message: 'Felaktigt nuvarande lösenord.' });
            }

            // Store new password in database
            await setStoredPassword(newPassword);
            
            res.status(200).json({ success: true, message: 'Lösenordet har uppdaterats.' });
        } catch (err) {
            console.error('Password update error:', err);
            res.status(500).json({ success: false, message: 'Serverfel vid uppdatering av lösenord.' });
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

async function setStoredPassword(password) {
    try {
        // Try to update, if no rows affected, insert
        const result = await pool.query(
            'UPDATE settings SET value = $1 WHERE key = $2',
            [password, 'admin_password']
        );
        
        if (result.rowCount === 0) {
            await pool.query(
                'INSERT INTO settings (key, value) VALUES ($1, $2)',
                ['admin_password', password]
            );
        }
    } catch (err) {
        console.error('Error storing password in DB:', err);
        throw err;
    }
}
