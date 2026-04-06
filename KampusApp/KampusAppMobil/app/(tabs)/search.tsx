import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    FlatList,
    Image, SafeAreaView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { API_URLS } from '../../config'; // YENİ EKLENDİ

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142', textMuted: '#838996', white: '#ffffff' };

export default function SearchScreen() {
  const [sorgu, setSorgu] = useState('');
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const ara = async (text: string) => {
    setSorgu(text);
    if (text.length < 2) { setSonuclar([]); return; }

    setYukleniyor(true);
    try {
      const id = await AsyncStorage.getItem('kullaniciId');
      // DİKKAT: API_URLS.ARA kullanıldı
      const response = await fetch(`${API_URLS.ARA}?sorgu=${text}&kullaniciId=${id}`);
      const data = await response.json();
      setSonuclar(data);
    } catch (e) {
      console.error(e);
    } finally {
      setYukleniyor(false);
    }
  };

  const islemYap = async (hedefId: number, mevcutDurum: string) => {
    const benId = await AsyncStorage.getItem('kullaniciId');
    if (!benId) return;

    const yeniDurum = mevcutDurum === 'TAKIP_ET' ? 'ISTEK_GONDERILDI' : 'TAKIP_ET';
    
    if (mevcutDurum === 'TAKIP_EDILIYOR') {
        Alert.alert("Takibi Bırak", "Emin misin?", [
            { text: "Vazgeç", style: "cancel" },
            { 
                text: "Evet, Bırak", onPress: () => {
                   const form = new FormData(); form.append('benId', benId); form.append('hedefId', hedefId.toString());
                   // DİKKAT: API_URLS.TAKIP_BIRAK
                   fetch(API_URLS.TAKIP_BIRAK, { method: 'POST', body: form });
                   guncelleListe(hedefId, 'TAKIP_ET');
                }
            }
        ]);
        return;
    }

    guncelleListe(hedefId, yeniDurum);

    const formData = new FormData();
    formData.append('benId', benId);
    formData.append('hedefId', hedefId.toString());
    // DİKKAT: API_URLS.TAKIP_ET
    fetch(API_URLS.TAKIP_ET, { method: 'POST', body: formData });
  };

  const guncelleListe = (id: number, yeniDurum: string) => {
    const yeniListe: any = sonuclar.map((item: any) => {
        if (item.id === id) return { ...item, durum: yeniDurum };
        return item;
    });
    setSonuclar(yeniListe);
  };

  const renderItem = ({ item }: { item: any }) => {
    let btnText = "Takip Et";
    let btnColor = COLORS.burgundy;
    let btnBg = COLORS.white;

    if (item.durum === 'TAKIP_EDILIYOR') {
        btnText = "Takip Ediliyor";
        btnColor = COLORS.white;
        btnBg = '#28a745'; 
    } else if (item.durum === 'ISTEK_GONDERILDI') {
        btnText = "İstek Gönderildi";
        btnColor = COLORS.textMuted;
        btnBg = '#e9ecef'; 
    }

    return (
      <View style={styles.userCard}>
        {item.profilResmi ? (
          <Image source={{ uri: `data:image/jpeg;base64,${item.profilResmi}` }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}><Text style={styles.avatarText}>{item.adSoyad.charAt(0)}</Text></View>
        )}
        
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.adSoyad}</Text>
          <Text style={styles.dept}>{item.bolum}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.followBtn, { backgroundColor: btnBg, borderColor: btnColor === COLORS.white ? btnBg : COLORS.burgundy }]}
          onPress={() => islemYap(item.id, item.durum)}
        >
          <Text style={{ color: btnColor === COLORS.white ? 'white' : COLORS.burgundy, fontWeight: 'bold', fontSize: 12 }}>
            {btnText}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Keşfet</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
          <TextInput 
            style={styles.input} 
            placeholder="Öğrenci veya Bölüm Ara..." 
            value={sorgu}
            onChangeText={ara}
          />
        </View>
      </View>

      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.burgundy} />
      ) : (
        <FlatList
          data={sonuclar}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
             sorgu.length > 0 ? 
             <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Sonuç bulunamadı.</Text> :
             <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.5 }}>
                <Ionicons name="people-outline" size={60} color="#ccc" />
                <Text style={{ color: '#999', marginTop: 10 }}>Arkadaşlarını bulmaya başla</Text>
             </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { backgroundColor: COLORS.white, padding: 20, paddingBottom: 15, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 15, height: 45 },
  input: { flex: 1, height: '100%', color: COLORS.textDark },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  placeholderAvatar: { backgroundColor: COLORS.burgundy, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  dept: { fontSize: 12, color: COLORS.textMuted },
  followBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, minWidth: 90, alignItems: 'center' }
});