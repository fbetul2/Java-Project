import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // DÜZELTME BURADA
import { API_URLS } from '../config'; // Yolu kendi dosya yapına göre kontrol et (../config veya ../../constants/config)

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142' };

export default function HistoryScreen() {
  const [gecmis, setGecmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getir = async () => {
        try {
            const id = await AsyncStorage.getItem('kullaniciId');
            
            // URL'yi artık doğrudan config'den alıyoruz, hata riskini azalttık
            const url = `${API_URLS.CALISMA_GECMISI_GETIR}?kullaniciId=${id}`;
            console.log("History URL:", url);

            const response = await fetch(url);
            const text = await response.text();

            try {
                const data = JSON.parse(text);
                setGecmis(data);
            } catch (jsonError) {
                console.log("JSON Parse Hatası (Muhtemelen HTML geldi):", text.substring(0, 100)); // İlk 100 karakteri bas
            }
        } catch (err) {
            console.log("Bağlantı Hatası:", err);
        } finally {
            setLoading(false);
        }
    };
    getir();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
        <View style={styles.iconBox}>
            <Text style={styles.iconText}>{item.ders ? item.ders.charAt(0).toUpperCase() : '?'}</Text>
        </View>
        <View style={{flex:1, marginLeft:15}}>
            <Text style={styles.lessonTitle}>{item.ders}</Text>
            <Text style={styles.dateText}>{item.tarih}</Text>
        </View>
        <View style={styles.timeBox}>
            <Text style={styles.timeText}>{item.sure} dk</Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={COLORS.burgundy} /></TouchableOpacity>
        <Text style={styles.title}>Çalışma Geçmişi</Text>
        <View style={{width:24}} />
      </View>

      {loading ? <ActivityIndicator color={COLORS.burgundy} style={{marginTop:20}} /> : (
          <FlatList 
            data={gecmis} 
            renderItem={renderItem} 
            keyExtractor={(item, index) => index.toString()} 
            contentContainerStyle={{padding:20}}
            ListEmptyComponent={
                <View style={{alignItems:'center', marginTop:50, opacity:0.5}}>
                    <Ionicons name="time-outline" size={50} color="#ccc"/>
                    <Text style={{color:'#999', marginTop:10}}>Henüz çalışma kaydı yok.</Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: 'white', borderBottomWidth:1, borderColor:'#eee' },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 20, fontWeight: 'bold', color: COLORS.burgundy },
  lessonTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  dateText: { fontSize: 12, color: '#888', marginTop: 2 },
  timeBox: { backgroundColor: '#e6fffa', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },
  timeText: { color: '#28a745', fontWeight: 'bold' }
});