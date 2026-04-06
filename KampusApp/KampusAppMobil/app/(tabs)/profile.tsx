import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet, Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// Dosya yapına göre config yolunu kontrol et
import { API_URLS } from '../../config';

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142', textMuted: '#838996', white: '#ffffff' };

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<any>(null);
  
  // YENİ: Admin Rolü Kontrolü
  const [isAdmin, setIsAdmin] = useState(false);

  // MODALLAR
  const [listeModalVisible, setListeModalVisible] = useState(false);
  const [ayarlarModalVisible, setAyarlarModalVisible] = useState(false);
  
  // LİSTE STATE
  const [listeBaslik, setListeBaslik] = useState('');
  const [listeTip, setListeTip] = useState<'TAKIPCILER' | 'TAKIP_EDILENLER'>('TAKIPCILER');
  const [kullaniciListesi, setKullaniciListesi] = useState([]);
  const [listeYukleniyor, setListeYukleniyor] = useState(false);

  // GÜNCELLEME STATE
  const [yeniAd, setYeniAd] = useState('');
  const [yeniBolum, setYeniBolum] = useState('');
  const [yeniKadi, setYeniKadi] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniResim, setYeniResim] = useState<string | null>(null);
  const [guncelleniyor, setGuncelleniyor] = useState(false);

  const router = useRouter();

  useFocusEffect(useCallback(() => { profilGetir(); }, []));

  const profilGetir = async () => {
    setLoading(true);
    try {
      const id = await AsyncStorage.getItem('kullaniciId');
      
      // --- ADMIN KONTROLÜ ---
      const rol = await AsyncStorage.getItem('rol');
      if (rol === 'ADMIN') setIsAdmin(true);
      else setIsAdmin(false);
      // ----------------------

      if (id) {
        const response = await fetch(`${API_URLS.PROFIL}${id}`); // URL düzeltmesi
        const data = await response.json();
        setProfil(data);
        setYeniAd(data.adSoyad);
        setYeniBolum(data.bolum);
      } else {
        router.replace('/'); 
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const listeIslemi = async (karsiId: number) => {
      Alert.alert(
          listeTip === 'TAKIPCILER' ? "Çıkar" : "Takibi Bırak",
          "Emin misin?", 
          [
              { text: "Vazgeç", style: "cancel" },
              { text: "Evet", style: 'destructive', onPress: async () => {
                  const userId = await AsyncStorage.getItem('kullaniciId');
                  if(!userId) return;
                  const url = listeTip === 'TAKIPCILER' ? API_URLS.TAKIPCI_CIKAR : API_URLS.TAKIP_BIRAK;
                  const form = new FormData();
                  form.append('benId', userId);
                  form.append('hedefId', karsiId.toString());
                  await fetch(url, { method: 'POST', body: form });
                  setKullaniciListesi(kullaniciListesi.filter((u:any) => u.id !== karsiId));
                  if (listeTip === 'TAKIPCILER') setProfil({...profil, takipciSayisi: profil.takipciSayisi - 1});
                  else setProfil({...profil, takipEdilenSayisi: profil.takipEdilenSayisi - 1});
              }}
          ]
      );
  };

  const resimSec = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
      });
      if (!result.canceled) { setYeniResim(result.assets[0].uri); }
  };

  const profiliKaydet = async () => {
      setGuncelleniyor(true);
      const id = await AsyncStorage.getItem('kullaniciId');
      const form = new FormData();
      form.append('id', id || '');
      form.append('adSoyad', yeniAd);
      form.append('bolum', yeniBolum);
      if(yeniKadi) form.append('kullaniciAdi', yeniKadi);
      if(yeniSifre) form.append('yeniSifre', yeniSifre);

      if (yeniResim) {
          const filename = yeniResim.split('/').pop();
          // @ts-ignore
          form.append('resim', { uri: yeniResim, name: filename, type: 'image/jpeg' });
      }

      try {
          const response = await fetch(API_URLS.PROFIL_GUNCELLE, { method: 'POST', body: form });
          const data = await response.json();
          if (data.basarili) {
              Alert.alert("Başarılı", "Profil güncellendi.");
              setAyarlarModalVisible(false);
              profilGetir();
          } else {
              Alert.alert("Hata", data.mesaj);
          }
      } catch (e) { Alert.alert("Hata", "Sunucu hatası."); } 
      finally { setGuncelleniyor(false); }
  };

  const gonderiSil = async (gonderiId: number) => {
      Alert.alert("Sil", "Bu gönderiyi silmek istiyor musun?", [
          { text: "Vazgeç", style: "cancel" },
          { text: "Sil", style: 'destructive', onPress: async () => {
              const userId = await AsyncStorage.getItem('kullaniciId');
              const form = new FormData();
              form.append('gonderiId', gonderiId.toString());
              form.append('kullaniciId', userId || '');
              await fetch(API_URLS.GONDERI_SIL, { method: 'POST', body: form });
              setProfil({ ...profil, gonderilerim: profil.gonderilerim.filter((g:any) => g.id !== gonderiId) });
          }}
      ]);
  };

  const listeyiAc = async (tip: 'TAKIPCILER' | 'TAKIP_EDILENLER') => {
      const id = await AsyncStorage.getItem('kullaniciId');
      if(!id) return;
      setListeBaslik(tip === 'TAKIPCILER' ? 'Takipçiler' : 'Takip Edilenler');
      setListeTip(tip);
      setListeModalVisible(true);
      setListeYukleniyor(true);
      setKullaniciListesi([]);
      const url = tip === 'TAKIPCILER' ? `${API_URLS.PROFIL}${id}/takipciler` : `${API_URLS.PROFIL}${id}/takip-edilenler`;
      fetch(url).then(res => res.json()).then(data => { setKullaniciListesi(data); setListeYukleniyor(false); }).catch(e => setListeYukleniyor(false));
  };

  const istekIslemi = async (istekId: number, tip: 'KABUL' | 'RED') => {
      const url = tip === 'KABUL' ? API_URLS.ISTEK_KABUL : API_URLS.ISTEK_RED;
      const formData = new FormData();
      formData.append('istekId', istekId.toString());
      await fetch(url, { method: 'POST', body: formData });
      const yeniIstekler = profil.istekler.filter((i:any) => i.id !== istekId);
      let yeniTakipciSayisi = profil.takipciSayisi;
      if(tip === 'KABUL') yeniTakipciSayisi += 1;
      setProfil({ ...profil, istekler: yeniIstekler, takipciSayisi: yeniTakipciSayisi });
  };

  const cikisYap = async () => { await AsyncStorage.clear(); setProfil(null); router.replace('/'); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.burgundy} /></View>;
  if (!profil) return null;

  const renderGonderi = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={{flexDirection:'row', justifyContent:'space-between'}}>
          <Text style={styles.postText}>{item.metin}</Text>
          <TouchableOpacity onPress={() => gonderiSil(item.id)}><Ionicons name="trash-outline" size={20} color="red" /></TouchableOpacity>
      </View>
      {item.gonderiResim && <Image source={{ uri: `data:image/jpeg;base64,${item.gonderiResim}` }} style={styles.postImage} />}
      <View style={styles.postFooter}><Text style={{fontSize:12, color:'#888'}}>❤️ {item.begeniSayisi}</Text></View>
    </View>
  );

  const renderIstek = ({ item }: { item: any }) => (
      <View style={styles.requestCard}>
          <View style={{flexDirection:'row', alignItems:'center'}}>
              {item.istekAtanResim ? <Image source={{ uri: `data:image/jpeg;base64,${item.istekAtanResim}` }} style={styles.reqAvatar} /> : <View style={[styles.reqAvatar, {backgroundColor:'#ccc', justifyContent:'center', alignItems:'center'}]}><Text>{item.istekAtanAd?.charAt(0)}</Text></View>}
              <Text style={{fontWeight:'bold', marginLeft:10}}>{item.istekAtanAd}</Text>
          </View>
          <View style={{flexDirection:'row'}}>
              <TouchableOpacity onPress={() => istekIslemi(item.id, 'KABUL')} style={[styles.actionBtn, {backgroundColor: '#28a745'}]}><Text style={{color:'white'}}>✓</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => istekIslemi(item.id, 'RED')} style={[styles.actionBtn, {backgroundColor: '#dc3545', marginLeft:5}]}><Text style={{color:'white'}}>X</Text></TouchableOpacity>
          </View>
      </View>
  );

  const renderListeElemani = ({ item }: { item: any }) => (
      <View style={styles.userRow}>
          <View style={{flexDirection:'row', alignItems:'center', flex:1}}>
              {item.profilResmi ? <Image source={{ uri: `data:image/jpeg;base64,${item.profilResmi}` }} style={styles.userAvatar} /> : <View style={[styles.userAvatar, {backgroundColor:COLORS.burgundy, justifyContent:'center', alignItems:'center'}]}><Text style={{color:'white'}}>{item.adSoyad?.charAt(0)}</Text></View>}
              <View><Text style={styles.userName}>{item.adSoyad}</Text><Text style={styles.userDept}>{item.bolum}</Text></View>
          </View>
          <TouchableOpacity style={[styles.miniBtn, {borderColor: listeTip === 'TAKIPCILER' ? 'orange' : 'red'}]} onPress={() => listeIslemi(item.id)}>
              <Text style={{fontSize:10, color: listeTip === 'TAKIPCILER' ? 'orange' : 'red', fontWeight:'bold'}}>{listeTip === 'TAKIPCILER' ? 'Çıkar' : 'Bırak'}</Text>
          </TouchableOpacity>
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgMain} />
      <View style={styles.header}>
        <View style={styles.profileInfo}>
           <TouchableOpacity onPress={() => setAyarlarModalVisible(true)} style={{position:'relative'}}>
               {profil?.profilResmi ? <Image source={{ uri: `data:image/jpeg;base64,${profil.profilResmi}` }} style={styles.avatar} /> : <View style={[styles.avatar, {backgroundColor: COLORS.burgundy, justifyContent:'center', alignItems:'center'}]}><Text style={{color:'white', fontSize:30}}>{profil?.adSoyad?.charAt(0)}</Text></View>}
               <View style={styles.editIcon}><Ionicons name="pencil" size={14} color="white" /></View>
           </TouchableOpacity>
           <Text style={styles.name}>{profil?.adSoyad}</Text>
           <Text style={styles.dept}>{profil?.bolum}</Text>
           <TouchableOpacity onPress={() => setAyarlarModalVisible(true)} style={styles.settingsBtn}>
               <Text style={{fontSize:12, color: COLORS.burgundy}}>Profili Düzenle</Text>
           </TouchableOpacity>

            {/* ADMIN ROZETİ (Görsel Süs) */}
            {isAdmin && (
                <View style={{marginTop:10, backgroundColor:'#2d3142', paddingHorizontal:10, paddingVertical:4, borderRadius:15}}>
                    <Text style={{color:'white', fontSize:10, fontWeight:'bold'}}>YÖNETİCİ HESABI</Text>
                </View>
            )}
        </View>

        <View style={styles.statsContainer}>
           <View style={styles.statItem}><Text style={styles.statNumber}>{profil?.gonderiSayisi}</Text><Text style={styles.statLabel}>Gönderi</Text></View>
           <TouchableOpacity style={styles.statItem} onPress={() => listeyiAc('TAKIPCILER')}><Text style={styles.statNumber}>{profil?.takipciSayisi}</Text><Text style={styles.statLabel}>Takipçi</Text></TouchableOpacity>
           <TouchableOpacity style={styles.statItem} onPress={() => listeyiAc('TAKIP_EDILENLER')}><Text style={styles.statNumber}>{profil?.takipEdilenSayisi}</Text><Text style={styles.statLabel}>Takip</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={cikisYap}><Text style={styles.logoutButtonText}>Çıkış Yap</Text></TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* --- MEVCUT BUTONLAR --- */}
        <View style={{flexDirection:'row', marginBottom:15, justifyContent:'space-between', gap:10}}>
            <TouchableOpacity 
                onPress={() => router.push('/notes')} 
                style={styles.menuBtn}
            >
                <Ionicons name="document-text-outline" size={24} color={COLORS.burgundy} />
                <Text style={styles.menuBtnText}>Notlarım</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push('/history')} 
                style={styles.menuBtn}
            >
                <Ionicons name="time-outline" size={24} color={COLORS.burgundy} />
                <Text style={styles.menuBtnText}>Geçmiş</Text>
            </TouchableOpacity>
        </View>

        {/* --- YENİ EKLENEN ADMIN BUTONU (SENİN TASARIMINA UYGUN) --- */}
        {isAdmin && (
            <TouchableOpacity 
                // Dosya adın adminpanel.tsx (küçük harfle) olduğu için
                onPress={() => router.push('/adminpanel')} 
                style={[styles.menuBtn, {marginBottom: 15, backgroundColor: '#2d3142'}]}
            >
                <Ionicons name="shield-checkmark-outline" size={24} color="white" />
                <Text style={[styles.menuBtnText, {color:'white'}]}>YÖNETİM PANELİ</Text>
            </TouchableOpacity>
        )}
        {/* ------------------------------------------------------------- */}

        {profil.istekler && profil.istekler.length > 0 && (
            <View style={{marginBottom: 20}}>
                <Text style={styles.sectionTitle}>Bekleyen İstekler ({profil.istekler.length})</Text>
                <FlatList data={profil.istekler} renderItem={renderIstek} keyExtractor={(item:any) => item.id.toString()} horizontal={false} />
            </View>
        )}
        <Text style={styles.sectionTitle}>Gönderilerim</Text>
        <FlatList data={profil?.gonderilerim} keyExtractor={(item:any) => item.id.toString()} renderItem={renderGonderi} contentContainerStyle={{paddingBottom: 20}} ListEmptyComponent={<Text style={{textAlign:'center', color:'#999'}}>Henüz gönderin yok.</Text>} />
      </View>

      {/* MODALLARIN KODU AYNI KALIYOR (Liste ve Ayarlar Modalı) */}
      <Modal animationType="slide" transparent={true} visible={listeModalVisible} onRequestClose={() => setListeModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{listeBaslik}</Text>
                      <TouchableOpacity onPress={() => setListeModalVisible(false)}><Ionicons name="close" size={24} color="black" /></TouchableOpacity>
                  </View>
                  {listeYukleniyor ? <ActivityIndicator color={COLORS.burgundy} /> : (
                      <FlatList data={kullaniciListesi} keyExtractor={(item:any, index) => index.toString()} renderItem={renderListeElemani} ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#999'}}>Liste boş.</Text>} />
                  )}
              </View>
          </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={ayarlarModalVisible} onRequestClose={() => setAyarlarModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, {height: '80%'}]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Profili Düzenle</Text>
                      <TouchableOpacity onPress={() => setAyarlarModalVisible(false)}><Ionicons name="close" size={24} color="black" /></TouchableOpacity>
                  </View>
                  <ScrollView>
                      <TouchableOpacity onPress={resimSec} style={{alignSelf:'center', marginBottom:20}}>
                          {yeniResim 
                            ? <Image source={{ uri: yeniResim }} style={styles.avatar} /> 
                            : (profil?.profilResmi 
                                ? <Image source={{ uri: `data:image/jpeg;base64,${profil.profilResmi}` }} style={styles.avatar} />
                                : <View style={[styles.avatar, {backgroundColor:'#ccc'}]} />)
                          }
                          <Text style={{textAlign:'center', color:COLORS.burgundy, marginTop:5}}>Fotoğrafı Değiştir</Text>
                      </TouchableOpacity>
                      <Text style={styles.label}>Ad Soyad</Text>
                      <TextInput style={styles.input} value={yeniAd} onChangeText={setYeniAd} />
                      <Text style={styles.label}>Bölüm</Text>
                      <TextInput style={styles.input} value={yeniBolum} onChangeText={setYeniBolum} />
                      <Text style={styles.label}>Kullanıcı Adı (Değiştirmek için yaz)</Text>
                      <TextInput style={styles.input} value={yeniKadi} onChangeText={setYeniKadi} placeholder={profil?.kullaniciAdi || "Kullanıcı Adı"} autoCapitalize='none'/>
                      <Text style={styles.label}>Yeni Şifre (Boş bırakırsan değişmez)</Text>
                      <TextInput style={styles.input} value={yeniSifre} onChangeText={setYeniSifre} secureTextEntry placeholder="******" />
                      <TouchableOpacity onPress={profiliKaydet} style={styles.saveBtn} disabled={guncelleniyor}>
                          {guncelleniyor ? <ActivityIndicator color="white" /> : <Text style={{color:'white', fontWeight:'bold'}}>Kaydet</Text>}
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.white, padding: 20, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.burgundy, marginBottom:10 },
  editIcon: { position:'absolute', bottom:10, right:0, backgroundColor:COLORS.burgundy, width:24, height:24, borderRadius:12, justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'white' },
  profileInfo: { alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  dept: { fontSize: 14, color: COLORS.textMuted },
  settingsBtn: { marginTop:5, padding:5, borderWidth:1, borderColor:COLORS.burgundy, borderRadius:15, paddingHorizontal:15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 15 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  logoutButton: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'red', paddingVertical: 5, paddingHorizontal: 20, borderRadius: 20 },
  logoutButtonText: { color: 'red', fontWeight: '600', fontSize: 12 },
  
  // YENİ EKLENEN MENÜ BUTONLARI STİLİ (Aynen Korumalı)
  menuBtn: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2, flexDirection:'row', justifyContent:'center', gap:10 },
  menuBtnText: { fontWeight: 'bold', color: COLORS.textDark },

  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  requestCard: { backgroundColor: 'white', flexDirection: 'row', justifyContent:'space-between', alignItems:'center', padding: 10, borderRadius: 10, marginBottom: 10, elevation: 2 },
  reqAvatar: { width: 30, height: 30, borderRadius: 15 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, justifyContent:'center', alignItems:'center' },
  postCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2 },
  postText: { fontSize: 14, color: COLORS.textDark, marginBottom: 10, flex:1 },
  postImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 10 },
  postFooter: { alignItems: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', height: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth:1, borderColor:'#eee', paddingBottom:10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', justifyContent:'space-between' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontWeight: 'bold', color: COLORS.textDark },
  userDept: { fontSize: 12, color: COLORS.textMuted },
  miniBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1 },
  label: { fontSize: 14, fontWeight:'bold', marginTop:10, marginBottom:5, color: COLORS.textDark },
  input: { backgroundColor:'#f0f0f0', padding:10, borderRadius:10 },
  saveBtn: { backgroundColor: COLORS.burgundy, padding:15, borderRadius:10, alignItems:'center', marginTop:20 }
});