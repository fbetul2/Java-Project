import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../config';

const { width } = Dimensions.get('window');

const COLORS = { 
  admin: '#2d3142', 
  red: '#dc3545', 
  bg: '#f8f9fb', 
  blue: '#0d6efd', 
  green: '#198754', 
  yellow: '#ffc107',
  white: '#fff',
  gray: '#6c757d',
  softRed: '#fee2e2'
};

// --- TİPLER ---
interface CustomAlertProps {
  visible: boolean;
  type: 'SUCCESS' | 'ERROR' | 'CONFIRM' | 'INFO';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function AdminPanelScreen() {
  const router = useRouter();
  
  // --- STATE'LER ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawData, setRawData] = useState<any>({ ogrenciler: [], gonderiler: [], yorumlar: [] });
  
  // Filtreleme
  const [activeTab, setActiveTab] = useState<'KULLANICI' | 'GONDERI' | 'YORUM'>('KULLANICI');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Silme / Bildirim Modalı (İşlem Modalı)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [silmeSebebi, setSilmeSebebi] = useState('');
  const [silmeTipi, setSilmeTipi] = useState<'KULLANICI' | 'GONDERI' | 'YORUM' | null>(null);

  // --- YENİ CUSTOM ALERT STATE ---
  const [alertConfig, setAlertConfig] = useState<CustomAlertProps>({
    visible: false,
    type: 'INFO',
    title: '',
    message: '',
    onClose: () => {},
  });

  useEffect(() => { verileriCek(); }, []);

  // --- YARDIMCI FONKSİYONLAR ---
  const showCustomAlert = (type: 'SUCCESS' | 'ERROR' | 'CONFIRM' | 'INFO', title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      onConfirm: onConfirm ? () => { setAlertConfig(prev => ({ ...prev, visible: false })); onConfirm(); } : undefined
    });
  };

  const verileriCek = async () => {
    try {
        const res = await fetch(API_URLS.ADMIN_VERILER);
        const json = await res.json();
        setRawData(json);
    } catch (e) { 
        showCustomAlert('ERROR', 'Hata', 'Veriler sunucudan çekilemedi.');
    } 
    finally { setLoading(false); setRefreshing(false); }
  };

  // --- FİLTRELEME MANTIĞI ---
  const filteredData = useMemo(() => {
      if (activeTab === 'KULLANICI') {
          return rawData.ogrenciler.filter((item: any) => {
              const textMatch = (item.adSoyad + item.kadi).toLowerCase().includes(searchText.toLowerCase());
              const roleMatch = filterType === 'ALL' || item.rol === filterType;
              return textMatch && roleMatch;
          });
      } else if (activeTab === 'GONDERI') {
          return rawData.gonderiler.filter((item: any) => {
              const textMatch = (item.metin || '').toLowerCase().includes(searchText.toLowerCase());
              let typeMatch = true;
              if (filterType === 'IMAGE') typeMatch = !!item.resim;
              if (filterType === 'TEXT') typeMatch = !item.resim;
              return textMatch && typeMatch;
          });
      } else { 
          return rawData.yorumlar.filter((item: any) => {
              const textMatch = (item.icerik || '').toLowerCase().includes(searchText.toLowerCase());
              return textMatch;
          });
      }
  }, [rawData, activeTab, searchText, filterType]);

  // --- SİLME SÜREÇLERİ ---
  
  // 1. Adım: Butona basınca (Kullanıcı için)
  const kullaniciSilTalep = (id: number) => {
    showCustomAlert(
      'CONFIRM', 
      'Kullanıcıyı Sil', 
      'Bu kullanıcıyı ve tüm verilerini kalıcı olarak silmek üzeresiniz. Emin misiniz?',
      () => silIslemi(id, 'KULLANICI', 'Yönetici tarafından silindi.')
    );
  };

  // 1. Adım: Butona basınca (İçerik için - Sebebini soracağız)
  const icerikSilModalAc = (id: number, tip: 'GONDERI' | 'YORUM') => {
      setSilinecekId(id);
      setSilmeTipi(tip);
      setSilmeSebebi('');
      setActionModalVisible(true);
  };

  // 2. Adım: API İsteği
  const silIslemi = async (id: number, tip: string, sebep: string) => {
      let url = '';
      const form = new FormData();
      form.append('id', id.toString());

      if (tip === 'KULLANICI') url = API_URLS.ADMIN_KULLANICI_SIL;
      else {
          url = tip === 'GONDERI' ? API_URLS.ADMIN_GONDERI_SIL : API_URLS.ADMIN_YORUM_SIL;
          form.append('sebep', sebep); // Bu sebep arka planda bildirim olarak gidecek
      }

      try {
        const res = await fetch(url, { method: 'POST', body: form });
        if(res.ok) {
            setActionModalVisible(false); // Varsa sebep modalını kapat
            verileriCek(); 
            showCustomAlert('SUCCESS', 'Başarılı', 'İçerik başarıyla silindi ve kullanıcıya bildirim gönderildi.');
        } else {
            showCustomAlert('ERROR', 'Hata', 'Silme işlemi sırasında bir sorun oluştu.');
        }
      } catch (error) {
          showCustomAlert('ERROR', 'Bağlantı Hatası', 'Sunucuya ulaşılamadı.');
      }
  };

  // --- Render Functions (UI Parçaları) ---
  const renderStats = () => (
      <View style={styles.statsContainer}>
          <View style={[styles.statBox, {backgroundColor: COLORS.blue}]}>
              <Text style={styles.statLabel}>Öğrenci</Text>
              <Text style={styles.statNumber}>{rawData.ogrenciler.length}</Text>
          </View>
          <View style={[styles.statBox, {backgroundColor: COLORS.green}]}>
              <Text style={styles.statLabel}>Gönderi</Text>
              <Text style={styles.statNumber}>{rawData.gonderiler.length}</Text>
          </View>
          <View style={[styles.statBox, {backgroundColor: COLORS.yellow}]}>
              <Text style={[styles.statLabel, {color:'black'}]}>Yorum</Text>
              <Text style={[styles.statNumber, {color:'black'}]}>{rawData.yorumlar.length}</Text>
          </View>
      </View>
  );

  const renderItem = ({ item }: { item: any }) => {
      // ... KULLANICI KARTI ...
      if (activeTab === 'KULLANICI') {
          return (
            <View style={styles.card}>
                <View style={{flexDirection:'row', alignItems:'center', flex:1}}>
                    {item.resim ? (
                        <Image source={{uri: `data:image/jpeg;base64,${item.resim}`}} style={styles.avatar} />
                    ) : (
                        <View style={styles.placeholder}><Text style={{color:'white', fontWeight:'bold'}}>{item.adSoyad.charAt(0)}</Text></View>
                    )}
                    <View style={{marginLeft:10, flex:1}}>
                        <Text style={{fontWeight:'bold', color:'#333'}}>{item.adSoyad}</Text>
                        <Text style={{fontSize:12, color:'#888'}}>@{item.kadi}</Text>
                        <View style={{marginTop:4, flexDirection:'row'}}>
                            <View style={[styles.badge, item.rol === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser]}>
                                <Text style={{fontSize:10, color:'white', fontWeight:'bold'}}>{item.rol === 'ADMIN' ? 'YÖNETİCİ' : 'ÖĞRENCİ'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                {item.rol !== 'ADMIN' && (
                    <TouchableOpacity onPress={() => kullaniciSilTalep(item.id)} style={styles.delBtn}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                    </TouchableOpacity>
                )}
            </View>
          );
      } 
      // ... GÖNDERİ KARTI ...
      else if (activeTab === 'GONDERI') {
          return (
            <View style={styles.card}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
                         <Ionicons name="person-circle-outline" size={16} color={COLORS.blue} />
                         <Text style={{fontWeight:'bold', fontSize:13, color: COLORS.blue, marginLeft:4}}>{item.yazar}</Text>
                    </View>
                    <Text numberOfLines={2} style={{color:'#444', marginBottom:5}}>{item.metin || '(Sadece Görsel)'}</Text>
                    {item.resim && (
                        <View style={styles.mediaTag}>
                            <Ionicons name="image-outline" size={12} color="#666" />
                            <Text style={{fontSize:10, color:'#666', marginLeft:4}}>Görsel İçerik</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => icerikSilModalAc(item.id, 'GONDERI')} style={styles.actionBtn}>
                    <Text style={{color: COLORS.white, fontSize:11, fontWeight:'bold'}}>KALDIR</Text>
                </TouchableOpacity>
            </View>
          );
      } 
      // ... YORUM KARTI ...
      else {
          return (
            <View style={styles.card}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
                        <Ionicons name="chatbubble-outline" size={14} color={COLORS.yellow} />
                        <Text style={{fontWeight:'bold', fontSize:13, color: '#666', marginLeft:5}}>{item.yazar}</Text>
                    </View>
                    <Text numberOfLines={3} style={{color:'#333'}}>{item.icerik}</Text>
                </View>
                <TouchableOpacity onPress={() => icerikSilModalAc(item.id, 'YORUM')} style={styles.actionBtn}>
                    <Text style={{color: COLORS.white, fontSize:11, fontWeight:'bold'}}>KALDIR</Text>
                </TouchableOpacity>
            </View>
          );
      }
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor: COLORS.bg}}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yönetim Paneli</Text>
        <View style={{width:40}} />
      </View>

      {/* STATS */}
      {renderStats()}

      {/* TAB MENU */}
      <View style={styles.tabContainer}>
          {['KULLANICI', 'GONDERI', 'YORUM'].map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => {setActiveTab(tab as any); setFilterType('ALL'); setSearchText('');}} 
                style={[styles.tabBtn, activeTab === tab && styles.activeTab]}
              >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                      {tab === 'KULLANICI' ? 'Kullanıcılar' : tab === 'GONDERI' ? 'Gönderiler' : 'Yorumlar'}
                  </Text>
              </TouchableOpacity>
          ))}
      </View>

      {/* ARAMA VE FİLTRE */}
      <View style={styles.filterContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" style={{marginRight:5}} />
            <TextInput 
                style={{flex:1, height:'100%'}} 
                placeholder="Ara..." 
                value={searchText}
                onChangeText={setSearchText}
            />
          </View>
          
          {/* Kullanıcı Filtreleri */}
          {activeTab === 'KULLANICI' && (
             <View style={{flexDirection:'row', gap:5}}>
                {['ALL', 'ADMIN', 'USER'].map(ft => (
                    <TouchableOpacity key={ft} onPress={()=>setFilterType(ft)} style={[styles.filterBtn, filterType===ft && styles.activeFilter]}>
                        <Text style={[styles.filterText, filterType===ft && styles.activeFilterText]}>
                            {ft==='ALL'?'Tümü':ft==='ADMIN'?'Yön.':'Öğr.'}
                        </Text>
                    </TouchableOpacity>
                ))}
             </View>
          )}
          {/* Gönderi Filtreleri */}
          {activeTab === 'GONDERI' && (
             <View style={{flexDirection:'row', gap:5}}>
                <TouchableOpacity onPress={()=>setFilterType('ALL')} style={[styles.filterBtn, filterType==='ALL' && styles.activeFilter]}>
                    <Text style={[styles.filterText, filterType==='ALL' && styles.activeFilterText]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setFilterType('IMAGE')} style={[styles.filterBtn, filterType==='IMAGE' && styles.activeFilter]}>
                    <Ionicons name="image" size={16} color={filterType==='IMAGE'?'white':'#666'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setFilterType('TEXT')} style={[styles.filterBtn, filterType==='TEXT' && styles.activeFilter]}>
                    <Ionicons name="text" size={16} color={filterType==='TEXT'?'white':'#666'} />
                </TouchableOpacity>
             </View>
          )}
      </View>

      {/* LİSTE */}
      {loading ? <ActivityIndicator size="large" color={COLORS.admin} style={{marginTop:50}} /> : (
          <FlatList 
            data={filteredData} 
            renderItem={renderItem} 
            keyExtractor={(item:any) => item.id.toString()}
            contentContainerStyle={{padding:15, paddingBottom: 100}}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); verileriCek();}} />}
            ListEmptyComponent={
                <View style={{alignItems:'center', marginTop:50}}>
                    <Ionicons name="file-tray-outline" size={40} color="#ccc" />
                    <Text style={{color:'#999', marginTop:10}}>Kayıt bulunamadı.</Text>
                </View>
            }
          />
      )}

      {/* --- MODAL: İÇERİK SİLME VE BİLDİRİM --- */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <View style={[styles.iconCircle, {backgroundColor: COLORS.softRed}]}>
                        <Ionicons name="notifications" size={24} color={COLORS.red} />
                      </View>
                      <Text style={styles.modalTitle}>İçerik Kaldırılıyor</Text>
                  </View>
                  
                  <Text style={styles.modalDesc}>
                      Bu içerik yayından kaldırılacak. Kullanıcıya işlemin sebebini açıklayan bir bildirim gönderilecektir.
                  </Text>
                  
                  <Text style={styles.label}>Kullanıcıya Gidecek Bildirim:</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Örn: Topluluk kuralları 3. madde ihlali (Küfür/Hakaret)" 
                    value={silmeSebebi}
                    onChangeText={setSilmeSebebi}
                    multiline
                  />
                  
                  <View style={styles.modalButtons}>
                      <TouchableOpacity onPress={() => setActionModalVisible(false)} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>Vazgeç</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.confirmBtn}
                        onPress={() => silIslemi(silinecekId!, silmeTipi!, silmeSebebi || 'Topluluk kurallarına aykırı içerik.')}
                      >
                          <Text style={styles.confirmBtnText}>Bildir ve Sil</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* --- CUSTOM ALERT (YENİ UYARI PENCERESİ) --- */}
      <Modal visible={alertConfig.visible} transparent animationType="fade">
         <View style={styles.alertOverlay}>
             <View style={styles.alertBox}>
                 <View style={[styles.alertIcon, { 
                     backgroundColor: alertConfig.type === 'ERROR' ? COLORS.softRed : alertConfig.type === 'SUCCESS' ? '#d1e7dd' : '#fff3cd' 
                 }]}>
                     <Ionicons 
                        name={alertConfig.type === 'ERROR' ? "alert-circle" : alertConfig.type === 'SUCCESS' ? "checkmark-circle" : "help-circle"} 
                        size={32} 
                        color={alertConfig.type === 'ERROR' ? COLORS.red : alertConfig.type === 'SUCCESS' ? COLORS.green : COLORS.yellow} 
                     />
                 </View>
                 <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                 <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                 
                 <View style={styles.alertBtnContainer}>
                     {alertConfig.type === 'CONFIRM' && (
                         <TouchableOpacity onPress={alertConfig.onClose} style={[styles.alertBtn, {backgroundColor: '#eee'}]}>
                             <Text style={{color:'#666', fontWeight:'600'}}>Vazgeç</Text>
                         </TouchableOpacity>
                     )}
                     <TouchableOpacity 
                        onPress={alertConfig.onConfirm ? alertConfig.onConfirm : alertConfig.onClose} 
                        style={[styles.alertBtn, {backgroundColor: alertConfig.type==='ERROR' ? COLORS.red : COLORS.admin}]}
                     >
                         <Text style={{color:'white', fontWeight:'600'}}>
                             {alertConfig.type === 'CONFIRM' ? 'Evet, Onayla' : 'Tamam'}
                         </Text>
                     </TouchableOpacity>
                 </View>
             </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:15, backgroundColor: COLORS.admin, alignItems:'center' },
    backBtn: { width:40, height:40, justifyContent:'center', alignItems:'center' },
    headerTitle: { color:'white', fontWeight:'bold', fontSize:18 },
    
    statsContainer: { flexDirection:'row', padding:10, justifyContent:'space-between' },
    statBox: { flex:1, margin:5, padding:15, borderRadius:12, alignItems:'center', justifyContent:'center', elevation:3, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4 },
    statNumber: { color:'white', fontSize:22, fontWeight:'bold', marginTop:5 },
    statLabel: { color:'rgba(255,255,255,0.9)', fontSize:12, fontWeight:'600' },

    tabContainer: { flexDirection:'row', backgroundColor:'white', paddingHorizontal:10 },
    tabBtn: { flex:1, paddingVertical:15, alignItems:'center', borderBottomWidth:2, borderColor:'transparent' },
    activeTab: { borderColor: COLORS.admin },
    tabText: { color:'#999', fontWeight:'600', fontSize:14 },
    activeTabText: { color: COLORS.admin },

    filterContainer: { padding:10, backgroundColor:'white', flexDirection:'row', alignItems:'center', gap:10, borderBottomWidth:1, borderColor:'#eee' },
    searchBox: { flex:1, backgroundColor:'#f1f3f5', borderRadius:10, paddingHorizontal:10, height:40, flexDirection:'row', alignItems:'center' },
    filterBtn: { paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor:'#f1f3f5', minWidth:35, alignItems:'center' },
    activeFilter: { backgroundColor: COLORS.admin },
    filterText: { fontSize:12, color:'#666', fontWeight:'600' },
    activeFilterText: { color:'white' },

    card: { backgroundColor:'white', padding:15, borderRadius:12, marginBottom:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:2 },
    avatar: { width:42, height:42, borderRadius:21, borderWidth:1, borderColor:'#eee' },
    placeholder: { width:42, height:42, borderRadius:21, backgroundColor: COLORS.admin, justifyContent:'center', alignItems:'center' },
    badge: { paddingHorizontal:8, paddingVertical:3, borderRadius:6, marginTop:2 },
    badgeAdmin: { backgroundColor: COLORS.red },
    badgeUser: { backgroundColor: COLORS.blue },
    mediaTag: { flexDirection:'row', alignItems:'center', backgroundColor:'#f8f9fa', alignSelf:'flex-start', padding:4, borderRadius:4, marginTop:4 },

    delBtn: { padding:10, backgroundColor: COLORS.softRed, borderRadius:10 },
    actionBtn: { paddingHorizontal:15, paddingVertical:8, borderRadius:8, backgroundColor: COLORS.admin },

    // MODAL STYLES
    modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', padding:20 },
    modalContent: { backgroundColor:'white', borderRadius:20, padding:20 },
    modalHeader: { flexDirection:'row', alignItems:'center', marginBottom:15 },
    iconCircle: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', marginRight:10 },
    modalTitle: { fontSize:18, fontWeight:'bold', color:'#333' },
    modalDesc: { color:'#666', marginBottom:20, lineHeight:20 },
    label: { fontWeight:'bold', marginBottom:8, color:'#333' },
    input: { backgroundColor:'#f9f9f9', borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, height:80, textAlignVertical:'top', marginBottom:20, fontSize:14 },
    modalButtons: { flexDirection:'row', gap:12 },
    cancelBtn: { flex:1, padding:14, borderRadius:12, backgroundColor:'#f1f3f5', alignItems:'center' },
    cancelBtnText: { color:'#333', fontWeight:'bold' },
    confirmBtn: { flex:1, padding:14, borderRadius:12, backgroundColor: COLORS.red, alignItems:'center' },
    confirmBtnText: { color:'white', fontWeight:'bold' },

    // CUSTOM ALERT STYLES
    alertOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', padding:20 },
    alertBox: { width:'100%', maxWidth:340, backgroundColor:'white', borderRadius:20, padding:24, alignItems:'center', elevation:5 },
    alertIcon: { width:60, height:60, borderRadius:30, justifyContent:'center', alignItems:'center', marginBottom:16 },
    alertTitle: { fontSize:20, fontWeight:'bold', color:'#2d3142', marginBottom:8 },
    alertMessage: { fontSize:14, color:'#6c757d', textAlign:'center', marginBottom:24, lineHeight:20 },
    alertBtnContainer: { flexDirection:'row', gap:12, width:'100%' },
    alertBtn: { flex:1, paddingVertical:14, borderRadius:12, alignItems:'center', justifyContent:'center' }
});