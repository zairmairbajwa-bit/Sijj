import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
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

  const fetchMedia = async (query = '') => {
    setLoading(true);
    try {
      let url = query.trim() ? `${BOT_URL}/api/search?query=${query}` : `${BOT_URL}/api/trending`;
      const response = await fetch(url);
      const data = await response.json();
      setMedia(data.results || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if(text.length > 2) fetchMedia(text);
    if(text.length === 0) fetchMedia();
  };

  if (selectedItem) {
    const isTV = selectedItem.media_type === 'tv' || selectedItem.first_air_date;
    const videoUrl = isTV 
      ? `https://vidsrc.me/embed/tv?tmdb=${selectedItem.id}&season=${season}&episode=${episode}`
      : `https://vidsrc.me/embed/movie?tmdb=${selectedItem.id}`;

    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedItem(null); setSeason(1); setEpisode(1); }}>
          <Text style={styles.backText}>← Back to Movies</Text>
        </TouchableOpacity>
        
        <View style={styles.videoWrapper}>
          <WebView source={{ uri: videoUrl }} style={styles.webview} allowsFullscreenVideo={true} />
        </View>

        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>{selectedItem.title || selectedItem.name}</Text>
          
          {isTV && (
            <View>
              {/* Seasons Selector */}
              <Text style={styles.sectionTitle}>Select Season</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {[1,2,3,4,5,6].map(s => (
                  <TouchableOpacity key={s} style={[styles.epButton, season === s && styles.epButtonActive]} onPress={() => { setSeason(s); setEpisode(1); }}>
                    <Text style={styles.epText}>Season {s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Episodes Selector */}
              <Text style={styles.sectionTitle}>Select Episode</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(ep => (
                  <TouchableOpacity key={ep} style={[styles.epButton, episode === ep && styles.epButtonActive]} onPress={() => setEpisode(ep)}>
                    <Text style={styles.epText}>Ep {ep}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionTitle}>Related Movies & Shows</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={media.slice(0, 10)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.relatedCard} onPress={() => { setSelectedItem(item); setSeason(1); setEpisode(1); }}>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} style={styles.relatedPoster} />
              </TouchableOpacity>
            )}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Sijj MovieBox</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search Hollywood, Bollywood, Seasons..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {loading ? <ActivityIndicator size="large" color="#e50914" /> : (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({item}) => {
            const isTV = item.media_type === 'tv' || item.first_air_date;
            return (
              <TouchableOpacity style={styles.movieCard} onPress={() => { setSelectedItem(item); setSeason(1); setEpisode(1); }}>
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
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  horizontalScroll: { marginBottom: 15 },
  sectionTitle: { color: '#aaa', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  epButton: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#333', borderRadius: 5, marginRight: 10 },
  epButtonActive: { backgroundColor: '#e50914' },
  epText: { color: '#fff', fontWeight: 'bold' },
  relatedCard: { marginRight: 10 },
  relatedPoster: { width: 100, height: 150, borderRadius: 8 }
});
