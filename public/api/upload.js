export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const { imageBase64 } = req.body;
        
        // Formatera datan för ImgBB
        const formData = new URLSearchParams();
        formData.append('image', imageBase64);

        // Skicka till ImgBB med din dolda API-nyckel i Vercel
        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const data = await imgbbRes.json();
        
        if (data.success) {
            res.status(200).json({ url: data.data.url });
        } else {
            res.status(500).json({ error: "Misslyckades ladda upp bild till servern." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}