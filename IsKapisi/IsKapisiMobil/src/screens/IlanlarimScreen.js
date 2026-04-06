import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { isverenService, odemeService } from '../api/api';

// navigation prop'unu ekledik (Sayfa geçişi için şart)
const IlanlarimScreen = ({ user, navigation, onIlanEkleClick, onEditClick, onBasvurularClick }) => {
    const [ilanlar, setIlanlar] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- PAKET İŞLEMLERİ STATE ---
    const [paketModalVisible, setPaketModalVisible] = useState(false);
    const [paketler, setPaketler] = useState([]);
    const [seciliIlanId, setSeciliIlanId] = useState(null);
    const [seciliIlanBaslik, setSeciliIlanBaslik] = useState(""); // Başlığı da taşıyalım
    const [paketLoading, setPaketLoading] = useState(false);

    // İlanları Getir
    const ilanlariGetir = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await isverenService.getMyIlanlar(user.id);
            setIlanlar(data);
        } catch (error) {
            console.error("İlan hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            ilanlariGetir();
        }, [user])
    );

    // İlan Silme
    const handleSil = async (ilanId) => {
        Alert.alert("İlanı Sil", "Bu işlem geri alınamaz. Emin misiniz?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: async () => {
                try {
                    await isverenService.deleteIlan(ilanId);
                    setIlanlar(ilanlar.filter(i => i.id !== ilanId));
                } catch (error) { Alert.alert("Hata", "Silinemedi."); }
            }}
        ]);
    };

    // --- PAKET SÜRECİ ---
    
    // 1. "Öne Çıkar" Butonuna Basılınca -> Modalı Aç ve Paketleri Çek
    const handleOneCikarClick = async (ilanId, baslik) => {
        setSeciliIlanId(ilanId);
        setSeciliIlanBaslik(baslik);
        setPaketLoading(true);
        setPaketModalVisible(true);
        try {
            const data = await odemeService.getPaketler();
            setPaketler(data);
        } catch (error) {
            Alert.alert("Hata", "Paketler yüklenemedi.");
            setPaketModalVisible(false);
        } finally {
            setPaketLoading(false);
        }
    };

    // 2. Paket Seçilince -> ÖDEME EKRANINA YÖNLENDİR (Satın alma yok)
    const handlePaketSec = (paket) => {
        setPaketModalVisible(false); // Modalı kapat
        
        // PaymentScreen sayfasına git ve verileri taşı
        navigation.navigate('Payment', {
            ilanId: seciliIlanId,
            ilanBaslik: seciliIlanBaslik,
            paket: paket
        });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                    <Text style={styles.title}>{item.baslik}</Text>
                    <Text style={styles.date}>Şehir: {item.sehir}</Text>
                    {!item.aktif && <Text style={{color:'red', fontSize:12, fontWeight:'bold'}}>⛔ Yayında Değil</Text>}
                </View>
                {item.vitrinde && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>⭐ Vitrin</Text>
                    </View>
                )}
            </View>

            {/* BUTON GRUBU */}
            <View style={styles.actionButtons}>
                
                {/* ÖNE ÇIKAR BUTONU */}
                <TouchableOpacity 
                    style={[styles.btn, styles.btnStar]}
                    onPress={() => handleOneCikarClick(item.id, item.baslik)}
                >
                    <Ionicons name="star" size={16} color="#b45309" />
                    <Text style={[styles.btnText, {color: '#b45309'}]}>Öne Çıkar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, styles.btnApps]}
                    onPress={() => onBasvurularClick(item.id, item.baslik)}
                >
                    <Ionicons name="people" size={16} color="#059669" />
                    <Text style={[styles.btnText, {color: '#059669'}]}>Başvurular</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.actionButtons, {borderTopWidth:0, paddingTop:5}]}>
                <TouchableOpacity 
                    style={[styles.btn, styles.btnEdit]}
                    onPress={() => onEditClick(item)}
                >
                    <Ionicons name="create-outline" size={16} color="#d97706" />
                    <Text style={[styles.btnText, {color: '#d97706'}]}>Düzenle</Text>
                </TouchableOpacity>

                {/* İlan Tekrar Yayınla (Web ile uyumlu) */}
                {!item.aktif && (
                    <TouchableOpacity 
                        style={[styles.btn, {backgroundColor: '#dcfce7', borderColor: '#86efac'}]}
                        onPress={async () => {
                            try {
                                await isverenService.ilanTekrarYayinla(item.id);
                                Alert.alert("Başarılı", "İlan tekrar yayınlandı.");
                                ilanlariGetir();
                            } catch (error) {
                                Alert.alert("Hata", "İşlem başarısız.");
                            }
                        }}
                    >
                        <Ionicons name="refresh" size={16} color="#059669" />
                        <Text style={[styles.btnText, {color: '#059669'}]}>Yayınla</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[styles.btn, styles.btnDelete]}
                    onPress={() => handleSil(item.id)}
                >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[styles.btnText, {color: '#ef4444'}]}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>İlan Yönetimi</Text>
                <TouchableOpacity onPress={onIlanEkleClick}>
                    {/* SADECE BURASI DEĞİŞTİ: color="#1e293b" */}
                    <Ionicons name="add-circle" size={32} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366f1" style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={ilanlar}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Henüz ilanınız yok.</Text>
                            <TouchableOpacity style={styles.createButton} onPress={onIlanEkleClick}>
                                <Text style={styles.createButtonText}>+ İlan Oluştur</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* --- PAKET SEÇİM MODALI --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={paketModalVisible}
                onRequestClose={() => setPaketModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>✨ İlanı Öne Çıkar</Text>
                            <TouchableOpacity onPress={() => setPaketModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.modalSub}>Ödeme ekranına yönlendirileceksiniz.</Text>

                        {paketLoading ? (
                            <ActivityIndicator color="#6366f1" />
                        ) : (
                            <FlatList
                                data={paketler}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({item}) => (
                                    <TouchableOpacity style={styles.packageItem} onPress={() => handlePaketSec(item)}>
                                        <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                                            <View style={styles.packageIcon}>
                                                <Ionicons name="rocket" size={24} color="#f59e0b" />
                                            </View>
                                            <View>
                                                <Text style={styles.packageName}>{item.ad}</Text>
                                                <Text style={styles.packageDuration}>⏳ {item.gun} Gün Vitrin</Text>
                                            </View>
                                        </View>
                                        <View style={{alignItems:'flex-end'}}>
                                            <Text style={styles.packagePrice}>{item.fiyat} ₺</Text>
                                            <Text style={{fontSize:10, color:'#6366f1', fontWeight:'bold'}}>Seç ➔</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={{textAlign:'center', color:'#94a3b8'}}>Paket bulunamadı.</Text>}
                            />
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
    listContent: { padding: 20 },
    
    card: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    title: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    date: { fontSize: 13, color: '#64748b' },
    badge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth:1, borderColor:'#fcd34d' },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#d97706' },

    actionButtons: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    
    btnStar: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' }, // SARI (Öne Çıkar)
    btnApps: { borderColor: '#d1fae5', backgroundColor: '#ecfdf5' }, // YEŞİL
    btnEdit: { borderColor: '#fed7aa', backgroundColor: '#fff7ed' }, // TURUNCU
    btnDelete: { borderColor: '#fee2e2', backgroundColor: '#fef2f2' }, // KIRMIZI

    btnText: { marginLeft: 4, fontSize: 12, fontWeight: '700' },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 16, marginBottom: 20 },
    createButton: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
    createButtonText: { color: 'white', fontWeight: 'bold' },

    // Modal Stilleri
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    modalSub: { color: '#64748b', marginBottom: 20, fontSize: 13 },
    
    packageItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    packageIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fcd34d' },
    packageName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    packageDuration: { fontSize: 12, color: '#64748b' },
    packagePrice: { fontSize: 16, fontWeight: '800', color: '#059669' }
});

export default IlanlarimScreen;