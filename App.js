import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, ScrollView, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

const screenWidth = Dimensions.get('window').width;
const BOT_URL = 'https://sijj.onrender.com';

export default function App() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  
  const [totalSeasons, setTotalSeasons] = useState(1);
  const [totalEpisodes, setTotalEpisodes] = useState(12);

  const fetchMedia = async (query = '') => {
    setLoading(true);
    try {
      let url = query.trim() ? `${BOT_URL}/api/search?query=${query}` : `${BOT_URL}/api/trending`;
      const response = await fetch(url);
      const data = await response.json();
      setMedia(data.results || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { 
    fetchMedia(); 
    const backAction = () => {
      if (selectedItem) {
        setSelectedItem(null);
        setSeason(1);
        setEpisode(1);
        return true; 
      }
      return false; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedItem]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if(text.length > 2) fetchMedia(text);
    if(text.length === 0) fetchMedia();
  };

  // Direct TMDB ki jagah ab apne Render bot se data layega!
  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    setSeason(1);
    setEpisode(1);
    
    if (item.media_type === 'tv' || item.first_air_date) {
      try {
        const res = await fetch(`${BOT_URL}/api/tv-details?id=${item.id}`);
        const data = await res.json();
        setTotalSeasons(data.number_of_seasons || 1);
        if (data.seasons && data.seasons.length > 0) {
           const firstSeason = data.seasons.find(s => s.season_number === 1) || data.seasons[0];
           setTotalEpisodes(firstSeason.episode_count > 0 ? firstSeason.episode_count : 12);
        }
      } catch (e) {
        setTotalSeasons(1);
        setTotalEpisodes(12);
      }
    }
  };

  const handleSeasonChange = async (s) => {
    setSeason(s);
    setEpisode(1);
    try {
      const res = await fetch(`${BOT_URL}/api/tv-season?id=${selectedItem.id}&season=${s}`);
      const data = await res.json();
      if (data.episodes) {
        setTotalEpisodes(data.episodes.length);
      }
    } catch (e) { console.log(e); }
  };

  if (selectedItem) {
    const isTV = selectedItem.media_type === 'tv' || selectedItem.first_air_date;
    const videoUrl = isTV 
      ? `https://embed.su/embed/tv/${selectedItem.id}/${season}/${episode}`
      : `https://embed.su/embed/movie/${selectedItem.id}`;

    const INJECTED_JAVASCRIPT = `
      window.open = function() { return null; };
      document.addEventListener('click', function(e) {
        let target = e.target.closest('a');
        if(target && target.target === '_blank') {
          target.target = '_self';
          e.preventDefault();
        }
      });
      true;
    `;

    const seasonsArray = Array.from({ length: totalSeasons }, (_, i) => i + 1);
    const episodesArray = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedItem(null)}>
          <Text style={styles.backText}>← Back to Movies</Text>
        </TouchableOpacity>
        
        <View style={styles.videoWrapper}>
          <WebView 
            source={{ uri: videoUrl }} 
            style={styles.webview} 
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (url.includes('embed.su') || url.includes('vidsrc')) return true;
              if (url.startsWith('about:blank') || url.includes('google') || url.includes('tmdb')) return true;
              return false;
            }}
          />
        </View>

        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>{selectedItem.title || selectedItem.name}</Text>
          <Text style={{color: '#4CAF50', marginBottom: 15, fontWeight: 'bold'}}>Tip: Video player ke andar Audio (⚙️) icon par click karke 'Hindi' select karein!</Text>
          
          {isTV && (
            <View>
              <Text style={styles.sectionTitle}>Select Season (Total: {totalSeasons})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {seasonsArray.map(s => (
                  <TouchableOpacity key={s} style={[styles.epButton, season === s && styles.epButtonActive]} onPress={() => handleSeasonChange(s)}>
                    <Text style={styles.epText}>Season {s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionTitle}>Select Episode (Total: {totalEpisodes})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {episodesArray.map(ep => (
                  <TouchableOpacity key={ep} style={[styles.epButton, episode === ep && styles.epButtonActive]} onPress={() => setEpisode(ep)}>
                    <Text style={styles.epText}>Ep {ep}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Sijj MovieBox</Text>
      <TextInput style={styles.searchInput} placeholder="Search Hollywood, Bollywood, Seasons..." placeholderTextColor="#888" value={searchQuery} onChangeText={handleSearch} />
      {loading ? <ActivityIndicator size="large" color="#e50914" /> : (
        <FlatList data={media} keyExtractor={(item) => item.id.toString()} numColumns={2} renderItem={({item}) => {
            const isTV = item.media_type === 'tv' || item.first_air_date;
            return (
              <TouchableOpacity style={styles.movieCard} onPress={() => handleSelectItem(item)}>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} style={styles.poster} />
                <Text style={styles.movieTitle} numberOfLines={1}>{item.title || item.name}</Text>
                <Text style={styles.badge}>{isTV ? '📺 TV Series' : '🎬 Movie'}</Text>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 10, paddingTop: 40 },
  headerTitle: { color: '#e50914', fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  searchInput: { backgroundColor: '#333', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 15 },
  movieCard: { width: screenWidth / 2 - 15, margin: 5, backgroundColor: '#222', borderRadius: 10, paddingBottom: 10, alignItems: 'center' },
  poster: { width: '100%', height: 220, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  movieTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8, paddingHorizontal: 5 },
  badge: { color: '#aaa', fontSize: 12, marginTop: 4 },
  playerContainer: { flex: 1, backgroundColor: '#111', paddingTop: 40 },
  backButton: { padding: 15, backgroundColor: '#222' },
  backText: { color: '#e50914', fontSize: 16, fontWeight: 'bold' },
  videoWrapper: { height: 250, width: '100%', backgroundColor: '#000' },
  webview: { flex: 1 },
  detailsContainer: { padding: 15 },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  horizontalScroll: { marginBottom: 15 },
  sectionTitle: { color: '#aaa', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  epButton: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#333', borderRadius: 5, marginRight: 10 },
  epButtonActive: { backgroundColor: '#e50914' },
  epText: { color: '#fff', fontWeight: 'bold' }
});
