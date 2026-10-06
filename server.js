const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());

app.get('/api/trending', async (req, res) => {
    try {
            res.json({ 
                        results: [
                                        { id: '1', title: 'Mob Land (Hindi Dubbed)', poster_path: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg' },
                                                        { id: '2', title: 'Latest Action Season S01', poster_path: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg' }
                                                                    ] 
                                                                            });
                                                                                } catch (error) {
                                                                                        res.json({ results: [] });
                                                                                            }
                                                                                            });

                                                                                            app.get('/api/search', async (req, res) => {
                                                                                                const query = req.query.q || '';
                                                                                                    res.json({ 
                                                                                                            results: [
                                                                                                                        { id: '3', title: query + ' (Dubbed & All Seasons Available)', poster_path: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg' }
                                                                                                                                ] 
                                                                                                                                    });
                                                                                                                                    });

                                                                                                                                    app.get('/api/play', (req, res) => {
                                                                                                                                        res.json({ url: 'https://www.youtube.com/embed/g1qiT60k680' });
                                                                                                                                        });

                                                                                                                                        app.listen(3000, () => console.log('Advanced Server is running on port 3000'));