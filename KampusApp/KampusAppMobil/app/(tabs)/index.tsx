import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList, Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../../config';

// --- YENİ EKLENDİ: Bildirim Modalı İmportu ---
import { BildirimModal } from '../../components/BildirimModal';
// ---------------------------------------------

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#262626', textMuted: '#8e8e8e', white: '#ffffff', border: '#efefef' };

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter(); 
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [kadi, setKadi] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderiler, setGonderiler] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [seciliGonderiId, setSeciliGonderiId] = useState<number | null>(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [yeniYorum, setYeniYorum] = useState('');
  const [yorumYukleniyor, setYorumYukleniyor] = useState(false);

  useFocusEffect(
    useCallback(() => {
      kontrolEt();
    }, [])
  );

  const kontrolEt = async () => {
    const id = await AsyncStorage.getItem('kullaniciId');
    if (id) {
      setGirisYapildi(true);
      navigation.setOptions({ tabBarStyle: { height: 60, paddingBottom: 5, display: 'flex' } });
      feedGetir(id);
    } else {
      setGirisYapildi(false);
      setGonderiler([]);
      setKadi('');
      setSifre('');
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    }
  };

  const girisYap = async () => {
    if (!kadi || !sifre) { Alert.alert("Hata", "Bilgileri giriniz."); return; }
    setYukleniyor(true);
    try {
      const response = await fetch(API_URLS.GIRIS, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullaniciAdi: kadi, sifre: sifre }),
      });
      
      const text = await response.text();
      try {
          const data = JSON.parse(text);
          setYukleniyor(false);
          if (data.basarili) {
            await AsyncStorage.setItem('kullaniciId', data.kullaniciId.toString());
            const gelenRol = data.rol || 'USER'; 
            await AsyncStorage.setItem('rol', gelenRol);
            console.log("Giriş Yapıldı. Rol Kaydedildi:", gelenRol);

            setGirisYapildi(true);
            navigation.setOptions({ tabBarStyle: { height: 60, paddingBottom: 5, display: 'flex' } });
            feedGetir(data.kullaniciId); 
          } else { Alert.alert("Giriş Başarısız", data.mesaj); }
      } catch (e) {
          setYukleniyor(false);
          console.log("JSON Hatası:", text); 
          Alert.alert("Bağlantı Sorunu", "Sunucuya bağlanılamadı.");
      }
    } catch (e) { setYukleniyor(false); Alert.alert("Hata", "Ağ hatası."); }
  };

  const feedGetir = async (userId?: string) => {
    setRefreshing(true);
    const id = userId || await AsyncStorage.getItem('kullaniciId');
    try {
        const response = await fetch(`${API_URLS.AKIS}?kullaniciId=${id}`);
        const data = await response.json();
        setGonderiler(data);
    } catch(e) { console.log(e); }
    finally { setRefreshing(false); }
  };

  const begen = async (gonderiId: number, begendiMi: boolean, benimGonderimMi: boolean) => {
    if (benimGonderimMi) { Alert.alert("Ups!", "İnsan kendi gönderisini beğenir mi? 😅"); return; }
    const userId = await AsyncStorage.getItem('kullaniciId');
    if (!userId) return;
    const yeniListe: any = gonderiler.map((g: any) => {
      if (g.id === gonderiId) { return { ...g, begeniSayisi: begendiMi ? g.begeniSayisi - 1 : g.begeniSayisi + 1, begendiMi: !begendiMi }; }
      return g;
    });
    setGonderiler(yeniListe);
    const formData = new FormData();
    formData.append('gonderiId', gonderiId.toString());
    formData.append('kullaniciId', userId);
    fetch(API_URLS.BEGEN, { method: 'POST', body: formData });
  };

  const yorumlariAc = (gonderiId: number) => {
    setSeciliGonderiId(gonderiId);
    setModalVisible(true);
    setYorumYukleniyor(true);
    fetch(API_URLS.YORUMLAR + gonderiId).then(res => res.json()).then(data => { setYorumlar(data); setYorumYukleniyor(false); }).catch(e => setYorumYukleniyor(false));
  };

  const yorumGonder = async () => {
    if (!yeniYorum.trim()) return;
    const userId = await AsyncStorage.getItem('kullaniciId');
    if (!userId || !seciliGonderiId) return;
    const formData = new FormData();
    formData.append('gonderiId', seciliGonderiId.toString());
    formData.append('kullaniciId', userId);
    formData.append('metin', yeniYorum);
    
    fetch(API_URLS.YORUM_YAP, { method: 'POST', body: formData }).then(() => {
        setYeniYorum('');
        yorumlariAc(seciliGonderiId); 
    });
  };

  const yorumSil = async (yorumId: number) => {
    const userId = await AsyncStorage.getItem('kullaniciId');
    const formData = new FormData();
    formData.append('yorumId', yorumId.toString());
    formData.append('kullaniciId', userId || '');

    fetch(API_URLS.YORUM_SIL, { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        if (data.basarili) {
          setYorumlar(yorumlar.filter((y: any) => y.id !== yorumId));
        } else {
          Alert.alert("Hata", data.mesaj);
        }
      });
  };

  const renderGonderi = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            {item.yazarResim ? (
            <Image source={{ uri: `data:image/jpeg;base64,${item.yazarResim}` }} style={styles.avatar} />
            ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}><Text style={styles.avatarText}>{item.yazarAdSoyad?.charAt(0)}</Text></View>
            )}
            <View><Text style={styles.authorName}>{item.yazarAdSoyad}</Text><Text style={styles.authorDept}>{item.yazarBolum || 'Öğrenci'}</Text></View>
        </View>
        {item.benimGonderimMi && <Text style={styles.myPostBadge}>Senin</Text>}
      </View>
      <Text style={styles.postText}>{item.metin}</Text>
      {item.gonderiResim && <Image source={{ uri: `data:image/jpeg;base64,${item.gonderiResim}` }} style={styles.postImage} resizeMode="cover" />}
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.interactionItem} onPress={() => begen(item.id, item.begendiMi, item.benimGonderimMi)}>
          <Text style={{color: item.begendiMi ? COLORS.burgundy : COLORS.textMuted, fontSize:16, fontWeight: item.begendiMi ? 'bold' : 'normal'}}>
            {item.begendiMi ? '❤️' : '🤍'} {item.begeniSayisi} Beğen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionItem} onPress={() => yorumlariAc(item.id)}>
          <Text style={{color: COLORS.textMuted, fontSize:16}}>💬 Yorum Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- GİRİŞ EKRANI (Login) ---
  if (!girisYapildi) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgMain} />
        <View style={styles.headerContainer}>
           <View style={{marginBottom: 20}}>
             <Image source={require('../../assets/images/1.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
           </View>
           <Text style={styles.appTitle}>Kampüs<Text style={{color: COLORS.burgundy}}>App</Text></Text>
           <Text style={styles.subTitle}>Öğrenci Sosyal Platformu</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giriş Yap</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput style={styles.input} placeholder="Örn: betul123" placeholderTextColor="#999" value={kadi} onChangeText={setKadi} autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput style={styles.input} placeholder="••••••" placeholderTextColor="#999" value={sifre} onChangeText={setSifre} secureTextEntry />
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={girisYap} disabled={yukleniyor}>
            {yukleniyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Giriş Yap</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{marginTop: 15}} onPress={() => router.push('/register')}>
             <Text style={styles.linkText}>Hesabın yok mu? <Text style={{color: COLORS.burgundy, fontWeight:'bold'}}>Kayıt Ol</Text></Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>© 2025 KampüsApp Mobile</Text>
      </SafeAreaView>
    );
  }

  // --- ANA AKIŞ EKRANI (Feed) ---
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.bgMain}}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgMain} />
      <View style={styles.headerBar}>
         <Text style={styles.headerTitle}>Kampüs<Text style={{color: COLORS.burgundy}}>App</Text></Text>
         <TouchableOpacity 
            style={{position:'absolute', right:20}} 
            onPress={() => router.push('/chatList')}
         >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.burgundy} />
         </TouchableOpacity>
      </View>
      
      <FlatList 
        data={gonderiler} 
        renderItem={renderGonderi} 
        keyExtractor={(item: any) => item.id.toString()} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => feedGetir()} />} 
        contentContainerStyle={{ paddingBottom: 20 }} 
        ListEmptyComponent={
            <View style={{alignItems:'center', marginTop:50}}>
                <Text style={{color:'#999'}}>Takip ettiğin kimse yok veya henüz paylaşım yapılmadı.</Text>
            </View>
        }
      />
      
      {/* Yorum Modalı */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
           <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                 <View style={styles.dragIndicator} />
                 <Text style={styles.modalTitle}>Yorumlar</Text>
                 <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
              </View>
              {yorumYukleniyor ? <ActivityIndicator style={{marginTop:20}} color={COLORS.burgundy} /> : (
                <FlatList 
                  data={yorumlar}
                  keyExtractor={(item:any) => item.id.toString()}
                  renderItem={({item}) => (
                    <View style={styles.commentRow}>
                       <View style={styles.commentBubble}>
                          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                            <Text style={styles.commentAuthor}>{item.yazarAd}</Text>
                            <TouchableOpacity onPress={() => yorumSil(item.id)}>
                                <Ionicons name="trash-outline" size={16} color="#999" />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.commentText}>{item.icerik}</Text>
                       </View>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#999'}}>Henüz yorum yok.</Text>}
                />
              )}
              <View style={styles.commentInputWrapper}>
                 <TextInput style={styles.commentInput} placeholder="Yorum ekle..." value={yeniYorum} onChangeText={setYeniYorum} placeholderTextColor="#999"/>
                 <TouchableOpacity onPress={yorumGonder} disabled={!yeniYorum.trim()}>
                    <Text style={[styles.postBtnText, {color: yeniYorum.trim() ? COLORS.burgundy : '#ccc'}]}>Paylaş</Text>
                 </TouchableOpacity>
              </View>
           </KeyboardAvoidingView>
           
        </View>
      </Modal>

      {/* --- YENİ EKLENDİ: Bildirim Modalı Buraya Geldi --- */}
      <BildirimModal />
      {/* ------------------------------------------------- */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  appTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textDark },
  subTitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 5, fontWeight: '500' },
  card: { width: '90%', backgroundColor: COLORS.white, borderRadius: 24, padding: 30, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 25, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: COLORS.textDark, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border, borderRadius: 12, padding: 15, fontSize: 16, color: COLORS.textDark },
  loginButton: { backgroundColor: COLORS.burgundy, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: COLORS.burgundy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  linkText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, marginTop: 10 },
  footerText: { position: 'absolute', bottom: 30, color: COLORS.textMuted, fontSize: 12 },
  
  headerBar: { width:'100%', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  postCard: { width:'100%', backgroundColor: 'white', marginBottom: 10, padding: 15, borderTopWidth:1, borderBottomWidth:1, borderColor:'#eee' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  placeholderAvatar: { backgroundColor: COLORS.burgundy, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  authorName: { fontWeight: 'bold', color: COLORS.textDark, fontSize: 15 },
  authorDept: { color: COLORS.textMuted, fontSize: 12 },
  myPostBadge: { marginLeft: 'auto', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, fontSize: 10, color: '#666' },
  postText: { fontSize: 15, color: COLORS.textDark, lineHeight: 22, marginBottom: 10 },
  postImage: { width: '100%', height: 250, borderRadius: 10, marginBottom: 10 },
  postFooter: { flexDirection: 'row', marginTop: 5, justifyContent: 'space-around' },
  interactionItem: { flexDirection: 'row', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, display: 'flex' },
  modalHeader: { padding: 15, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center', position: 'relative' },
  dragIndicator: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, marginBottom: 10 },
  modalTitle: { fontWeight: 'bold', fontSize: 16 },
  closeBtn: { position: 'absolute', right: 15, top: 20 },
  commentRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 0 },
  commentBubble: { flex: 1, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 15 },
  commentAuthor: { fontWeight: 'bold', fontSize: 14, color: COLORS.textDark, marginBottom: 2 },
  commentText: { fontWeight: 'normal', color: '#333' },
  commentInputWrapper: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#eee', alignItems: 'center' },
  commentInput: { flex: 1, padding: 10, paddingVertical: 12, backgroundColor: '#f5f5f5', borderRadius: 25 },
  postBtnText: { fontWeight: 'bold', marginLeft: 15 }
});