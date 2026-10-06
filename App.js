import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const API_KEY = 'cf229389c7dc4956214688e3c524d7fb';
const screenWidth = Dimensions.get('window').width;

export default function App() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchMedia = async (query = '') => {
    setLoading(true);
    try {
      let url = `https://sijj.onrender.com/api/trending`;
      if (query.trim() !== '') {
        url = `https://sijj.onrender.com/api/search?query=${query}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      const filteredResults = data.results ? data.results.filter(item => item.poster_path) : [];
      setMedia(filteredResults);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    fetchMedia(text);
  };

  const blockAdsScript = `
    window.open = function() { return null; };
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target) {
        if (target.tagName === 'A' && target.target === '_blank') {
          e.preventDefault();
          e.stopPropagation();
        }
        target = target.parentNode;
      }
    }, true);
    true;
  `;

  if (selectedMovie) {
    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedMovie(null)}>
          <Text style={styles.backText}>⬅ Back to Movies</Text>
        </TouchableOpacity>
        <WebView 
          source={{ uri: `https://vidsrc.me/embed/movie?tmdb=${selectedMovie.id}` }} 
          style={styles.webview}
          allowsFullscreenVideo={true}
          injectedJavaScript={blockAdsScript}
          javaScriptEnabled={true}
          setSupportMultipleWindows={false}
          onMessage={(event) => {}}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>SijjMoviesHub</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search movies, TV series, dramas..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.movieCard} onPress={() => setSelectedMovie(item)}>
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                style={styles.poster}
              />
              <Text style={styles.movieTitle} numberOfLines={1}>{item.title || item.name}</Text>
              <Text style={styles.movieYear}>
                {(item.release_date || item.first_air_date || 'N/A').substring(0, 4)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', paddingTop: 50, paddingHorizontal: 10 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  searchInput: { backgroundColor: '#333', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  movieCard: { flex: 1, margin: 6, backgroundColor: '#222', borderRadius: 8, overflow: 'hidden', alignItems: 'center', paddingBottom: 8 },
  poster: { width: screenWidth / 2 - 20, height: 220, resizeMode: 'cover' },
  movieTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 6, paddingHorizontal: 5, textAlign: 'center' },
  movieYear: { color: '#aaa', fontSize: 12, marginTop: 2 },
  playerContainer: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  backButton: { padding: 15, backgroundColor: '#222', alignItems: 'center' },
  backText: { color: '#e50914', fontSize: 18, fontWeight: 'bold' },
  webview: { flex: 1, backgroundColor: '#000' }
});
