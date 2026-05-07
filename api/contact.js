import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { fornamn, efternamn, epost, meddelande } = req.body;

        try {
            const data = await resend.emails.send({
                from: 'Acme <onboarding@resend.dev>',
                to: ['Mtn_dekor@hotmail.com'],
                subject: `Nytt meddelande från hemsidan: ${fornamn} ${efternamn}`,
                html: `
                    <h2>Ny kontaktförfrågan</h2>
                    <p><strong>Namn:</strong> ${fornamn} ${efternamn}</p>
                    <p><strong>E-post:</strong> ${epost}</p>
                    <p><strong>Meddelande:</strong><br/>${meddelande}</p>
                `
            });

            return res.status(200).json({ message: 'Mejl skickat!', data });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}