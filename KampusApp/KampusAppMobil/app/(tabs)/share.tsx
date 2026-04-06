import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView, ScrollView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { API_URLS } from '../../config'; // YENİ EKLENDİ

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142', white: '#ffffff' };

export default function ShareScreen() {
  const [metin, setMetin] = useState('');
  const [resim, setResim] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const kontrolEt = async () => {
        const id = await AsyncStorage.getItem('kullaniciId');
        if (!id) {
          Alert.alert("Giriş Yapmalısın", "Paylaşım yapmak için önce giriş yap.");
          router.replace('/'); 
        }
      };
      kontrolEt();
    }, [])
  );

  const resimSec = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("İzin Gerekli", "Galeri izni vermelisiniz.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setResim(result.assets[0].uri);
    }
  };

  const paylas = async () => {
    if (!metin && !resim) { Alert.alert("Uyarı", "Boş gönderi olamaz."); return; }
    setYukleniyor(true);

    try {
      const id = await AsyncStorage.getItem('kullaniciId');
      
      const formData = new FormData();
      formData.append('kullaniciId', id || '');
      formData.append('metin', metin);

      if (resim) {
        const filename = resim.split('/').pop() || 'photo.jpg';
        // @ts-ignore
        formData.append('resim', {
          uri: resim,
          name: filename,
          type: 'image/jpeg' 
        });
      }

      // DİKKAT: API_URLS.AKIS kullanıldı ancak bu "API_URL_PAYLAS" olmadığı için config.ts'e ekleme yapman gerekebilir
      // Eğer "gonderi-paylas" adresi config'de yoksa, AKIS yerine yeni bir key eklemen daha iyi olur.
      // Şimdilik varsayım olarak API_URLS.AKIS'ı replace ederek kullanıyoruz veya config'e PAYLAS ekleyebilirsin.
      // En doğrusu config.ts dosyana şu satırı eklemek: PAYLAS: `${BASE_URL}/api/gonderi-paylas`,
      // Ben burada config'e eklediğini varsayarak API_URLS.PAYLAS kullanacağım. EĞER YOKSA config.ts'e ekle!
      
      // HIZLI ÇÖZÜM: Config dosyanı değiştirmeden kullanmak için:
      const PAYLAS_URL = API_URLS.AKIS.replace('/akis', '/gonderi-paylas'); 

      console.log("İstek atılıyor:", PAYLAS_URL);

      const response = await fetch(PAYLAS_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const textResponse = await response.text(); 
      console.log("Sunucu Cevabı:", textResponse); 

      try {
          const data = JSON.parse(textResponse); 
          setYukleniyor(false);

          if (data.basarili) {
            Alert.alert("Başarılı", "Paylaşıldı!");
            setMetin('');
            setResim(null);
            router.push('/');
          } else {
            Alert.alert("Hata", data.mesaj || "Bilinmeyen hata");
          }
      } catch (e) {
          setYukleniyor(false);
          console.error("JSON Hatası:", e);
          Alert.alert("Sunucu Hatası", "Sunucu JSON yerine başka bir şey gönderdi. Konsola bak.");
      }

    } catch (error) {
      console.error("Ağ Hatası:", error);
      setYukleniyor(false);
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 20}}>
        <Text style={styles.title}>Yeni Gönderi</Text>
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Neler düşünüyorsun?" multiline numberOfLines={4} value={metin} onChangeText={setMetin} />
          {resim && (
            <View style={{marginBottom: 15}}>
                <Image source={{ uri: resim }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setResim(null)} style={styles.removeBtn}><Text style={{color:'white'}}>X</Text></TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.photoButton} onPress={resimSec}><Text>📷 Fotoğraf Ekle</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={paylas} disabled={yukleniyor}>
            {yukleniyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.shareButtonText}>Paylaş</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, textAlign:'center', marginVertical: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 5 },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, minHeight: 100, marginBottom: 20, textAlignVertical: 'top' },
  photoButton: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'red', padding:5, borderRadius:15 },
  shareButton: { backgroundColor: COLORS.burgundy, padding: 15, borderRadius: 12, alignItems: 'center' },
  shareButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});