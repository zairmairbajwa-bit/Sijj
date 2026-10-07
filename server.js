const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Direct MP4 Link nikalne wala naya Unblockable Bot
app.get('/api/get-hindi-link', async (req, res) => {
    const movieTitle = req.query.title;
    if (!movieTitle) return res.json({ error: "Movie ka naam zaroori hai" });

    try {
        // Archive.org (No Ads, No Cloudflare) se direct movies dhoondna
        const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(movieTitle)})+AND+mediatype:(movies)&fl[]=identifier,title&sort[]=downloads+desc&rows=5&output=json`;
        
        const { data } = await axios.get(searchUrl);
        
        if (!data.response || data.response.docs.length === 0) {
             return res.json({ status: "Failed", message: "Yeh movie abhi database mein nahi hai." });
        }

        // Pehli movie ka folder pakarna
        const movieId = data.response.docs[0].identifier;
        
        // Us folder ke andar se direct .mp4 file uthana
        const filesUrl = `https://archive.org/metadata/${movieId}`;
        const filesData = await axios.get(filesUrl);
        
        let mp4File = filesData.data.files.find(file => file.name.endsWith('.mp4'));
        
        if(mp4File) {
            const directLink = `https://archive.org/download/${movieId}/${mp4File.name}`;
            res.json({ 
                status: "Success", 
                title: movieTitle, 
                direct_mp4_link: directLink 
            });
        } else {
             res.json({ status: "Failed", message: "Movie mili par MP4 format mein nahi hai." });
        }

    } catch (error) {
        res.json({ status: "Error", message: "Server connection fail ho gaya", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Unblockable Scraper running on port ${PORT}`));
