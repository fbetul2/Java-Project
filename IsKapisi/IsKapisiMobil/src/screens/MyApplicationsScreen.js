import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { basvuruService } from '../api/api';

// Renk Sabiti (Lacivert)
const PRIMARY_COLOR = '#1e3a8a';

// DÜZELTME BURADA: Index.tsx'ten gelen user, onBack ve onIlanClick props olarak eklendi
const MyApplicationsScreen = ({ user, onBack, onIlanClick }) => {
  
  // navigation hook'unu kaldırdık çünkü navigasyonu Index.tsx yönetiyor
  
  const [basvurular, setBasvurular] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
        fetchData();
    }, [user]) // user değişirse tekrar çalışsın
  );

  const fetchData = async () => {
    // DÜZELTME: AsyncStorage yerine direkt prop'tan gelen user'ı kullanıyoruz (Daha hızlı)
    if (user) {
        setLoading(true);
        try {
            // Backend'deki /listele/{kullaniciId} endpoint'ine gider
            const data = await basvuruService.getMyBasvurular(user.id);
            setBasvurular(data);
        } catch (error) {
            console.error("Veri hatası:", error);
        } finally {
            setLoading(false);
        }
    }
  };

  // --- NAVİGASYON FONKSİYONU ---
  const handleGoToDetail = (item) => {
    const targetId = item.ilanId;

    if (targetId) {
        console.log("✅ İlan Detayına Gidiliyor ID:", targetId);
        // DÜZELTME: Index.tsx'ten gelen fonksiyonu tetikliyoruz
        if (onIlanClick) {
            onIlanClick(targetId);
        }
    } else {
        Alert.alert("Hata", "İlan ID'si veride bulunamadı.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString; 
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
        
        {/* --- HEADER: Başlık ve Şirket --- */}
        <View style={styles.cardHeader}>
            <View style={{flex: 1}}>
                <Text style={styles.jobTitle}>{item.isBasligi}</Text>
                <Text style={styles.companyName}>{item.sirketAdi}</Text>
            </View>
            
            {/* --- DURUM BADGE --- */}
            <View style={[
                styles.badge, 
                item.durum === 'MULAKAT' ? styles.badgeWarning : 
                item.durum === 'REDDEDILDI' ? styles.badgeDanger : 
                item.durum === 'KABUL_EDILDI' ? styles.badgeSuccess : styles.badgeInfo
            ]}>
                <Text style={[
                    styles.badgeText,
                    item.durum === 'MULAKAT' ? {color: '#ea580c'} : 
                    item.durum === 'REDDEDILDI' ? {color: '#991b1b'} : 
                    item.durum === 'KABUL_EDILDI' ? {color: '#166534'} : {color: '#64748b'}
                ]}>
                    {item.durum === 'BEKLEMEDE' ? 'Sonuç Bekleniyor' : 
                     item.durum === 'MULAKAT' ? '📅 Mülakat!' : 
                     item.durum === 'REDDEDILDI' ? 'Olumsuz' : 
                     item.durum === 'KABUL_EDILDI' ? 'Kabul Edildi' : item.durum}
                </Text>
            </View>
        </View>

        {/* --- HTML: TURUNCU KUTU (Mülakat) --- */}
        {item.durum === 'MULAKAT' && (
            <View style={styles.interviewBox}>
                <Text style={styles.interviewTitle}>Tebrikler, Mülakata Çağrıldınız!</Text>
                
                <View style={styles.row}>
                    <Text style={styles.interviewDate}>
                        🕒 {item.mulakatTarihi ? item.mulakatTarihi : "Tarih Bekleniyor"}
                    </Text>
                </View>

                {item.isverenNotu && (
                    <Text style={styles.interviewNote}>
                        Not: {item.isverenNotu}
                    </Text>
                )}
            </View>
        )}

        {/* --- HTML: KIRMIZI KUTU (Red) --- */}
        {item.durum === 'REDDEDILDI' && (
            <View style={styles.rejectBox}>
                <Text style={styles.rejectTitle}>Başvuru Sonucu: Olumsuz</Text>
                {item.isverenNotu && (
                    <Text style={styles.rejectNote}>"{item.isverenNotu}"</Text>
                )}
            </View>
        )}

        {/* --- FOOTER: Tarih ve Buton --- */}
        <View style={styles.cardFooter}>
            <Text style={styles.dateText}>
                Başvuru: <Text style={{fontWeight:'600'}}>{item.basvuruTarihi ? item.basvuruTarihi.split(' ')[0] : ''}</Text>
            </Text>
            
            <TouchableOpacity 
                style={styles.detailBtn}
                onPress={() => handleGoToDetail(item)}
            >
                <Text style={styles.detailBtnText}>İlanı Görüntüle</Text>
                {/* Renk Güncellemesi: PRIMARY_COLOR */}
                <Ionicons name="chevron-forward" size={16} color={PRIMARY_COLOR} />
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
            {/* DÜZELTME: onBack propunu kullanıyoruz */}
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Başvurularım</Text>
            <View style={{width: 30}} />
        </View>

        {loading ? (
            // Renk Güncellemesi: PRIMARY_COLOR
            <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{marginTop: 50}} />
        ) : (
            <FlatList
                data={basvurular}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Henüz hiçbir ilana başvurmadınız.</Text>
                        <TouchableOpacity 
                            style={styles.browseBtn}
                            onPress={onBack} // DÜZELTME: İlanlara dönmek için onBack kullanıyoruz
                        >
                            <Text style={styles.browseBtnText}>İlanlara Göz At</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        )}
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  backButton: { padding: 5 },
  listContent: { padding: 20 },

  // KART
  card: { 
      backgroundColor: 'white', 
      borderRadius: 16, 
      padding: 15, 
      marginBottom: 15, 
      shadowColor: '#000', 
      shadowOpacity: 0.05, 
      shadowRadius: 5, 
      elevation: 2, 
      borderWidth: 1, 
      borderColor: '#f1f5f9' 
  },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  companyName: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  // ROZETLER
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  badgeInfo: { backgroundColor: '#f1f5f9' },
  badgeWarning: { backgroundColor: '#fff7ed' },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

  // TURUNCU KUTU (Mülakat) - HTML
  interviewBox: { 
      backgroundColor: '#fff7ed', 
      padding: 15, 
      borderRadius: 10, 
      marginBottom: 15, 
      borderLeftWidth: 5, 
      borderLeftColor: '#ea580c' 
  },
  interviewTitle: { color: '#9a3412', fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  interviewDate: { color: '#ea580c', fontWeight: '700', fontSize: 13 },
  interviewNote: { color: '#7c2d12', fontSize: 13, marginTop: 5, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center' },

  // KIRMIZI KUTU (Red) - HTML
  rejectBox: { 
      backgroundColor: '#fee2e2', 
      padding: 15, 
      borderRadius: 10, 
      marginBottom: 15,
      opacity: 0.9
  },
  rejectTitle: { color: '#991b1b', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  rejectNote: { color: '#7f1d1d', fontSize: 13, fontStyle: 'italic' },

  // FOOTER
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dateText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  detailBtn: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  
  // Renk Güncellemesi: detailBtnText PRIMARY_COLOR yapıldı
  detailBtnText: { color: PRIMARY_COLOR, fontWeight: '600', fontSize: 13, marginRight: 2 },

  // BOŞ EKRAN
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, color: '#64748b', fontSize: 16, marginBottom: 20 },
  
  // Renk Güncellemesi: browseBtn PRIMARY_COLOR yapıldı
  browseBtn: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  
  browseBtnText: { color: 'white', fontWeight: 'bold' }
});

export default MyApplicationsScreen;