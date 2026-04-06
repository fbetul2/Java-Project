import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { basvuruService, favoriService, ilanService } from '../api/api';

// Renk Sabiti (Lacivert)
const PRIMARY_COLOR = '#1e3a8a';

const IlanDetayScreen = ({ route, navigation, user: propUser }) => {
  
  const { ilanId } = route?.params || {};

  const [ilan, setIlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [basvuruYapildi, setBasvuruYapildi] = useState(false);
  const [favoriMi, setFavoriMi] = useState(false);
  const [cvVarMi, setCvVarMi] = useState(false);

  useFocusEffect(
    useCallback(() => {
        const verileriGetir = async () => {
            if (!ilanId) {
                console.log("İlan ID bulunamadı");
                return;
            }

            setLoading(true);
            try {
                const userData = await AsyncStorage.getItem('user');
                const activeUser = userData ? JSON.parse(userData) : null;
                setUser(activeUser);

                const ilanData = await ilanService.getIlanDetay(ilanId);
                setIlan(ilanData);

                if (activeUser && activeUser.rol === 'IS_ARAYAN') {
                    try {
                        const favDurum = await favoriService.checkFavori(activeUser.id, ilanId);
                        setFavoriMi(favDurum);
                    } catch (e) { console.log("Fav hatası:", e); }

                    try {
                        const basvuruDurum = await basvuruService.checkBasvuru(activeUser.id, ilanId);
                        setBasvuruYapildi(basvuruDurum);
                    } catch (e) { console.log("Başvuru kontrol hatası:", e); }
                    
                    setCvVarMi(true);
                }

            } catch (error) {
                console.error("Veri çekme hatası:", error);
                Alert.alert("Hata", "İlan detayları yüklenemedi.");
            } finally {
                setLoading(false);
            }
        };

        verileriGetir();
    }, [ilanId])
  );

  const toggleFavori = async () => {
    if (!user) {
        Alert.alert("Giriş Yap", "Favorilere eklemek için giriş yapmalısınız.");
        return;
    }
    if (user.rol === 'ISVEREN') return;

    const eskiDurum = favoriMi;
    setFavoriMi(!eskiDurum); 

    try {
        await favoriService.toggleFavori(user.id, ilanId);
    } catch (error) {
        setFavoriMi(eskiDurum); 
        console.log(error);
    }
  };

  const basvuruYap = async () => {
    if (!user) {
        // DÜZELTME: Index.tsx 'login' (küçük harf) bekliyor
        navigation.navigate('login'); 
        return;
    }

    Alert.alert("Başvuru", "Bu ilana başvurmak istiyor musunuz?", [
        { text: "Vazgeç", style: "cancel" },
        { 
            text: "Evet, Başvur", 
            onPress: async () => {
                try {
                    await basvuruService.makeBasvuru(user.id, ilanId);
                    setBasvuruYapildi(true);
                    Alert.alert("Başarılı 🎉", "Başvurunuz işverene iletildi.");
                } catch (error) {
                    const mesaj = error.response?.data?.message || "Başvuru sırasında hata oluştu.";
                    if (mesaj.includes("zaten")) setBasvuruYapildi(true);
                    Alert.alert("Bilgi", mesaj);
                }
            }
        }
    ]);
  };

  const haritayiAc = () => {
    if (!ilan?.enlem || !ilan?.boylam) {
        Alert.alert("Konum Yok", "Bu şirket konum bilgisi eklememiş.");
        return;
    }
    const lat = ilan.enlem;
    const lng = ilan.boylam;
    const label = ilan.sirketAdi;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url);
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
    );
  }

  if (!ilan) return null;

  const logoSource = ilan.logoBase64 ? { uri: `data:image/jpeg;base64,${ilan.logoBase64}` } : null;
  const isKendiIlani = user && user.rol === 'ISVEREN' && user.sirketAdi === ilan.sirketAdi;

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>İlan Detayı</Text>
            
            {user && user.rol === 'IS_ARAYAN' ? (
                <TouchableOpacity style={styles.favButton} onPress={toggleFavori}>
                    <Ionicons 
                        name={favoriMi ? "heart" : "heart-outline"} 
                        size={24} 
                        color={favoriMi ? "#ef4444" : PRIMARY_COLOR} 
                    />
                </TouchableOpacity>
            ) : (
                <View style={{width: 34}} />
            )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.mainCard}>
                <View style={styles.logoRow}>
                    <View style={styles.logoContainer}>
                        {logoSource ? (
                            <Image source={logoSource} style={styles.logo} />
                        ) : (
                            <Text style={{fontSize: 30}}>🏢</Text>
                        )}
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.jobTitle}>{ilan.baslik}</Text>
                        <Text style={styles.companyName}>{ilan.sirketAdi}</Text>
                    </View>
                </View>

                <View style={styles.tagsContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>📍 {ilan.sehir}</Text>
                    </View>
                    {ilan.maas && (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>💰 {ilan.maas}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>İş Tanımı</Text>
                <Text style={styles.descriptionText}>
                    {ilan.aciklama || "Açıklama girilmemiş."}
                </Text>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Konum</Text>
                <TouchableOpacity style={styles.mapButton} onPress={haritayiAc}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={styles.mapIconBox}>
                            <Ionicons name="location" size={24} color="#fff" />
                        </View>
                        <View style={{marginLeft: 15}}>
                            <Text style={styles.mapTitle}>Haritada Göster</Text>
                            <Text style={styles.mapSubtitle}>
                                {ilan.enlem ? "Konuma Git" : "Konum Bilgisi Yok"}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
            </View>
        </ScrollView>

        <View style={styles.footer}>
            {!user && (
                // DÜZELTME: Index.tsx switch-case yapısında 'login' (küçük harf) kullanılıyor.
                <TouchableOpacity style={styles.applyButton} onPress={() => navigation.navigate('login')}>
                    <Text style={styles.applyButtonText}>🔑 Giriş Yap ve Başvur</Text>
                </TouchableOpacity>
            )}

            {user && user.rol === 'IS_ARAYAN' && (
                <TouchableOpacity 
                    style={[
                        styles.applyButton, 
                        basvuruYapildi && styles.successButton
                    ]} 
                    onPress={basvuruYap}
                    disabled={basvuruYapildi}
                >
                    <Text style={styles.applyButtonText}>
                        {basvuruYapildi ? "✅ Başvuru Yapıldı" : "Hemen Başvur"}
                    </Text>
                </TouchableOpacity>
            )}

            {user && user.rol === 'ISVEREN' && !isKendiIlani && (
                <View style={styles.disabledButton}>
                    <Ionicons name="alert-circle" size={20} color="#991b1b" style={{marginRight: 8}} />
                    <Text style={styles.disabledButtonText}>⛔ İşverenler Başvuramaz</Text>
                </View>
            )}

            {isKendiIlani && (
                  <View style={[styles.disabledButton, {backgroundColor: '#eff6ff', borderColor: '#bfdbfe'}]}>
                    <Ionicons name="lock-closed" size={20} color="#1e40af" style={{marginRight: 8}} />
                    <Text style={[styles.disabledButtonText, {color: '#1e40af'}]}>🔒 Kendi İlanınız</Text>
                </View>
            )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      backgroundColor: '#f8fafc',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  backButton: { padding: 5 },
  favButton: { padding: 5 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoContainer: { width: 70, height: 70, borderRadius: 18, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  logo: { width: '100%', height: '100%', borderRadius: 18, resizeMode: 'cover' },
  titleContainer: { flex: 1 },
  jobTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 5 },
  companyName: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  tagText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  
  sectionCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  descriptionText: { fontSize: 15, color: '#334155', lineHeight: 24 },
  
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  mapIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  mapTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  mapSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', elevation: 10 },
  
  applyButton: { backgroundColor: PRIMARY_COLOR, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: PRIMARY_COLOR, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  
  successButton: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  applyButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  disabledButton: { backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#fca5a5' },
  disabledButtonText: { color: '#991b1b', fontSize: 15, fontWeight: 'bold' }
});

export default IlanDetayScreen;