import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { aiService, isverenService } from '../api/api';

const IlanEkleScreen = ({ navigation, user, onIlanEklendi }) => {
    const [baslik, setBaslik] = useState('');
    const [sehir, setSehir] = useState('');
    const [maas, setMaas] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false); // AI Yükleniyor durumu

    // --- GEMINI AI İLE İLAN YAZ ---
    const handleAIWrite = async () => {
        if (!baslik) {
            Alert.alert("Önce Başlık Gir", "Yapay zekanın yazabilmesi için lütfen önce bir İlan Başlığı girin.");
            return;
        }
        
        // Kullanıcı kontrolü (Navigation params'dan veya prop'tan gelebilir)
        const activeUser = user || (navigation.getState().routes.find(r => r.name === 'IlanEkle')?.params?.user);

        if (!activeUser || !activeUser.id) {
            Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
            return;
        }

        setAiLoading(true);
        Keyboard.dismiss(); // Klavyeyi indir

        try {
            // Backend'e istek at
            const response = await aiService.ilanMetniOlustur(activeUser.id, baslik);
            
            // Cevap { ilanMetni: "..." } formatında gelir
            let hamMetin = response.ilanMetni;

            // Güvenlik önlemi: Eğer hala HTML kaldıysa temizle (Normalde backend temiz gönderir)
            let temizMetin = hamMetin
                .replace(/<b>/g, '')
                .replace(/<\/b>/g, '')
                .replace(/<br>/g, '\n')
                .replace(/<\/br>/g, '\n')
                .replace(/<[^>]*>?/gm, '') // Diğer tüm tagleri sil
                .trim();

            setAciklama(temizMetin);
            Alert.alert("Harika! ✨", "İlan metni yapay zeka tarafından oluşturuldu.");

        } catch (error) {
            console.error("AI hatası:", error);
            Alert.alert("Üzgünüz", "Yapay zeka şu an yanıt veremiyor.");
        } finally {
            setAiLoading(false);
        }
    };

    // --- İLANI KAYDET ---
    const handleKaydet = async () => {
        if (!baslik || !sehir || !aciklama) {
            Alert.alert("Eksik Bilgi", "Lütfen zorunlu alanları doldurun (Başlık, Şehir, Açıklama).");
            return;
        }

        setLoading(true);
        // Kullanıcıyı bul
        const activeUser = user || (navigation.getState().routes.find(r => r.name === 'IlanEkle')?.params?.user);

        try {
            await isverenService.addIlan({
                isverenId: activeUser.id,
                baslik: baslik,
                sehir: sehir,
                maas: maas || null,
                aciklama: aciklama
            });

            Alert.alert("Başarılı! 🎉", "İlanınız başarıyla yayınlandı.", [
                { text: "Tamam", onPress: () => {
                    if (onIlanEklendi) onIlanEklendi();
                    navigation.goBack();
                }}
            ]);
            
        } catch (error) {
            console.error("İlan ekleme hatası:", error);
            Alert.alert("Hata", "İlan yayınlanırken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni İlan Oluştur</Text>
                <View style={{width: 30}} />
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{flex: 1}}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        
                        <View style={styles.infoBox}>
                            {/* RENK GÜNCELLENDİ: #6366f1 -> #1e293b */}
                            <Text style={styles.infoTitle}>Aradığınız yeteneği bulun.</Text>
                            <Text style={styles.infoSubtitle}>Detayları girin, gerisini bize bırakın.</Text>
                        </View>

                        {/* Başlık */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>İlan Başlığı <Text style={{color:'red'}}>*</Text></Text>
                            <TextInput 
                                style={styles.input} 
                                value={baslik} 
                                onChangeText={setBaslik} 
                                placeholder="Örn: Garson, Yazılım Uzmanı..." 
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        {/* Şehir ve Maaş */}
                        <View style={{flexDirection: 'row', gap: 15}}>
                            <View style={[styles.formGroup, {flex: 1}]}>
                                <Text style={styles.label}>Şehir <Text style={{color:'red'}}>*</Text></Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={sehir} 
                                    onChangeText={setSehir} 
                                    placeholder="Örn: İstanbul" 
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                            <View style={[styles.formGroup, {flex: 1}]}>
                                <Text style={styles.label}>Maaş (Opsiyonel)</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={maas} 
                                    onChangeText={setMaas} 
                                    placeholder="Örn: 30.000 TL" 
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Açıklama ve AI Butonu */}
                        <View style={styles.formGroup}>
                            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 8}}>
                                <Text style={[styles.label, {marginBottom:0}]}>İş Tanımı <Text style={{color:'red'}}>*</Text></Text>
                                
                                {/* AI BUTONU */}
                                <TouchableOpacity 
                                    style={[styles.aiButton, aiLoading && {opacity:0.7}]} 
                                    onPress={handleAIWrite}
                                    disabled={aiLoading}
                                >
                                    {aiLoading ? (
                                        <ActivityIndicator size="small" color="#d97706" />
                                    ) : (
                                        <>
                                            <Ionicons name="sparkles" size={14} color="#d97706" style={{marginRight:4}} />
                                            <Text style={styles.aiButtonText}>AI ile Yazdır</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            
                            <TextInput 
                                style={[styles.input, styles.textArea]} 
                                value={aciklama} 
                                onChangeText={setAciklama} 
                                placeholder="İş hakkında detaylı bilgi verin..." 
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Kaydet Butonu */}
                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={handleKaydet}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>İlanı Yayınla 🚀</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    backButton: { padding: 5 },
    content: { padding: 20 },
    
    infoBox: { alignItems: 'center', marginBottom: 25 },
    // RENK GÜNCELLENDİ: #6366f1 -> #1e293b
    infoTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 5 },
    infoSubtitle: { fontSize: 14, color: '#64748b' },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 15, fontSize: 16, color: '#1e293b' },
    textArea: { height: 180 },

    aiButton: { flexDirection:'row', alignItems:'center', backgroundColor: '#fffbeb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#fcd34d' },
    aiButtonText: { color: '#d97706', fontSize: 12, fontWeight: '700' },

    // RENK GÜNCELLENDİ: #6366f1 -> #1e293b
    saveButton: { backgroundColor: '#1e293b', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#1e293b', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default IlanEkleScreen;