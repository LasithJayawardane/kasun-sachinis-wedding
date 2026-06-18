export default async function handler(req, res) {
    const GIST_ID = process.env.GIST_ID;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GIST_ID || !GITHUB_TOKEN) {
        return res.status(500).json({ error: 'Missing environment variables' });
    }

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Vercel-Wishes-App'
    };

    if (req.method === 'GET') {
        try {
            const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers });
            const data = await response.json();
            const content = data.files['wishes.json'].content;
            return res.status(200).json(JSON.parse(content));
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch wishes' });
        }
    }

    if (req.method === 'POST') {
        try {
            const newWishes = req.body;
            const updateResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    files: {
                        'wishes.json': {
                            content: JSON.stringify(newWishes, null, 2)
                        }
                    }
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update gist');
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save wishes' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
