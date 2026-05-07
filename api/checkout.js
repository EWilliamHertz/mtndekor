import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { cartItems } = req.body;

            // Gör om dina varukorgs-produkter till ett format som Stripe förstår
            const lineItems = cartItems.map(item => ({
                price_data: {
                    currency: 'sek',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price * 100, // Stripe räknar i ören (100 = 1 kr)
                },
                quantity: 1,
            }));

            // Skapa själva betalsessionen
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'], // Lägg till 'klarna' eller 'swish' här om du aktiverar det i Stripe
                line_items: lineItems,
                mode: 'payment',
                success_url: `${req.headers.origin}/?success=true`,
                cancel_url: `${req.headers.origin}/?canceled=true`,
            });

            // Skicka tillbaka kassans länk till hemsidan
            res.status(200).json({ url: session.url });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}