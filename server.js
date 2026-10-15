const express = require('express');
const cors = require('cors'); 
const app = express();

app.use(cors());

const moviesData = [
  {
    id: 1,
    title: 'Pathaan (Hindi Dubbed)',
    year: 2023,
    rating: '8.5',
    large_cover_image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80',
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' 
  },
  {
    id: 2,
    title: 'Iron Man 1 (Hindi)',
    year: 2008,
    rating: '9.0',
    large_cover_image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80',
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
