import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const screenWidth = Dimensions.get('window').width;
const BOT_URL = 'https://sijj.onrender.com';

export default function App() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [fetchingVideo, setFetchingVideo] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const video = useRef(null);

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

  useEffect(() => { fetchMedia(); }, []);

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    setVideoUrl('');
    setFetchingVideo(true);
    setDownloadProgress(0);

    try {
      const title = item.title || item.name;
      // Bot se seedha direct MP4 link mangna
      const res = await fetch(`${BOT_URL}/api/get-hindi-link?title=${title}`);
      const data = await res.json();
      
      if (data.status === "Success" && data.direct_mp4_link) {
        setVideoUrl(data.direct_mp4_link);
      } else {
        Alert.alert("Not Found", "Yeh movie abhi Hindi database mein nahi aayi.");
      }
    } catch (e) {
      Alert.alert("Error", "Server se link nahi mil saka.");
    }
    setFetchingVideo(false);
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    const fileName = (selectedItem.title || selectedItem.name).replace(/[^a-zA-Z0-9]/g, "_") + ".mp4";
    const fileUri = FileSystem.documentDirectory + fileName;

    Alert.alert("Download Started", "Yeh movie Sijj MovieBox ke andar save ho rahi hai.");

    const downloadResumable = FileSystem.createDownloadResumable(
      videoUrl,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        setDownloadProgress(Math.round(progress * 100));
      }
    );

    try {
      const { uri } = await downloadResumable.downloadAsync();
      Alert.alert("Download Complete", "Movie app ke andar offline dekhne ke liye save ho gayi hai!");
    } catch (e) {
      Alert.alert("Error", "Download fail ho gaya.");
    }
  };

  if (selectedItem) {
    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedItem(null)}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.videoWrapper}>
          {fetchingVideo ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#e50914" />
              <Text style={{color: '#fff', marginTop: 10}}>Finding Direct Hindi Link...</Text>
            </View>
          ) : videoUrl ? (
            <Video
              ref={video}
              style={styles.nativeVideo}
              source={{ uri: videoUrl }}
              useNativeControls
              resizeMode="contain"
              isLooping={false}
              shouldPlay
            />
          ) : (
            <View style={styles.loadingBox}>
              <Text style={{color: 'red'}}>Link not found. Please try another movie.</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>{selectedItem.title || selectedItem.name}</Text>
          
          {videoUrl ? (
            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
              <Text style={styles.downloadBtnText}>
                {downloadProgress > 0 && downloadProgress < 100 
                  ? `⬇️ Downloading... ${downloadProgress}%` 
                  : "⬇️ Download to App (Offline)"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={{color: '#aaa', marginTop: 10, lineHeight: 22}}>
            {selectedItem.overview}
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Sijj MovieBox</Text>
      <TextInput 
        style={styles.searchInput} 
        placeholder="Search Movies & Seasons..." 
        placeholderTextColor="#888" 
        value={searchQuery} 
        onChangeText={(text) => {
          setSearchQuery(text);
          if(text.length > 2) fetchMedia(text);
          if(text.length === 0) fetchMedia();
        }} 
      />
      {loading ? <ActivityIndicator size="large" color="#e50914" /> : (
        <FlatList 
          data={media} 
          keyExtractor={(item) => item.id.toString()} 
          numColumns={2} 
          renderItem={({item}) => (
            <TouchableOpacity style={styles.movieCard} onPress={() => handleSelectItem(item)}>
              <Image source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} style={styles.poster} />
              <Text style={styles.movieTitle} numberOfLines={1}>{item.title || item.name}</Text>
            </TouchableOpacity>
          )}
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
  playerContainer: { flex: 1, backgroundColor: '#111', paddingTop: 40 },
  backButton: { padding: 15, backgroundColor: '#222', borderBottomWidth: 1, borderBottomColor: '#333' },
  backText: { color: '#e50914', fontSize: 18, fontWeight: 'bold' },
  videoWrapper: { height: 250, width: '100%', backgroundColor: '#000', justifyContent: 'center' },
  nativeVideo: { flex: 1, width: '100%', height: '100%' },
  loadingBox: { alignItems: 'center', justifyContent: 'center' },
  detailsContainer: { padding: 15 },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  downloadBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
