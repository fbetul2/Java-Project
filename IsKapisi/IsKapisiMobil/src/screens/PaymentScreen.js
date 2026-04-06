import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
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
import { odemeService } from '../api/api';

const { width } = Dimensions.get('window');

const PaymentScreen = ({ route, navigation }) => {
    // Ilan ID ve Başlık parametre olarak gelmeli
    const { ilanId, ilanBaslik } = route.params || {};

    const [paketler, setPaketler] = useState([]);
    const [seciliPaketId, setSeciliPaketId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Kredi Kartı Formu
    const [kartSahibi, setKartSahibi] = useState('');
    const [kartNo, setKartNo] = useState('');
    const [ay, setAy] = useState('');
    const [yil, setYil] = useState('');
    const [cvv, setCvv] = useState('');

    // Paketleri Çek
    useEffect(() => {
        const getPaketler = async () => {
            try {
                const data = await odemeService.getPaketler();
                setPaketler(data);
            } catch (error) {
                Alert.alert("Hata", "Paketler yüklenemedi.");
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        getPaketler();
    }, []);

    const handleOdemeYap = async () => {
        // 1. Paket seçili mi kontrol et
        if (!seciliPaketId) {
            Alert.alert("Uyarı", "Lütfen bir paket seçin.");
            return;
        }
        // 2. Kart bilgileri dolu mu kontrol et
        if (!kartSahibi || kartNo.length < 16 || !ay || !yil || !cvv) {
            Alert.alert("Hata", "Lütfen kart bilgilerini eksiksiz girin.");
            return;
        }

        setPaymentLoading(true);
        try {
            // Iyzico ile ödeme (Web ile uyumlu)
            await odemeService.satinAl(ilanId, seciliPaketId, {
                kartSahibi: kartSahibi,
                kartNo: kartNo,
                ay: ay,
                yil: yil,
                cvv: cvv
            });

            Alert.alert(
                "Tebrikler! 🚀", 
                "Ödeme başarılı. İlanınız vitrine taşındı.",
                [{ text: "Tamam", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.log(error); // Hatayı konsola yazdıralım ki görelim
            const errorMessage = error.response?.data || "Ödeme alınamadı. Lütfen tekrar deneyin.";
            // Gelen hata mesajı obje ise string'e çevir, değilse direkt yaz
            Alert.alert("Hata", typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
        } finally {
            setPaymentLoading(false);
        }
    };

    // Kart Numarası Formatla
    const handleKartNoChange = (text) => {
        // Sadece rakamları al
        const clean = text.replace(/[^0-9]/g, '');
        setKartNo(clean);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ödeme Yap</Text>
                <View style={{width: 30}} /> 
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <Text style={styles.subTitle}>📢 "{ilanBaslik}" İlanını Öne Çıkar</Text>
                    <Text style={styles.desc}>Binlerce adaya ulaşmak için sana uygun paketi seç.</Text>

                    {/* PAKET LİSTESİ */}
                    <View style={styles.packageContainer}>
                        {paketler.map((paket) => (
                            <TouchableOpacity 
                                key={paket.id} 
                                style={[
                                    styles.packageCard, 
                                    seciliPaketId === paket.id && styles.selectedPackage
                                ]}
                                onPress={() => setSeciliPaketId(paket.id)}
                            >
                                <View style={styles.radioCircle}>
                                    {seciliPaketId === paket.id && <View style={styles.radioDot} />}
                                </View>
                                <View style={{flex:1}}>
                                    <Text style={[styles.packName, seciliPaketId === paket.id && {color:'#6366f1'}]}>
                                        {paket.ad}
                                    </Text>
                                    <Text style={styles.packDuration}>⏳ {paket.gun} Gün Boyunca Vitrinde</Text>
                                </View>
                                <Text style={styles.packPrice}>{paket.fiyat} ₺</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* KREDİ KARTI FORMU (Web Tasarımına Sadık) */}
                    <View style={styles.cardForm}>
                        <Text style={styles.cardTitle}>💳 Güvenli Ödeme</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Kart Sahibi</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="AD SOYAD" 
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={kartSahibi}
                                onChangeText={setKartSahibi}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Kart Numarası</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="0000 0000 0000 0000" 
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                keyboardType="numeric"
                                maxLength={16}
                                value={kartNo}
                                onChangeText={handleKartNoChange}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, {flex:1, marginRight:10}]}>
                                <Text style={styles.label}>Ay</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="MM" 
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    keyboardType="numeric"
                                    maxLength={2}
                                    value={ay}
                                    onChangeText={setAy}
                                />
                            </View>
                            <View style={[styles.inputGroup, {flex:1, marginRight:10}]}>
                                <Text style={styles.label}>Yıl</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="YYYY" 
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    keyboardType="numeric"
                                    maxLength={4}
                                    value={yil}
                                    onChangeText={setYil}
                                />
                            </View>
                            <View style={[styles.inputGroup, {flex:1}]}>
                                <Text style={styles.label}>CVV</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="123" 
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    value={cvv}
                                    onChangeText={setCvv}
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.payButton} 
                            onPress={handleOdemeYap}
                            disabled={paymentLoading}
                        >
                            {paymentLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.payButtonText}>✅ Ödemeyi Onayla</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    backButton: { padding: 5 },
    content: { padding: 20, paddingBottom: 50 },
    
    subTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
    desc: { fontSize: 14, color: '#64748b', marginBottom: 20 },

    // Paket Kartları
    packageContainer: { marginBottom: 30 },
    packageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 2, borderColor: '#e2e8f0' },
    selectedPackage: { borderColor: '#6366f1', backgroundColor: '#e0e7ff' },
    
    radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    radioDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#6366f1' },
    
    packName: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
    packDuration: { fontSize: 12, color: '#64748b', marginTop: 2 },
    packPrice: { fontSize: 18, fontWeight: '800', color: '#059669' },

    // Kredi Kartı Formu (Koyu Tema)
    cardForm: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 10 },
    
    inputGroup: { marginBottom: 15 },
    label: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    
    payButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    payButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default PaymentScreen;