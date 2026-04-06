import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { adminService } from '../api/api';

const screenWidth = Dimensions.get("window").width;

const AdminScreen = ({ user, onLogout }) => {
    const [stats, setStats] = useState({});
    const [activeTab, setActiveTab] = useState('dashboard');
    const [kullanicilar, setKullanicilar] = useState([]);
    const [ilanlar, setIlanlar] = useState([]);
    const [paketler, setPaketler] = useState([]);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // --- YENİ EKLENEN FİLTRE STATE'LERİ ---
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // ALL, ISVEREN, IS_ARAYAN, ADMIN
    const [adSearch, setAdSearch] = useState('');
    // -------------------------------------

    // --- İLAN SİLME MODALI STATE'LERİ ---
    const [modalVisible, setModalVisible] = useState(false);
    const [seciliIlanId, setSeciliIlanId] = useState(null);
    const [silmeSebebi, setSilmeSebebi] = useState("");

    // --- PAKET İŞLEMLERİ MODALI STATE'LERİ ---
    const [paketModalVisible, setPaketModalVisible] = useState(false);
    const [paketForm, setPaketForm] = useState({ id: null, ad: '', gun: '', fiyat: '' });

    // --- VERİ ÇEKME ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const statsData = await adminService.getDashboard();
            setStats(statsData);

            if (activeTab === 'users') {
                const usersData = await adminService.getKullanicilar();
                setKullanicilar(usersData);
            } else if (activeTab === 'ads') {
                const adsData = await adminService.getAllIlanlar();
                setIlanlar(adsData);
            } else if (activeTab === 'packages') {
                const packData = await adminService.getPaketler();
                setPaketler(packData);
            }
        } catch (error) {
            console.error("Admin veri hatası:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [activeTab])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // --- İŞLEVLER ---
    const handleAdDeleteClick = (id) => {
        setSeciliIlanId(id);
        setSilmeSebebi("");
        setModalVisible(true);
    };

    const confirmDeleteAd = async () => {
        if (!silmeSebebi.trim()) {
            Alert.alert("Uyarı", "Lütfen bir sebep yazın.");
            return;
        }
        try {
            setModalVisible(false);
            setLoading(true);
            await adminService.deleteIlan(seciliIlanId, silmeSebebi);
            Alert.alert("Başarılı", "İlan kaldırıldı ve bildirim gönderildi. ✅");
            fetchData();
        } catch (e) {
            const errorMessage = e.response?.data || "Sunucu hatası";
            Alert.alert("Hata", "İşlem başarısız: " + (typeof errorMessage === 'string' ? errorMessage : "Sunucu hatası"));
        } finally {
            setLoading(false);
        }
    };

    const handleUserDelete = (id) => {
        Alert.alert("Banla", "Kullanıcıyı silmek istiyor musun?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: async () => {
                try { await adminService.deleteKullanici(id); fetchData(); } catch (e) {}
            }}
        ]);
    };

    const openPaketModal = (paket = null) => {
        if (paket) {
            setPaketForm({
                id: paket.id,
                ad: paket.ad,
                gun: paket.gun.toString(),
                fiyat: paket.fiyat.toString()
            });
        } else {
            setPaketForm({ id: null, ad: '', gun: '', fiyat: '' });
        }
        setPaketModalVisible(true);
    };

    const handlePaketKaydet = async () => {
        if (!paketForm.ad || !paketForm.gun || !paketForm.fiyat) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
            return;
        }
        try {
            setPaketModalVisible(false);
            setLoading(true);
            await adminService.savePaket({
                id: paketForm.id,
                ad: paketForm.ad,
                gun: parseInt(paketForm.gun),
                fiyat: parseFloat(paketForm.fiyat)
            });
            Alert.alert("Başarılı", "Paket kaydedildi! 📦");
            fetchData();
        } catch (e) {
            Alert.alert("Hata", "Paket kaydedilemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handlePaketSil = (id) => {
        Alert.alert("Paketi Sil", "Bu paketi silmek istediğine emin misin?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: async () => {
                try { await adminService.deletePaket(id); fetchData(); } catch (e) {}
            }}
        ]);
    };

    // --- RENDER BİLEŞENLERİ ---

    const renderPackages = () => (
        <View style={{flex:1}}>
            <TouchableOpacity style={styles.addBtn} onPress={() => openPaketModal(null)}>
                <Text style={styles.addBtnText}>+ Yeni Paket Ekle</Text>
            </TouchableOpacity>

            <FlatList
                data={paketler}
                keyExtractor={item => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <View style={styles.packageCard}>
                        <View style={{flex:1}}>
                            <Text style={styles.packTitle}>{item.ad}</Text>
                            <Text style={styles.packSub}>⏳ {item.gun} Gün • 💰 {item.fiyat} TL</Text>
                        </View>
                        <View style={{flexDirection:'row', gap:10}}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => openPaketModal(item)}>
                                <Ionicons name="pencil" size={18} color="#d97706" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handlePaketSil(item.id)}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#64748b'}}>Henüz paket eklenmemiş.</Text>}
            />
        </View>
    );

    // --- YENİLENEN İLAN LİSTESİ (ARAMALI) ---
    const renderAds = () => {
        // İlan Filtreleme Mantığı
        const filteredAds = ilanlar.filter(item => {
            const text = adSearch.toLowerCase();
            return item.baslik?.toLowerCase().includes(text) ||
                   item.isveren?.sirketAdi?.toLowerCase().includes(text) ||
                   item.sehir?.toLowerCase().includes(text);
        });

        return (
            <View style={{flex:1}}>
                {/* İlan Arama Kutusu */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="İlan başlığı, şirket veya şehir ara..." 
                        value={adSearch}
                        onChangeText={setAdSearch}
                    />
                </View>

                <FlatList
                    data={filteredAds}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{flex:1}}>
                                <Text style={styles.itemTitle}>{item.baslik}</Text>
                                <Text style={styles.itemSub}>{item.isveren?.sirketAdi} - {item.sehir}</Text>
                            </View>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleAdDeleteClick(item.id)}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#64748b'}}>İlan bulunamadı.</Text>}
                />
            </View>
        );
    };

    // --- YENİLENEN KULLANICI LİSTESİ (ARAMALI VE FİLTRELİ) ---
    const renderUsers = () => {
        // Kullanıcı Filtreleme Mantığı
        const filteredUsers = kullanicilar.filter(u => {
            const matchesSearch = u.email.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = userRoleFilter === 'ALL' || u.rol === userRoleFilter;
            return matchesSearch && matchesRole;
        });

        return (
            <View style={{flex:1}}>
                {/* Kullanıcı Arama Kutusu */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="E-posta ile ara..." 
                        value={userSearch}
                        onChangeText={setUserSearch}
                        autoCapitalize="none"
                    />
                </View>

                {/* Rol Filtreleme Butonları */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['ALL', 'ISVEREN', 'IS_ARAYAN', 'ADMIN'].map((role) => (
                            <TouchableOpacity 
                                key={role} 
                                style={[styles.filterChip, userRoleFilter === role && styles.activeFilterChip]}
                                onPress={() => setUserRoleFilter(role)}
                            >
                                <Text style={[styles.filterText, userRoleFilter === role && styles.activeFilterText]}>
                                    {role === 'ALL' ? 'Tümü' : role}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{flex:1}}>
                                <Text style={styles.itemTitle}>{item.email}</Text>
                                <View style={{flexDirection:'row', alignItems:'center', marginTop:4}}>
                                    <View style={[
                                        styles.roleBadge, 
                                        item.rol === 'ISVEREN' ? {backgroundColor:'#e0f2fe'} : 
                                        item.rol === 'IS_ARAYAN' ? {backgroundColor:'#dcfce7'} : {backgroundColor:'#f3e8ff'}
                                    ]}>
                                        <Text style={[
                                            styles.roleText,
                                            item.rol === 'ISVEREN' ? {color:'#0369a1'} : 
                                            item.rol === 'IS_ARAYAN' ? {color:'#15803d'} : {color:'#7e22ce'}
                                        ]}>{item.rol}</Text>
                                    </View>
                                </View>
                            </View>
                            {item.rol !== 'ADMIN' && (
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleUserDelete(item.id)}>
                                    <Ionicons name="ban-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#64748b'}}>Kullanıcı bulunamadı.</Text>}
                />
            </View>
        );
    };

    const pieData = [
        { name: "İşveren", population: stats.isverenSayisi || 0, color: "#6366f1", legendFontColor: "#7F7F7F", legendFontSize: 12 },
        { name: "İş Arayan", population: stats.isArayanSayisi || 0, color: "#ec4899", legendFontColor: "#7F7F7F", legendFontSize: 12 }
    ];
    const cityLabels = Object.keys(stats.sehirIstatistigi || {}).slice(0, 5);
    const cityValues = Object.values(stats.sehirIstatistigi || {}).slice(0, 5);
    const barData = { labels: cityLabels.length > 0 ? cityLabels : ["Veri Yok"], datasets: [{ data: cityValues.length > 0 ? cityValues : [0] }] };

    const renderDashboard = () => (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, {backgroundColor: '#e0f2fe'}]}>
                    <Text style={[styles.statNumber, {color: '#0284c7'}]}>{stats.toplamKullanici}</Text>
                    <Text style={styles.statLabel}>Kullanıcı</Text>
                </View>
                <View style={[styles.statCard, {backgroundColor: '#dcfce7'}]}>
                    <Text style={[styles.statNumber, {color: '#16a34a'}]}>{stats.aktifIlan}</Text>
                    <Text style={styles.statLabel}>İlan</Text>
                </View>
            </View>
            <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>Kullanıcı Dağılımı</Text>
                <PieChart data={pieData} width={screenWidth - 40} height={200} chartConfig={chartConfig} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute />
            </View>
            <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>Şehirler (Top 5)</Text>
                <BarChart data={barData} width={screenWidth - 60} height={220} yAxisLabel="" chartConfig={chartConfig} verticalLabelRotation={30} fromZero />
            </View>
            <View style={{height:50}}/>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Yönetim Paneli 🛡️</Text>
                <TouchableOpacity onPress={onLogout}><Ionicons name="log-out-outline" size={24} color="white" /></TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} onPress={() => setActiveTab('dashboard')}><Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Özet</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'users' && styles.activeTab]} onPress={() => setActiveTab('users')}><Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Kullanıcı</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'ads' && styles.activeTab]} onPress={() => setActiveTab('ads')}><Text style={[styles.tabText, activeTab === 'ads' && styles.activeTabText]}>İlanlar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'packages' && styles.activeTab]} onPress={() => setActiveTab('packages')}><Text style={[styles.tabText, activeTab === 'packages' && styles.activeTabText]}>Paketler</Text></TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? <ActivityIndicator size="large" color="#6366f1" style={{marginTop: 50}} /> : (
                    activeTab === 'dashboard' ? renderDashboard() :
                    activeTab === 'users' ? renderUsers() :
                    activeTab === 'ads' ? renderAds() : renderPackages()
                )}
            </View>

            {/* --- MODAL 1: İLAN SİLME --- */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>⚠️ İlanı Yayından Kaldır</Text>
                        <Text style={styles.modalSub}>İşverene ve başvuranlara bildirim gidecektir.</Text>
                        <Text style={styles.label}>Kaldırma Sebebi:</Text>
                        <TextInput style={styles.modalInput} placeholder="Örn: Uygunsuz içerik..." value={silmeSebebi} onChangeText={setSilmeSebebi} multiline />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#94a3b8'}]} onPress={() => setModalVisible(false)}><Text style={styles.modalBtnText}>Vazgeç</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#ef4444'}]} onPress={confirmDeleteAd}><Text style={styles.modalBtnText}>Kaldır ve Bildir</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- MODAL 2: PAKET EKLEME/DÜZENLEME --- */}
            <Modal animationType="fade" transparent={true} visible={paketModalVisible} onRequestClose={() => setPaketModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{paketForm.id ? "Paketi Düzenle" : "Yeni Paket Ekle"}</Text>
                        <Text style={styles.label}>Paket Adı:</Text>
                        <TextInput style={styles.inputLine} placeholder="Örn: Haftalık Fırsat" value={paketForm.ad} onChangeText={(t) => setPaketForm({...paketForm, ad: t})} />
                        <Text style={styles.label}>Süre (Gün):</Text>
                        <TextInput style={styles.inputLine} placeholder="7" keyboardType="numeric" value={paketForm.gun} onChangeText={(t) => setPaketForm({...paketForm, gun: t})} />
                        <Text style={styles.label}>Fiyat (TL):</Text>
                        <TextInput style={styles.inputLine} placeholder="150" keyboardType="numeric" value={paketForm.fiyat} onChangeText={(t) => setPaketForm({...paketForm, fiyat: t})} />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#94a3b8'}]} onPress={() => setPaketModalVisible(false)}><Text style={styles.modalBtnText}>İptal</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#6366f1'}]} onPress={handlePaketKaydet}><Text style={styles.modalBtnText}>Kaydet 💾</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const chartConfig = { backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff", color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, strokeWidth: 2, barPercentage: 0.5, decimalPlaces: 0 };

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { backgroundColor: '#1e293b', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', backgroundColor: 'white', padding: 5 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#6366f1' },
    tabText: { color: '#64748b', fontWeight: '600', fontSize: 12 },
    activeTabText: { color: '#6366f1' },
    content: { flex: 1, padding: 15 },
    statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    statCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#475569', fontWeight: '600' },
    chartBox: { backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 20, alignItems: 'center' },
    chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#1e293b', alignSelf:'flex-start' },
    
    // --- YENİ EKLENEN STİLLER (ARAMA VE FİLTRE) ---
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15, borderWidth:1, borderColor:'#e2e8f0' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#334155' },
    filterContainer: { marginBottom: 15, height: 40 },
    filterChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 10 },
    activeFilterChip: { backgroundColor: '#6366f1' },
    filterText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
    activeFilterText: { color: 'white' },
    roleBadge: { paddingHorizontal:8, paddingVertical:3, borderRadius:12, alignSelf:'flex-start' },
    roleText: { fontSize:10, fontWeight:'bold' },
    // ---------------------------------------------

    listItem: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    itemTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    itemSub: { fontSize: 12, color: '#64748b' },
    deleteBtn: { padding: 10, backgroundColor: '#fef2f2', borderRadius: 8 },
    addBtn: { backgroundColor: '#6366f1', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
    addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    packageCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#f59e0b', elevation: 2 },
    packTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    packSub: { fontSize: 14, color: '#64748b', marginTop: 3 },
    editBtn: { padding: 10, backgroundColor: '#fef3c7', borderRadius: 8 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1e293b', textAlign:'center' },
    modalSub: { fontSize: 13, color: '#64748b', marginBottom: 15, textAlign: 'center' },
    label: { alignSelf: 'flex-start', marginBottom: 5, fontWeight: '600', color: '#475569' },
    modalInput: { width: '100%', height: 80, borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, textAlignVertical: 'top', backgroundColor: '#f8fafc' },
    inputLine: { width: '100%', height: 45, borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#f8fafc' },
    modalButtons: { flexDirection: 'row', width: '100%', gap: 10, marginTop:10 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    modalBtnText: { color: 'white', fontWeight: 'bold' }
});

export default AdminScreen;