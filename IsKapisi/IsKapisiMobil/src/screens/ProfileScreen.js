import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { aiService, authService } from '../api/api';

// Renk Sabiti (Lacivert)
const PRIMARY_COLOR = '#1e3a8a';
// Profil Avatar Arkaplanı için Açık Lacivert
const LIGHT_PRIMARY_COLOR = '#dbeafe';

const ProfileScreen = ({ user, onLogout, onBack, onUpdateSuccess }) => {
  
  // --- BİLDİRİM STATE'LERİ ---
  const [bildirimler, setBildirimler] = useState([]);
  const [bildirimModalVisible, setBildirimModalVisible] = useState(false);

  // --- ORTAK ALANLAR ---
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState(''); 
  
  // --- İŞ ARAYAN ALANLARI ---
  const [ad, setAd] = useState('');
  const [meslek, setMeslek] = useState('');
  const [ozetBilgi, setOzetBilgi] = useState('');
  const [cvDosya, setCvDosya] = useState(null);
  const [mevcutCvAdi, setMevcutCvAdi] = useState('');
  
  // RESİM STATE'LERİ
  const [profilResmi, setProfilResmi] = useState(null); 
  const [mevcutProfilResmiBase64, setMevcutProfilResmiBase64] = useState(null); 

  // --- İŞVEREN ALANLARI ---
  const [sirketAdi, setSirketAdi] = useState('');
  const [webSitesi, setWebSitesi] = useState('');
  const [hakkimizda, setHakkimizda] = useState('');
  const [adres, setAdres] = useState('');
  const [logo, setLogo] = useState(null);
  const [mevcutLogoBase64, setMevcutLogoBase64] = useState(null);
  
  // HARİTA KONUMU
  const [konum, setKonum] = useState(null); 

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // --- 1. VERİLERİ VE BİLDİRİMLERİ ÇEK ---
  const profilVeBildirimleriGetir = async () => {
      if (!user) return;
      setFetching(true);
      try {
          const data = await authService.getProfile(user.id);

          setEmail(data.email || '');
          setTelefon(data.telefon || '');

          if (data.rol === 'ISVEREN') {
              setSirketAdi(data.sirketAdi || '');
              setWebSitesi(data.webSitesi || '');
              setHakkimizda(data.hakkimizda || '');
              setAdres(data.adres || '');
              if (data.logoBase64) setMevcutLogoBase64(data.logoBase64);
              if (data.enlem && data.boylam) {
                  setKonum({
                      latitude: data.enlem,
                      longitude: data.boylam,
                      latitudeDelta: 0.01, longitudeDelta: 0.01,
                  });
              }
          } else {
              setAd(data.ad || '');
              setMeslek(data.meslek || '');
              setOzetBilgi(data.ozetBilgi || '');
              if (data.cvDosyaAdi) setMevcutCvAdi(data.cvDosyaAdi);
              
              if (data.profilResmiBase64) {
                  setMevcutProfilResmiBase64(data.profilResmiBase64);
              }
          }

          const bildirimData = await authService.getNotifications(user.id);
          setBildirimler(bildirimData || []);

      } catch (error) {
          console.error("Profil/Bildirim hatası:", error);
      } finally {
          setFetching(false);
      }
  };

  useFocusEffect(
      useCallback(() => {
          profilVeBildirimleriGetir();
      }, [user])
  );

  const handleMapPress = (e) => {
      setKonum({ ...e.nativeEvent.coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  };

  const handleSelectCV = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
          if (!result.canceled && result.assets) setCvDosya(result.assets[0]);
      } catch (err) { console.log(err); }
  };

  // --- LOGO SEÇİMİ (İŞVEREN) ---
  const handleSelectLogo = async () => {
      try {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
              return;
          }

          // DÜZELTME: MediaTypeOptions.Images kullanıldı (Çökme sorunu çözüldü)
          const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images, 
              allowsEditing: true, 
              aspect: [1, 1], 
              quality: 0.5,
          });
          if (!result.canceled) setLogo(result.assets[0]);
      } catch (err) { console.log(err); }
  };

  // --- PROFİL RESMİ SEÇİMİ (İŞ ARAYAN) ---
  const handleSelectProfilResmi = async () => {
      try {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
              return;
          }

          // DÜZELTME: MediaTypeOptions.Images kullanıldı (Çökme sorunu çözüldü)
          const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true, 
              aspect: [1, 1], 
              quality: 0.5,
          });
          
          if (!result.canceled) {
              setProfilResmi(result.assets[0]); 
          }
      } catch (err) { 
          console.log("Resim Seçme Hatası:", err);
          Alert.alert("Hata", "Resim seçilemedi.");
      }
  };

  const handleUpdate = async () => {
      setLoading(true);
      const formData = new FormData();
      formData.append('id', user.id);
      formData.append('telefon', telefon);

      if (user?.rol === 'IS_ARAYAN') {
          formData.append('ad', ad);
          formData.append('meslek', meslek);
          formData.append('ozetBilgi', ozetBilgi);
          
          if (cvDosya) {
              formData.append('cvDosya', { 
                  uri: cvDosya.uri, 
                  name: cvDosya.name || 'cv.pdf', 
                  type: 'application/pdf' 
              });
          }
          
          if (profilResmi) {
              // --- DÜZELTME: Resim verisini sağlamlaştırdık ---
              // Dosya uzantısını URI'den alıyoruz
              let uri = profilResmi.uri;
              let filename = uri.split('/').pop();

              // Dosya uzantısını kontrol et, yoksa .jpg ekle
              let match = /\.(\w+)$/.exec(filename);
              let type = match ? `image/${match[1]}` : `image/jpeg`;

              // iOS için uri düzeltmesi (gerekirse)
              if (Platform.OS === 'ios') {
                  uri = uri.replace('file://', '');
              }

              formData.append('profilResmi', { 
                  uri: uri, 
                  name: filename || 'profil_resmi.jpg',
                  type: type
              });
          }

      } else if (user?.rol === 'ISVEREN') {
          formData.append('sirketAdi', sirketAdi);
          formData.append('webSitesi', webSitesi);
          formData.append('hakkimizda', hakkimizda);
          formData.append('adres', adres);
          formData.append('enlem', konum ? konum.latitude : 0);
          formData.append('boylam', konum ? konum.longitude : 0);
          
          if (logo) {
              let uri = logo.uri;
              let filename = uri.split('/').pop();
              let match = /\.(\w+)$/.exec(filename);
              let type = match ? `image/${match[1]}` : `image/jpeg`;

              if (Platform.OS === 'ios') {
                  uri = uri.replace('file://', '');
              }

              formData.append('logoDosya', { 
                  uri: uri, 
                  name: filename || 'logo.jpg', 
                  type: type 
              });
          }
      }

      try {
          // api.js içindeki updateProfile fonksiyonunun doğru çalıştığından emin ol
          const updatedData = await authService.updateProfile(formData);
          Alert.alert("Başarılı", "Profiliniz güncellendi! ✅");
          
          // Seçilenleri sıfırla ki backend'den gelen görünsün
          setProfilResmi(null); 
          setLogo(null);
          
          // Güncel veriyi çek
          profilVeBildirimleriGetir();
          
          if (onUpdateSuccess) onUpdateSuccess(updatedData);
      } catch (error) {
          console.error(error);
          Alert.alert("Hata", "Güncelleme başarısız oldu.");
      } finally {
          setLoading(false);
      }
  };

  const renderLogo = () => {
      if (logo) return { uri: logo.uri };
      if (mevcutLogoBase64) return { uri: `data:image/jpeg;base64,${mevcutLogoBase64}` };
      return null;
  };

  const renderProfilResmi = () => {
      if (profilResmi && profilResmi.uri) {
          return { uri: profilResmi.uri };
      }
      if (mevcutProfilResmiBase64) {
          const imageUri = mevcutProfilResmiBase64.startsWith('data:') 
              ? mevcutProfilResmiBase64 
              : `data:image/jpeg;base64,${mevcutProfilResmiBase64}`;
          return { uri: imageUri };
      }
      return null;
  };

  const handleBildirimSil = async (id) => {
      try {
          await authService.deleteNotification(id);
          setBildirimler(prev => prev.filter(b => b.id !== id));
      } catch (e) { console.log(e); }
  };

  const [cvAnalizModalVisible, setCvAnalizModalVisible] = useState(false);
  const [cvAnaliz, setCvAnaliz] = useState('');
  const [cvAnalizLoading, setCvAnalizLoading] = useState(false);

  const handleCVAnaliz = async () => {
      if (!user || user.rol !== 'IS_ARAYAN') {
          Alert.alert("Uyarı", "Bu özellik sadece iş arayanlar için.");
          return;
      }
      setCvAnalizLoading(true);
      setCvAnalizModalVisible(true);
      try {
          const response = await aiService.getCVAnaliz(user.id);
          setCvAnaliz(response.analiz || response || "Analiz oluşturulamadı.");
      } catch (error) {
          console.error("CV Analiz hatası:", error);
          const errorMessage = error.response?.data || "Yapay zeka servisine ulaşılamadı.";
          setCvAnaliz(typeof errorMessage === 'string' ? errorMessage : "Yapay zeka servisine ulaşılamadı.");
      } finally {
          setCvAnalizLoading(false);
      }
  };

  if (fetching) return (<View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color={PRIMARY_COLOR} /></View>);

  return (
      <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.header}>
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                   <Ionicons name="arrow-back" size={24} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profil Ayarları</Text>
              
              <TouchableOpacity onPress={() => setBildirimModalVisible(true)} style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={24} color="#1e293b" />
                  {bildirimler.length > 0 && (
                      <View style={styles.badge}>
                          <Text style={styles.badgeText}>{bildirimler.length}</Text>
                      </View>
                  )}
              </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.profileCard}>
                  {user?.rol === 'ISVEREN' ? (
                      <TouchableOpacity onPress={handleSelectLogo}>
                          <View style={[styles.avatarContainer, {borderRadius: 15}]}>
                              {renderLogo() ? (<Image source={renderLogo()} style={{width: '100%', height: '100%', borderRadius: 15}} />) : (<Ionicons name="business" size={40} color={PRIMARY_COLOR} />)}
                              <View style={styles.editIconBadge}><Ionicons name="camera" size={14} color="white" /></View>
                          </View>
                      </TouchableOpacity>
                  ) : (
                      <TouchableOpacity onPress={handleSelectProfilResmi}>
                          <View style={styles.avatarContainer}>
                              {renderProfilResmi() ? (
                                  <Image source={renderProfilResmi()} style={{width: '100%', height: '100%', borderRadius: 45}} />
                              ) : (
                                  <Text style={styles.avatarText}>{ad ? ad.charAt(0).toUpperCase() : (user.isim ? user.isim.charAt(0).toUpperCase() : "U")}</Text>
                              )}
                              <View style={styles.editIconBadge}><Ionicons name="camera" size={14} color="white" /></View>
                          </View>
                      </TouchableOpacity>
                  )}
                  <Text style={styles.userName}>{user?.rol === 'ISVEREN' ? sirketAdi || 'Şirket Adı' : ad || 'Kullanıcı'}</Text>
                  <Text style={styles.userRole}>{user?.rol === 'ISVEREN' ? 'İşveren Hesabı' : meslek || 'İş Arayan'}</Text>
              </View>

              <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
                  <View style={styles.inputGroup}><Text style={styles.label}>E-Posta</Text><TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} /></View>
                  <View style={styles.inputGroup}><Text style={styles.label}>Telefon</Text><TextInput style={styles.input} value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" /></View>

                  {user?.rol === 'IS_ARAYAN' && (
                      <>
                          <View style={styles.divider} /><Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
                          <View style={styles.inputGroup}><Text style={styles.label}>Ad Soyad</Text><TextInput style={styles.input} value={ad} onChangeText={setAd} /></View>
                          <View style={styles.inputGroup}><Text style={styles.label}>Meslek</Text><TextInput style={styles.input} value={meslek} onChangeText={setMeslek} /></View>
                          <View style={styles.inputGroup}><Text style={styles.label}>Hakkımda</Text><TextInput style={[styles.input, styles.textArea]} value={ozetBilgi} onChangeText={setOzetBilgi} multiline /></View>
                          <View style={styles.inputGroup}>
                              <Text style={styles.label}>CV Yükle</Text>
                              <TouchableOpacity style={styles.uploadBox} onPress={handleSelectCV}>
                                  <Ionicons name="cloud-upload-outline" size={32} color={PRIMARY_COLOR} />
                                  <Text style={styles.uploadText}>{cvDosya ? cvDosya.name : "CV Seç"}</Text>
                                  {mevcutCvAdi && !cvDosya && <Text style={styles.existingFile}>📄 {mevcutCvAdi}</Text>}
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                  style={styles.aiButton} 
                                  onPress={handleCVAnaliz}
                                  disabled={cvAnalizLoading}
                              >
                                  <Ionicons name="sparkles" size={20} color="#f59e0b" />
                                  <Text style={styles.aiButtonText}>
                                      {cvAnalizLoading ? 'Analiz Yapılıyor...' : '✨ Yapay Zeka ile CV Analizi'}
                                  </Text>
                              </TouchableOpacity>
                          </View>
                      </>
                  )}

                  {user?.rol === 'ISVEREN' && (
                      <>
                          <View style={styles.divider} /><Text style={styles.sectionTitle}>Şirket Bilgileri</Text>
                          <View style={styles.inputGroup}><Text style={styles.label}>Şirket Adı</Text><TextInput style={styles.input} value={sirketAdi} onChangeText={setSirketAdi} /></View>
                          
                          {/* KALDIRILAN ALANLAR: Web Sitesi, Adres, Hakkımızda */}
                          
                          <View style={styles.inputGroup}><Text style={styles.label}>Konum Seç</Text><View style={styles.mapContainer}><MapView style={styles.map} initialRegion={konum || { latitude: 39.9334, longitude: 32.8597, latitudeDelta: 5, longitudeDelta: 5 }} region={konum} onPress={handleMapPress}>{konum && <Marker coordinate={konum} title="Şirket Konumu" />}</MapView>{!konum && <Text style={styles.mapHint}>Haritaya dokunun.</Text>}</View></View>
                      </>
                  )}

                  <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>{loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Güncelle</Text>}</TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onLogout} style={styles.logoutTextButton}><Text style={styles.logoutText}>Hesaptan Çıkış Yap</Text></TouchableOpacity>
          </ScrollView>

          <Modal animationType="slide" transparent={true} visible={bildirimModalVisible} onRequestClose={() => setBildirimModalVisible(false)}>
              <View style={styles.modalOverlay}>
                  <View style={styles.modalView}>
                      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                          <Text style={styles.modalTitle}>Bildirimler 🔔</Text>
                          <TouchableOpacity onPress={() => setBildirimModalVisible(false)}><Ionicons name="close" size={24} color="#1e293b" /></TouchableOpacity>
                      </View>
                      {bildirimler.length === 0 ? (
                          <Text style={{textAlign:'center', color:'#94a3b8', marginVertical:20}}>Henüz bildirim yok.</Text>
                      ) : (
                          <FlatList
                              data={bildirimler}
                              keyExtractor={(item) => item.id.toString()}
                              renderItem={({ item }) => (
                                  <View style={styles.notificationItem}>
                                      <View style={{flex:1}}>
                                          <Text style={styles.notificationText}>{item.mesaj}</Text>
                                          <Text style={styles.notificationDate}>{new Date(item.tarih).toLocaleDateString()}</Text>
                                      </View>
                                      <TouchableOpacity onPress={() => handleBildirimSil(item.id)}>
                                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                      </TouchableOpacity>
                                  </View>
                              )}
                          />
                      )}
                  </View>
              </View>
          </Modal>

          <Modal animationType="slide" transparent={true} visible={cvAnalizModalVisible} onRequestClose={() => setCvAnalizModalVisible(false)}>
              <View style={styles.modalOverlay}>
                  <View style={styles.modalView}>
                      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                          <Text style={styles.modalTitle}>✨ CV Analizi ve Kariyer Tavsiyesi</Text>
                          <TouchableOpacity onPress={() => setCvAnalizModalVisible(false)}>
                              <Ionicons name="close" size={24} color="#1e293b" />
                          </TouchableOpacity>
                      </View>
                      {cvAnalizLoading ? (
                          <View style={{alignItems:'center', padding:20}}>
                              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                              <Text style={{marginTop:10, color:'#64748b'}}>Yapay zeka analiz yapıyor...</Text>
                          </View>
                      ) : (
                          <ScrollView style={{maxHeight:400}}>
                              <Text style={styles.analizText}>{cvAnaliz}</Text>
                          </ScrollView>
                      )}
                  </View>
              </View>
          </Modal>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  iconButton: { padding: 5 },
  badge: { position:'absolute', top:0, right:0, backgroundColor:'#ef4444', borderRadius:10, width:18, height:18, justifyContent:'center', alignItems:'center' },
  badgeText: { color:'white', fontSize:10, fontWeight:'bold' },
  content: { padding: 20 },
  profileCard: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: LIGHT_PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: '#fff', shadowColor:'#000', shadowOpacity:0.1, shadowRadius:10, elevation:5 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: PRIMARY_COLOR },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: PRIMARY_COLOR, width: 28, height: 28, borderRadius: 14, justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'white' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  userRole: { fontSize: 14, color: '#64748b', marginTop: 5 },
  formSection: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 2, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 16, color: '#334155' },
  disabledInput: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  textArea: { height: 120, textAlignVertical: 'top' },
  uploadBox: { borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: '#f8fafc' },
  uploadText: { color: PRIMARY_COLOR, marginTop: 10, fontWeight: '600', textAlign: 'center' },
  existingFile: { fontSize: 12, color: '#166534', marginTop: 5, fontWeight: '600' },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  map: { width: '100%', height: '100%' },
  mapHint: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.8)', padding: 5, borderRadius: 5, fontSize: 12, color: '#64748b' },
  saveButton: { backgroundColor: PRIMARY_COLOR, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: PRIMARY_COLOR, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  logoutTextButton: { marginTop: 10, alignItems: 'center', marginBottom: 40 },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  notificationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  notificationText: { fontSize: 14, color: '#334155', flex: 1, marginRight: 10 },
  notificationDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbeb', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#fcd34d' },
  aiButtonText: { marginLeft: 8, color: '#d97706', fontWeight: '700', fontSize: 14 },
  analizText: { fontSize: 14, color: '#334155', lineHeight: 22, padding: 10 }
});

export default ProfileScreen;