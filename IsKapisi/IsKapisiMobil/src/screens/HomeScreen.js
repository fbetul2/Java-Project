import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList, Image,
  Keyboard,
  SafeAreaView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { ilanService } from '../api/api';

// Renk Sabiti (Diğer ekranlarla aynı lacivert)
const PRIMARY_COLOR = '#1e3a8a';

// BURAYA DİKKAT: Index.tsx'ten gelen 'onIlanClick' ve 'user' prop'larını ekledik
const HomeScreen = ({ onLoginPress, onLogoutPress, onProfileClick, onIlanClick, user: propUser }) => {
  const navigation = useNavigation();
  
  const [user, setUser] = useState(null);
  const [ilanlar, setIlanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Arama State'leri
  const [kelime, setKelime] = useState('');
  const [sehir, setSehir] = useState('');

  useFocusEffect(
    useCallback(() => {
        checkUserAndFetchData();
    }, [])
  );

  const checkUserAndFetchData = async () => {
      setLoading(true);
      try {
          // Hem prop'tan gelen hem storage'dan gelen veriyi kontrol edebiliriz
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
              setUser(JSON.parse(userData));
          } else {
              setUser(null);
          }

          // --- ARAMA GÜNCELLEMESİ BURADA ---
          // Girilen kelimelerin başındaki/sonundaki boşlukları temizliyoruz (.trim())
          const searchKelime = kelime ? kelime.trim() : '';
          const searchSehir = sehir ? sehir.trim() : '';

          // Servise hem kelimeyi hem şehri gönderiyoruz.
          const data = await ilanService.getAllIlanlar(searchKelime, searchSehir);
          
          console.log(`ARAMA YAPILDI -> Kelime: "${searchKelime}", Şehir: "${searchSehir}"`);
          console.log("GELEN İLAN SAYISI:", data.length);
          
          setIlanlar(data);

      } catch (error) {
          console.error("Home Veri Hatası:", error);
      } finally {
          setLoading(false);
      }
  };

  // --- BURAYI DÜZELTTİK: ARTIK ROUTER DEĞİL, INDEX.TSX YÖNETİYOR ---
  const handleIlanTikla = (id) => {
      console.log("TIKLANAN İLAN ID:", id); 
      if (id) {
          // Eğer Index.tsx'ten onIlanClick geldiyse onu kullan (Manuel Navigasyon)
          if (onIlanClick) {
              onIlanClick(id);
          } else {
              // Yedek olarak normal navigasyon kalsın (ama hata veren yer burasıydı)
              navigation.navigate('IlanDetay', { ilanId: id });
          }
      } else {
          Alert.alert("Hata", "Bu ilanın ID bilgisi eksik.");
      }
  };

  // Arama Tetikleme
  const handleSearch = () => {
      Keyboard.dismiss(); // Klavyeyi kapat
      checkUserAndFetchData(); // Güncel state ile veriyi çek
  };

  const renderItem = ({ item }) => {
    const isSponsorlu = item.vitrinBitisTarihi && new Date(item.vitrinBitisTarihi) > new Date();
    const sirketAdi = item.sirketAdi ? item.sirketAdi : 'Şirket Adı Yok';
    const logoSource = item.logoBase64 
        ? { uri: `data:image/jpeg;base64,${item.logoBase64}` }
        : null;

    return (
      <TouchableOpacity 
        style={[
            styles.card, 
            isSponsorlu && styles.sponsoredCard
        ]} 
        onPress={() => handleIlanTikla(item.id)}
        activeOpacity={0.9}
      >
        {isSponsorlu && (
            <View style={styles.sponsoredBadgeContainer}>
                <Text style={styles.sponsoredBadgeText}>⭐ SPONSORLU</Text>
            </View>
        )}

        <View style={styles.cardHeader}>
          <View style={[styles.logoContainer, isSponsorlu && {borderColor: '#fbbf24', borderWidth: 1}]}>
            {logoSource ? (
              <Image source={logoSource} style={styles.logo} />
            ) : (
              <Text style={styles.logoText}>🏢</Text>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.baslik}</Text>
            <Text style={styles.company}>{sirketAdi}</Text>
          </View>
        </View>

        <View style={styles.tagsContainer}>
          <View style={[styles.tag, isSponsorlu && {backgroundColor: 'rgba(255,255,255,0.7)'}]}>
            <Ionicons name="location-outline" size={12} color="#475569" style={{marginRight: 4}} />
            <Text style={styles.tagText}>{item.sehir}</Text>
          </View>
          {item.maas && (
            <View style={[styles.tag, isSponsorlu && {backgroundColor: 'rgba(255,255,255,0.7)'}]}>
                <Ionicons name="wallet-outline" size={12} color="#475569" style={{marginRight: 4}} />
                <Text style={styles.tagText}>{item.maas}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <TouchableOpacity 
                onPress={() => {
                    if (onProfileClick) onProfileClick(); // Index'ten geleni kullan
                    else if (user) navigation.navigate('Profile');
                    else Alert.alert("Giriş Yapmalısınız", "Profilinizi görmek için lütfen giriş yapın.");
                }} 
            >
                {/* --- LOGO VE İSİM DEĞİŞİKLİĞİ --- */}
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image 
                        source={require('../../assets/images/logo.jpeg')} 
                        style={{width: 32, height: 32, borderRadius: 8, marginRight: 8}}
                        resizeMode="contain"
                    />
                    {/* Mor renk yerine style içinde PRIMARY_COLOR kullanıldı */}
                    <Text style={styles.brand}>İş Kapısı</Text>
                </View>
                {/* -------------------------------- */}
            </TouchableOpacity>
        </View>

        {user ? (
            <TouchableOpacity 
                onPress={async () => {
                    await AsyncStorage.removeItem('user');
                    setUser(null);
                    if (onLogoutPress) onLogoutPress(); // Index'e haber ver
                    else navigation.replace('Login');
                }} 
                style={styles.authButtonOut}
            >
                <Text style={styles.authButtonTextOut}>Çıkış</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity 
                onPress={() => {
                    if (onLoginPress) onLoginPress(); // Index'e haber ver
                    else navigation.navigate('Login');
                }} 
                style={styles.authButtonIn}
            >
                <Text style={styles.authButtonTextIn}>Giriş</Text>
            </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.heroTitle}>Hayalindeki İşi Bul</Text>
        
        <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={18} color="#94a3b8" style={{marginLeft: 10}} />
                <TextInput 
                    placeholder="Pozisyon veya firma..." 
                    style={styles.searchInput}
                    value={kelime}
                    onChangeText={setKelime}
                    placeholderTextColor="#94a3b8"
                />
            </View>
        </View>
        
        <View style={[styles.searchRow, {marginTop: 10}]}>
            <View style={[styles.searchInputContainer, {flex: 1}]}>
                <Ionicons name="location" size={18} color="#94a3b8" style={{marginLeft: 10}} />
                <TextInput 
                    placeholder="Şehir..." 
                    style={styles.searchInput}
                    value={sehir}
                    onChangeText={setSehir}
                    placeholderTextColor="#94a3b8"
                />
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Text style={styles.searchBtnText}>Ara</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Güncel İlanlar</Text>
          
          {loading ? (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50}}>
                {/* Yükleme ikonu rengi güncellendi */}
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={{marginTop: 10, color: '#64748b'}}>İlanlar Yükleniyor...</Text>
            </View>
          ) : (
            <FlatList
              data={ilanlar} 
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              refreshing={loading}
              onRefresh={checkUserAndFetchData} 
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={50} color="#cbd5e1" />
                    <Text style={styles.emptyText}>Aradığınız kriterlere uygun ilan yok.</Text>
                    <TouchableOpacity onPress={() => { setKelime(''); setSehir(''); checkUserAndFetchData(); }}>
                        <Text style={styles.resetText}>Filtreleri Temizle</Text>
                    </TouchableOpacity>
                </View>
              }
            />
          )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Mor yerine PRIMARY_COLOR
  brand: { fontSize: 20, fontWeight: '800', color: PRIMARY_COLOR, letterSpacing: -0.5 },
  authButtonIn: { backgroundColor: PRIMARY_COLOR, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  authButtonTextIn: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  authButtonOut: { backgroundColor: '#fee2e2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  authButtonTextOut: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  searchContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    // Mor gölge yerine PRIMARY_COLOR gölge
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 44
  },
  searchInput: { flex: 1, height: '100%', paddingHorizontal: 10, color: '#334155' },
  searchBtn: {
    // Mor yerine PRIMARY_COLOR
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 44
  },
  searchBtnText: { color: 'white', fontWeight: 'bold' },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 15 },
  card: { 
      backgroundColor: 'white', 
      borderRadius: 16, 
      padding: 15, 
      marginBottom: 15, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 5, 
      elevation: 2, 
      borderWidth: 1, 
      borderColor: '#f1f5f9',
      position: 'relative', 
      overflow: 'hidden'
    },
    sponsoredCard: {
      backgroundColor: '#fffbeb', 
      borderColor: '#fbbf24',     
      borderWidth: 2,            
      shadowColor: '#fbbf24',    
      shadowOpacity: 0.15,
      elevation: 4
    },
    sponsoredBadgeContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#fbbf24', 
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderTopRightRadius: 16, 
      borderBottomLeftRadius: 12,
      zIndex: 10,                
    },
    sponsoredBadgeText: { color: 'white', fontWeight: '800', fontSize: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  logo: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  logoText: { fontSize: 22 },
  infoContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  company: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 10, marginBottom: 5 },
  // Mor yerine PRIMARY_COLOR
  resetText: { color: PRIMARY_COLOR, fontWeight: '600' }
});

export default HomeScreen;