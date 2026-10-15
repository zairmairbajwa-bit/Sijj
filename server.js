const express = require('express');
const cors = require('cors'); 
const app = express();

app.use(cors());

// Yahan maine Pathaan aur Iron Man ke asal posters ke links laga diye hain
const moviesData = [
  {
    id: 1,
    title: 'Pathaan (Hindi Dubbed)',
    year: 2023,
    rating: '8.5',
    large_cover_image: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Pathaan_film_poster.jpg',
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' 
  },
  {
    id: 2,
    title: 'Iron Man 1 (Hindi)',
    year: 2008,
    rating: '9.0',
    large_cover_image: 'https://upload.wikimedia.org/wikipedia/en/0/02/Iron_Man_%282008_film%29_poster.jpg',
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4'
  }
];

app.get('/api/movies', (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  
  if (query) {
    const filteredMovies = moviesData.filter(movie => 
      movie.title.toLowerCase().includes(query)
    );
    res.json({ data: { movies: filteredMovies } });
  } else {
    res.json({ data: { movies: moviesData } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SijjMovieHub Backend is live on port ${PORT}`);
});
