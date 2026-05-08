export default function handler(req, res) {
    if (req.method === 'POST') {
        const { password } = req.body;
        // Jämför det inskrivna lösenordet med det dolda lösenordet i Vercel
        if (password === process.env.ADMIN_PASSWORD) {
            res.status(200).json({ success: true });
        } else {
            res.status(401).json({ success: false });
        }
    } else {
        res.status(405).end();
    }
}