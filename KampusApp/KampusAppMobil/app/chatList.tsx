import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
// YENİ GÜVENLİ ALAN
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../config'; // Config yolunu kontrol et

export default function ChatListScreen() {
  const [arkadaslar, setArkadaslar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const router = useRouter();

  useEffect(() => {
    arkadaslariGetir();
  }, []);

  const arkadaslariGetir = async () => {
    const id = await AsyncStorage.getItem('kullaniciId');
    if (!id) return;

    try {
        // Backend'de eklediğimiz /arkadaslar metoduna gidiyor
        const response = await fetch(`${API_URLS.BASE_URL}/api/mesaj/arkadaslar?kullaniciId=${id}`);
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                setArkadaslar(data);
            }
        } catch (e) {
            console.log("Liste Çekme Hatası:", text.substring(0, 50));
        }
    } catch (e) {
        console.log("Bağlantı hatası:", e);
    } finally {
        setYukleniyor(false);
    }
  };

  const sohbetiAc = (karsiId: number, adSoyad: string) => {
    // Tıkladığın kişinin ID'sini alıp mesaj ekranına gidiyoruz
    router.push({
        pathname: '/chatdetail',
        params: { id: karsiId.toString(), ad: adSoyad }
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => sohbetiAc(item.id, item.adSoyad)}>
      {item.profilResmi ? (
        <Image source={{ uri: `data:image/jpeg;base64,${item.profilResmi}` }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]}><Text style={styles.initial}>{item.adSoyad ? item.adSoyad.charAt(0) : '?'}</Text></View>
      )}
      <View style={{flex:1}}>
        <Text style={styles.name}>{item.adSoyad}</Text>
        <Text style={styles.subText}>Mesajlaşmak için dokun</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fb" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#b60e26" />
        </TouchableOpacity>
        <Text style={styles.title}>Sohbetler</Text>
        <View style={{width:24}} />
      </View>

      {yukleniyor ? (
        <ActivityIndicator size="large" color="#b60e26" style={{marginTop:20}} />
      ) : (
        <FlatList 
          data={arkadaslar} 
          renderItem={renderItem} 
          keyExtractor={(item:any) => item.id.toString()}
          contentContainerStyle={{padding:15}}
          ListEmptyComponent={
            <View style={{alignItems:'center', marginTop:50}}>
                <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
                <Text style={{color:'#999', marginTop:10}}>Görünürde kimse yok.</Text>
                <Text style={{color:'#999', fontSize:12, textAlign:'center', paddingHorizontal:20}}>
                    (Listede birini görmek için, hem sen onu takip etmelisin hem de o seni takip etmeli.)
                </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fb' },
  header: { flexDirection:'row', justifyContent:'space-between', padding:15, alignItems:'center', backgroundColor:'white', borderBottomWidth:1, borderColor:'#eee' },
  title: { fontSize: 18, fontWeight:'bold', color:'#2d3142' },
  card: { flexDirection:'row', alignItems:'center', backgroundColor:'white', padding:15, marginBottom:10, borderRadius:12, elevation:1 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  placeholder: { backgroundColor:'#b60e26', width:50, height:50, borderRadius:25, justifyContent:'center', alignItems:'center', marginRight:15 },
  initial: { color:'white', fontSize:20, fontWeight:'bold' },
  name: { fontSize:16, fontWeight:'bold', color:'#2d3142' },
  subText: { fontSize:12, color:'#888', marginTop:2 }
});