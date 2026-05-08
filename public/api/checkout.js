import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { cartItems, shippingCost } = req.body;

            const lineItems = cartItems.map(item => ({
                price_data: {
                    currency: 'sek',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price * 100, 
                },
                quantity: 1,
            }));

            // Lägg till frakten som en egen produkt i kassan om den är större än 0 kr
            if (shippingCost > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'sek',
                        product_data: {
                            name: 'Fraktkostnad',
                        },
                        unit_amount: shippingCost * 100,
                    },
                    quantity: 1,
                });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${req.headers.origin}/?success=true`,
                cancel_url: `${req.headers.origin}/?canceled=true`,
            });

            res.status(200).json({ url: session.url });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}