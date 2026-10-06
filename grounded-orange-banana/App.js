import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

const BOT_URL = 'https://shiny-doodle-wv546pg45gvg3gv79-3000.app.github.dev';

export default function App() {
  const [media, setMedia] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null);

  const fetchContent = async (endpoint) => {
    setLoading(true);
    try {
      const response = await fetch(`${BOT_URL}${endpoint}`);
      const data = await response.json();
      setMedia(data.results || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent('/api/trending');
    const backAction = () => {
      if (playingVideoUrl) { setPlayingVideoUrl(null); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [playingVideoUrl]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') { fetchContent('/api/trending'); } 
    else { fetchContent(`/api/search?q=${text}`); }
  };

  const handleItemPress = async (item) => {
    setLoading(true);
    try {
      const res = await fetch(`${BOT_URL}/api/play?id=${item.id}`);
      const data = await res.json();
      if(data.url) { setPlayingVideoUrl(data.url); } 
      else { alert("Video link not found!"); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Strong Ad-Blocker Code
  const blockAdsScript = `
    const blockAds = () => {
      const ads = document.querySelectorAll('iframe, .ad, .ads, .advert, div[id^="ad-"], div[class*="ad-"]');
      ads.forEach(el => el.remove());
    };
    setInterval(blockAds, 1000);
    window.open = function() { return null; };
    document.addEventListener('click', function(e) {
      let target = e.target;
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

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item)}>
      <Image source={{ uri: item.poster_path }} style={styles.poster} />
      <Text style={styles.title} numberOfLines={2}>{item.title || item.name}</Text>
    </TouchableOpacity>
  );

  if (playingVideoUrl) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setPlayingVideoUrl(null)}>
          <Text style={styles.backText}>⬅ Back to Home</Text>
        </TouchableOpacity>
        <WebView 
          source={{ uri: playingVideoUrl }} 
          style={styles.webview}
          injectedJavaScript={blockAdsScript}
          javaScriptEnabled={true}
          allowsFullscreenVideo={true}
          setSupportMultipleWindows={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sijj MovieBox 🍿</Text>
      
      {/* Category Buttons for Hindi & Seasons */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => fetchContent('/api/search?q=Hindi Dubbed Movies')}>
          <Text style={styles.filterText}>Hindi Movies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => fetchContent('/api/search?q=Hindi Dubbed Seasons')}>
          <Text style={styles.filterText}>Seasons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => fetchContent('/api/trending')}>
          <Text style={styles.filterText}>Trending</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search Movies or Seasons..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {loading ? <ActivityIndicator size="large" color="#e50914" style={{marginTop: 50}} /> : (
        <FlatList 
          data={media} 
          keyExtractor={(item, index) => index.toString()} 
          numColumns={2} 
          renderItem={renderMediaItem}
          ListEmptyComponent={<Text style={{color:'white', textAlign:'center', marginTop:20}}>No movies found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', paddingTop: 40, paddingHorizontal: 10 },
  header: { color: '#e50914', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  filters: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  filterBtn: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 5, flex: 1, marginHorizontal: 2, alignItems: 'center' },
  filterText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  card: { flex: 1, margin: 5, backgroundColor: '#222', borderRadius: 8, overflow: 'hidden', alignItems: 'center', paddingBottom: 10 },
  poster: { width: '100%', height: 200, resizeMode: 'cover' },
  title: { color: '#fff', fontSize: 13, marginVertical: 8, paddingHorizontal: 5, textAlign: 'center' },
  backBtn: { padding: 15, backgroundColor: '#e50914', marginBottom: 10, borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
  webview: { flex: 1, backgroundColor: '#000' }
});
