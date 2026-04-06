import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

// --- DÜZELTİLEN IMPORTLAR ---
// 1. Yazma işlemi için Legacy import kullanıyoruz (Hata çözümü)
import * as FileSystem from 'expo-file-system/legacy';
// 2. Android'de direkt açmak için
import * as IntentLauncher from 'expo-intent-launcher';
// 3. iOS için
import * as Sharing from 'expo-sharing';

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { basvuruService } from '../api/api';

const BasvurularScreen = ({ route, navigation }) => {
    
    const router = useRouter(); 
    const routerParams = useLocalSearchParams(); 

    const propParams = route?.params || {};
    const ilanId = propParams.ilanId || routerParams.ilanId;
    const baslik = propParams.baslik || routerParams.baslik;

    const [basvurular, setBasvurular] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null); 
    const [selectedBasvuruId, setSelectedBasvuruId] = useState(null);
    const [note, setNote] = useState('');
    
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [downloading, setDownloading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (ilanId) {
                fetchBasvurular(ilanId);
            } else {
                setLoading(false);
            }
        }, [ilanId])
    );

    const fetchBasvurular = async (id) => {
        setLoading(true);
        try {
            const data = await basvuruService.getIlanBasvurulari(id);
            setBasvurular(data);
        } catch (error) {
            console.error("Başvuru çekme hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateData) => {
        if (!dateData) return "Tarih Bekleniyor";
        let d;
        try {
            if (Array.isArray(dateData)) {
                d = new Date(dateData[0], dateData[1] - 1, dateData[2], dateData[3] || 0, dateData[4] || 0);
            } else {
                d = new Date(dateData);
            }
            if (isNaN(d.getTime())) return "Geçersiz Format";
            return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "Hata";
        }
    };

    const handleGoBack = () => {
        if (navigation && typeof navigation.goBack === 'function') {
            navigation.goBack();
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
    };

    const openActionModal = (type, basvuruId) => {
        setModalType(type);
        setSelectedBasvuruId(basvuruId);
        setNote('');
        setDate(new Date()); 
        setModalVisible(true);
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            if (Platform.OS === 'android') setShowTimePicker(true); 
        }
    };

    const handleTimeChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const submitAction = async () => {
        if (!note && modalType === 'RED') {
            Alert.alert("Eksik", "Lütfen ret sebebini yazın.");
            return;
        }
        const durum = modalType === 'MULAKAT' ? 'MULAKAT' : 'REDDEDILDI';
        const tarihStr = modalType === 'MULAKAT' ? date.toISOString() : null;

        try {
            await basvuruService.updateBasvuruDurum(selectedBasvuruId, durum, note, tarihStr, false);
            setModalVisible(false);
            Alert.alert("Başarılı", "İşlem kaydedildi.");
            fetchBasvurular(ilanId); 
        } catch (error) {
            Alert.alert("Hata", "İşlem başarısız.");
        }
    };

    // --- CV İNDİRME / GÖRÜNTÜLEME (HATA ÇÖZÜLDÜ & DİREKT AÇMA EKLENDİ) ---
    const handleViewCV = async (basvuruId) => {
        setDownloading(true);
        try {
            const data = await basvuruService.getCV(basvuruId);

            if (data && data.cvBase64) {
                // 1. Dosya yolunu oluştur (Cache klasörü daha güvenlidir)
                const fileUri = FileSystem.cacheDirectory + `cv_${basvuruId}.pdf`;

                // 2. Dosyayı Yaz (Legacy import sayesinde hata vermeyecek)
                await FileSystem.writeAsStringAsync(fileUri, data.cvBase64, {
                    encoding: 'base64', // Enum yerine String kullanımı
                });

                // 3. Platforma göre açma mantığı
                if (Platform.OS === 'android') {
                    // Android: İçerik URI'si al ve Intent ile direkt aç
                    const contentUri = await FileSystem.getContentUriAsync(fileUri);
                    
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        flags: 1, // Okuma izni
                        type: 'application/pdf',
                    });
                } else {
                    // iOS: Paylaşım penceresi (Önizleme sağlar)
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri, {
                            mimeType: 'application/pdf',
                            UTI: 'com.adobe.pdf'
                        });
                    } else {
                        Alert.alert("Hata", "Dosya görüntülenemiyor.");
                    }
                }
            } else {
                Alert.alert("Uyarı", "CV dosyası bulunamadı.");
            }
        } catch (error) {
            console.error("CV İndirme Hatası:", error);
            Alert.alert("Hata", "CV açılamadı: " + (error.message || "Bilinmeyen Hata"));
        } finally {
            setDownloading(false);
        }
    };
    // --------------------------------

    const renderItem = ({ item }) => {
        const rawDate = item.mulakatTarihi || item.mulakat_tarihi || item.tarih || item.date;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{flex:1}}>
                        <Text style={styles.applicantName}>{item.ad} {item.soyad}</Text>
                        <Text style={styles.applicantJob}>{item.meslek}</Text>
                    </View>
                    <View style={[
                        styles.badge, 
                        item.durum === 'BEKLEMEDE' ? styles.badgeInfo :
                        item.durum === 'MULAKAT' ? styles.badgeWarning : styles.badgeDanger
                    ]}>
                        <Text style={[
                            styles.badgeText, 
                            item.durum === 'BEKLEMEDE' ? {color:'#64748b'} :
                            item.durum === 'MULAKAT' ? {color:'#ea580c'} : {color:'#991b1b'}
                        ]}>
                            {item.durum === 'BEKLEMEDE' ? 'Yeni' : 
                            item.durum === 'MULAKAT' ? 'Mülakat' : 'Red'}
                        </Text>
                    </View>
                </View>

                <Text numberOfLines={3} style={styles.summary}>{item.ozetBilgi || "Özet bilgi girilmemiş."}</Text>

                {item.durum === 'MULAKAT' && (
                    <View style={styles.interviewInfoBox}>
                        <Text style={styles.interviewLabel}>Mülakat Tarihi:</Text>
                        <Text style={styles.interviewValue}>🕒 {formatDate(rawDate)}</Text>
                        {item.isverenNotu && <Text style={styles.interviewNote}>Not: {item.isverenNotu}</Text>}
                    </View>
                )}

                {item.durum === 'REDDEDILDI' && item.isverenNotu && (
                    <View style={styles.rejectInfoBox}>
                        <Text style={styles.rejectText}>Sebep: "{item.isverenNotu}"</Text>
                    </View>
                )}

                <View style={styles.actionRow}>
                    {item.cvVarMi ? (
                        <TouchableOpacity style={styles.cvButton} onPress={() => handleViewCV(item.id)}>
                            <Ionicons name="eye" size={18} color="#6366f1" />
                            <Text style={styles.cvButtonText}>CV AÇ</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.noCvButton}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                            <Text style={styles.noCvText}>CV Yok</Text>
                        </View>
                    )}

                    {item.durum === 'BEKLEMEDE' && (
                        <>
                            <TouchableOpacity style={styles.interviewButton} onPress={() => openActionModal('MULAKAT', item.id)}>
                                <Text style={styles.actionBtnText}>Davet</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectButton} onPress={() => openActionModal('RED', item.id)}>
                                <Text style={styles.actionBtnText}>Red</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={{padding:5}}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                
                <View style={{flex:1, alignItems:'center'}}>
                    <Text style={styles.headerTitle}>Başvurular</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{baslik || "İlan Başlığı Yok"}</Text>
                </View>
                <View style={{width:30}} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366f1" style={{marginTop:50}} />
            ) : (
                <FlatList
                    data={basvurular}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {ilanId ? "Henüz başvuru yok." : "İlan bilgisi alınamadı."}
                            </Text>
                        </View>
                    }
                />
            )}

            {downloading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text style={{marginTop:10, color:'#334155'}}>CV Açılıyor...</Text>
                    </View>
                </View>
            )}

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{modalType === 'MULAKAT' ? 'Mülakata Çağır' : 'Başvuruyu Reddet'}</Text>
                        {modalType === 'MULAKAT' && (
                            <View style={{marginBottom: 15}}>
                                <Text style={styles.label}>Tarih ve Saat:</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                                    <Ionicons name="calendar" size={20} color="#6366f1" />
                                </TouchableOpacity>
                                {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />}
                                {showTimePicker && <DateTimePicker value={date} mode="time" display="default" onChange={handleTimeChange} />}
                            </View>
                        )}
                        <Text style={styles.label}>{modalType === 'MULAKAT' ? 'Adaya Not:' : 'Red Sebebi:'}</Text>
                        <TextInput style={styles.input} placeholder={modalType === 'MULAKAT' ? "Görüşmek üzere..." : "Pozisyon kapandı..."} value={note} onChangeText={setNote} multiline />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#f1f5f9'}]} onPress={() => setModalVisible(false)}><Text style={{color:'#64748b', fontWeight:'bold'}}>İptal</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: modalType === 'MULAKAT' ? '#f59e0b' : '#ef4444'}]} onPress={submitAction}><Text style={{color:'white', fontWeight:'bold'}}>{modalType === 'MULAKAT' ? 'Davet Et' : 'Reddet'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign:'center' },
    headerSub: { fontSize: 12, color: '#64748b', textAlign:'center' },
    listContent: { padding: 15 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    applicantName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    applicantJob: { fontSize: 13, color: '#64748b' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeInfo: { backgroundColor: '#f1f5f9' },
    badgeWarning: { backgroundColor: '#fff7ed' },
    badgeDanger: { backgroundColor: '#fee2e2' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    summary: { fontSize: 13, color: '#334155', marginBottom: 10, lineHeight: 20 },
    contactInfo: { fontSize: 12, color: '#64748b', marginBottom: 2 },
    interviewInfoBox: { backgroundColor: '#fffbeb', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#fcd34d' },
    interviewLabel: { fontSize: 11, fontWeight: 'bold', color: '#b45309' },
    interviewValue: { fontSize: 13, color: '#92400e', marginTop: 2 },
    interviewNote: { fontSize: 12, fontStyle: 'italic', color: '#92400e', marginTop: 5 },
    rejectInfoBox: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 10, opacity: 0.8 },
    rejectText: { fontSize: 12, color: '#991b1b', fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    cvButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#6366f1', backgroundColor: '#eef2ff' },
    cvButtonText: { color: '#6366f1', fontSize: 12, fontWeight: '700', marginLeft: 5 },
    noCvButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
    noCvText: { color: '#94a3b8', fontSize: 12, marginLeft: 5 },
    interviewButton: { flex: 1, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    rejectButton: { flex: 1, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    actionBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#94a3b8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalView: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
    label: { fontSize: 13, color: '#64748b', marginBottom: 5 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
    dateText: { fontSize: 14, color: '#334155' },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 10 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    loadingBox: { backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center' }
});

export default BasvurularScreen;