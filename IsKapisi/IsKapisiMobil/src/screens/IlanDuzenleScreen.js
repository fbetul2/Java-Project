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
import { isverenService } from '../api/api';

const IlanDuzenleScreen = ({ navigation, route, onIlanGuncellendi }) => {
    // Route params üzerinden gönderdiğimiz ilanı alıyoruz
    const { ilan } = route.params;

    const [baslik, setBaslik] = useState(ilan.baslik);
    const [sehir, setSehir] = useState(ilan.sehir);
    const [maas, setMaas] = useState(ilan.maas);
    const [aciklama, setAciklama] = useState(ilan.aciklama);
    const [loading, setLoading] = useState(false);

    const handleGuncelle = async () => {
        if (!baslik || !sehir || !aciklama) {
            Alert.alert("Eksik Bilgi", "Lütfen zorunlu alanları doldurun.");
            return;
        }

        setLoading(true);

        try {
            await isverenService.updateIlan({
                id: ilan.id, // İlan ID'si önemli
                baslik: baslik,
                sehir: sehir,
                maas: maas || null,
                aciklama: aciklama
            });

            Alert.alert("Başarılı", "İlan güncellendi.");
            
            if (onIlanGuncellendi) onIlanGuncellendi();
            navigation.goBack();

        } catch (error) {
            console.error("Güncelleme hatası:", error);
            const errorMessage = error.response?.data || "Güncelleme başarısız.";
            Alert.alert("Hata", typeof errorMessage === 'string' ? errorMessage : "Güncelleme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>İlanı Düzenle</Text>
                <View style={{width: 30}} />
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                    <ScrollView contentContainerStyle={styles.content}>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>İlan Başlığı</Text>
                            <TextInput style={styles.input} value={baslik} onChangeText={setBaslik} />
                        </View>

                        <View style={{flexDirection: 'row', gap: 15}}>
                            <View style={[styles.formGroup, {flex: 1}]}>
                                <Text style={styles.label}>Şehir</Text>
                                <TextInput style={styles.input} value={sehir} onChangeText={setSehir} />
                            </View>
                            <View style={[styles.formGroup, {flex: 1}]}>
                                <Text style={styles.label}>Maaş</Text>
                                <TextInput style={styles.input} value={maas} onChangeText={setMaas} keyboardType="numeric"/>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>İş Tanımı</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]} 
                                value={aciklama} 
                                onChangeText={setAciklama} 
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleGuncelle} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Güncelle</Text>}
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
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 16, color: '#1e293b' },
    textArea: { height: 150 },
    saveButton: { backgroundColor: '#d97706', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#d97706', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default IlanDuzenleScreen;