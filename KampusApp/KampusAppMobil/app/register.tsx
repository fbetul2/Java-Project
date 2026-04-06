import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { API_URLS } from '../config'; // YENİ EKLENDİ

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142', textMuted: '#838996', white: '#ffffff', border: '#e5e7eb' };

export default function RegisterScreen() {
  const router = useRouter();
  const [adSoyad, setAdSoyad] = useState('');
  const [bolum, setBolum] = useState('');
  const [kadi, setKadi] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const kayitOl = async () => {
    if (!adSoyad || !bolum || !kadi || !sifre) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurunuz.");
      return;
    }

    setYukleniyor(true);

    try {
      // DİKKAT: API_URLS.KAYIT
      const response = await fetch(API_URLS.KAYIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adSoyad, bolum, kullaniciAdi: kadi, sifre }),
      });
      const data = await response.json();
      setYukleniyor(false);

      if (data.basarili) {
        Alert.alert("Tebrikler", data.mesaj, [
            { text: "Giriş Yap", onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert("Hata", data.mesaj);
      }
    } catch (error) {
      setYukleniyor(false);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgMain} />
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent:'center'}}>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
           <Image source={require('../assets/images/1.png')} style={{ width: 100, height: 100, marginBottom:10 }} resizeMode="contain" />
           <Text style={styles.appTitle}>Aramıza Katıl</Text>
           <Text style={styles.subTitle}>KampüsApp ailesine hoşgeldin!</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput style={styles.input} placeholder="Örn: Betul Fidan" value={adSoyad} onChangeText={setAdSoyad} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bölüm</Text>
            <TextInput style={styles.input} placeholder="Örn: Bilgisayar Müh." value={bolum} onChangeText={setBolum} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput style={styles.input} placeholder="Kullanıcı adı belirle" value={kadi} onChangeText={setKadi} autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput style={styles.input} placeholder="Güçlü bir şifre" value={sifre} onChangeText={setSifre} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={kayitOl} disabled={yukleniyor}>
            {yukleniyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Kayıt Ol</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{marginTop: 20, alignItems:'center'}} onPress={() => router.back()}>
             <Text style={{color: COLORS.textMuted}}>Zaten hesabın var mı? <Text style={{color: COLORS.burgundy, fontWeight:'bold'}}>Giriş Yap</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain, padding: 20 },
  backButton: { position:'absolute', top: 10, left: 20, zIndex: 10 },
  headerContainer: { alignItems: 'center', marginBottom: 20, marginTop: 40 },
  appTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
  subTitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 5 },
  card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 25, elevation: 5 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: COLORS.textDark, marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 16 },
  registerButton: { backgroundColor: COLORS.burgundy, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  registerButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});