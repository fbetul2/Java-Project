import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList, Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet, Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_URLS } from '../../config'; // YENİ EKLENDİ

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142', white: '#ffffff', green: '#28a745', orange: '#ffc107' };

export default function PomodoroScreen() {
  const [saniye, setSaniye] = useState(25 * 60);
  const [aktif, setAktif] = useState(false);
  const [baslangicSuresi, setBaslangicSuresi] = useState(25 * 60);
  const [girilenDakika, setGirilenDakika] = useState('25'); 
  const [ders, setDers] = useState('');
  const [liderlik, setLiderlik] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (aktif && saniye > 0) {
      interval = setInterval(() => { setSaniye(s => s - 1); }, 1000);
    } else if (saniye === 0 && aktif) {
      setAktif(false);
      Alert.alert("Süre Bitti!", "Harika iş çıkardın. Kaydetmeyi unutma!");
    }
    return () => clearInterval(interval);
  }, [aktif, saniye]);

  useFocusEffect(useCallback(() => { tabloyuGetir(); }, []));

  const formatZaman = (sn: number) => {
    const dk = Math.floor(sn / 60);
    const s = sn % 60;
    return `${dk < 10 ? '0' : ''}${dk}:${s < 10 ? '0' : ''}${s}`;
  };

  const sureyiAyarla = () => {
      const dk = parseInt(girilenDakika);
      if (isNaN(dk) || dk < 1) { Alert.alert("Hata", "Geçerli bir dakika gir."); return; }
      setBaslangicSuresi(dk * 60);
      setSaniye(dk * 60);
      setAktif(false);
  };

  const baslatDurdur = () => {
      if (!aktif) {
          Alert.alert("Odaklanma Modu", "Telefonunun 'Rahatsız Etme' modunu açtın mı?", [
              { text: "Hayır, Açayım", onPress: () => console.log("User warned") },
              { text: "Evet, Başla", onPress: () => setAktif(true) }
          ]);
      } else {
          setAktif(false);
      }
  };

  const sifirla = () => { setAktif(false); setSaniye(baslangicSuresi); };

  const kaydet = async () => {
    if (!ders.trim()) { Alert.alert("Eksik", "Lütfen ders adı giriniz."); return; }
    const calisilanDakika = Math.floor((baslangicSuresi - saniye) / 60);
    if (calisilanDakika < 1) { Alert.alert("Hata", "En az 1 dakika çalışmalısın."); return; }

    const id = await AsyncStorage.getItem('kullaniciId');
    const form = new FormData();
    form.append('kullaniciId', id || '');
    form.append('sure', calisilanDakika.toString());
    form.append('ders', ders);

    try {
        // DİKKAT: Config dosyasından çekiyoruz
        await fetch(API_URLS.CALISMA_KAYDET, { method: 'POST', body: form });
        Alert.alert("Başarılı", `${calisilanDakika} dakika kaydedildi!`);
        setDers(''); sifirla(); tabloyuGetir();
    } catch (e) { Alert.alert("Hata", "Kaydedilemedi."); }
  };

  const tabloyuGetir = async () => {
      setRefreshing(true);
      const id = await AsyncStorage.getItem('kullaniciId');
      // DİKKAT: Config dosyasından çekiyoruz
      fetch(`${API_URLS.LIDERLIK}?kullaniciId=${id}`)
        .then(res => res.json())
        .then(data => { setLiderlik(data); setRefreshing(false); })
        .catch(e => setRefreshing(false));
  };

  const renderSkor = ({ item, index }: { item: any, index: number }) => (
      <View style={styles.scoreRow}>
          <Text style={[styles.rank, {color: index < 3 ? COLORS.burgundy : '#666'}]}>{index + 1}.</Text>
          {item.resimBase64 ? <Image source={{ uri: `data:image/jpeg;base64,${item.resimBase64}` }} style={styles.scoreAvatar} /> : <View style={[styles.scoreAvatar, {backgroundColor:'#ccc'}]} />}
          <Text style={styles.scoreName}>{item.adSoyad}</Text>
          <Text style={styles.scorePoints}>{item.toplamDakika} dk</Text>
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={tabloyuGetir} />}>
          <View style={styles.timerCard}>
              <Text style={styles.timerTitle}>Pomodoro</Text>
              
              <View style={{flexDirection:'row', alignItems:'center', marginBottom:20}}>
                  <TextInput 
                      style={styles.timeInput} 
                      value={girilenDakika} 
                      onChangeText={setGirilenDakika} 
                      keyboardType="numeric" 
                      maxLength={3}
                  />
                  <Text style={{fontSize:16, marginRight:10}}>dk</Text>
                  <TouchableOpacity onPress={sureyiAyarla} style={styles.setBtn}><Text style={{color:'white'}}>Ayarla</Text></TouchableOpacity>
              </View>

              <View style={styles.circle}><Text style={styles.timerText}>{formatZaman(saniye)}</Text></View>
              
              <View style={styles.controls}>
                  <TouchableOpacity onPress={baslatDurdur} style={[styles.btn, {backgroundColor: aktif ? COLORS.orange : COLORS.green}]}>
                      <Ionicons name={aktif ? "pause" : "play"} size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={sifirla} style={[styles.btn, {backgroundColor: COLORS.burgundy}]}>
                      <Ionicons name="refresh" size={24} color="white" />
                  </TouchableOpacity>
              </View>

              <View style={styles.saveArea}>
                  <TextInput style={styles.input} placeholder="Ders adı..." value={ders} onChangeText={setDers} />
                  <TouchableOpacity onPress={kaydet} style={styles.saveBtn}><Text style={{color:'white', fontWeight:'bold'}}>Kaydet</Text></TouchableOpacity>
              </View>
          </View>

          <View style={styles.leaderboard}>
              <Text style={styles.lbTitle}>🏆 Liderlik Tablosu</Text>
              <FlatList data={liderlik} renderItem={renderSkor} keyExtractor={(item:any, index) => index.toString()} scrollEnabled={false} />
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain },
  timerCard: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 20, alignItems: 'center', elevation: 5 },
  timerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  circle: { width: 150, height: 150, borderRadius: 75, borderWidth: 5, borderColor: COLORS.burgundy, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  timerText: { fontSize: 40, fontWeight: 'bold', color: COLORS.burgundy },
  controls: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  btn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  saveArea: { flexDirection: 'row', width: '100%', gap: 10 },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10 },
  saveBtn: { backgroundColor: COLORS.burgundy, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10 },
  leaderboard: { margin: 20, marginTop: 0 },
  lbTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  rank: { fontSize: 18, fontWeight: 'bold', width: 30 },
  scoreAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  scoreName: { flex: 1, fontWeight: 'bold', color: COLORS.textDark },
  scorePoints: { fontWeight: 'bold', color: COLORS.burgundy },
  timeInput: { backgroundColor:'#f0f0f0', width:50, padding:5, borderRadius:5, textAlign:'center', fontSize:16, marginRight:5 },
  setBtn: { backgroundColor:'#666', padding:8, borderRadius:5 }
});