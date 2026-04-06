import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert,
    FlatList,
    KeyboardAvoidingView, Platform,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../config';

export default function ChatDetailScreen() {
  const { id, ad } = useLocalSearchParams();
  const [mesajlar, setMesajlar] = useState<any>([]);
  const [metin, setMetin] = useState('');
  const [benimId, setBenimId] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const router = useRouter();

  // ID Kontrolü
  if (!id) {
     return (
         <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'white'}}>
             <ActivityIndicator size="large" color="#b60e26" />
         </SafeAreaView>
     );
  }

  useEffect(() => {
    idYukle();
    const timer = setInterval(() => {
        if(benimId) mesajlariGetir(benimId, false);
    }, 3000); 
    return () => clearInterval(timer);
  }, [benimId]);

  const idYukle = async () => {
    const bId = await AsyncStorage.getItem('kullaniciId');
    if (bId) {
        setBenimId(bId);
        mesajlariGetir(bId, true);
    }
  };

  const mesajlariGetir = async (bId: string, showLoading = false) => {
    if(showLoading) setYukleniyor(true);
    try {
        const response = await fetch(`${API_URLS.MESAJ_GECMIS}?benId=${bId}&karsiId=${id}`);
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) setMesajlar(data);
        } catch (jsonError) { console.log("JSON Hatası"); }
    } catch (e) { console.log("Ağ hatası:", e); } 
    finally { setYukleniyor(false); }
  };

  const gonder = async () => {
    if(!metin.trim() || !benimId) return;
    const gonderilecekMetin = metin;
    setMetin(''); 

    const form = new FormData();
    form.append('gonderenId', benimId);
    form.append('aliciId', id as string);
    form.append('metin', gonderilecekMetin);
    
    const geciciMesaj = { id: Date.now(), metin: gonderilecekMetin, gonderenId: parseInt(benimId) };
    setMesajlar((prev:any) => [...prev, geciciMesaj]);

    try {
        await fetch(API_URLS.MESAJ_GONDER, { method:'POST', body:form });
        mesajlariGetir(benimId, false);
    } catch (e) { Alert.alert("Hata", "Mesaj gönderilemedi."); }
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'white'}}>
      {/* KLAVYE AYARI: behavior 'padding' genelde en iyisidir. Flex:1 çok önemli */}
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Gerekirse burayı artır (örn: 20)
      >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={{padding:5}}>
                <Ionicons name="arrow-back" size={24} color="#b60e26" />
            </TouchableOpacity>
            <Text style={{fontWeight:'bold', fontSize:16, color:'#2d3142'}}>{ad || 'Sohbet'}</Text>
            <View style={{width:24}} />
          </View>

          {/* LİSTE */}
          <View style={{flex: 1}}>
              {yukleniyor && mesajlar.length === 0 ? (
                  <ActivityIndicator size="large" color="#b60e26" style={{marginTop: 20}} />
              ) : (
                  <FlatList
                    data={mesajlar}
                    keyExtractor={(item:any) => item.id.toString()}
                    // Liste ters dönmesin ama son mesaja odaklansın
                    contentContainerStyle={{paddingBottom: 20, paddingTop: 10}}
                    renderItem={({item}) => (
                      <View style={[styles.msgBox, item.gonderenId.toString() === benimId ? styles.myMsg : styles.theirMsg]}>
                        <Text style={{color: item.gonderenId.toString() === benimId ? 'white' : 'black'}}>{item.metin}</Text>
                      </View>
                    )}
                    ListEmptyComponent={<Text style={{textAlign:'center', color:'#999', marginTop:20}}>Henüz mesaj yok.</Text>}
                  />
              )}
          </View>

          {/* GİRİŞ ALANI */}
          <View style={styles.inputArea}>
            <TextInput 
              style={styles.input} 
              value={metin} 
              onChangeText={setMetin} 
              placeholder="Mesaj yaz..." 
              multiline
            />
            <TouchableOpacity onPress={gonder} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:15, borderBottomWidth:1, borderColor:'#eee', backgroundColor:'white' },
  msgBox: { padding:12, marginHorizontal:15, marginVertical:5, borderRadius:15, maxWidth:'75%' },
  myMsg: { alignSelf:'flex-end', backgroundColor:'#b60e26', borderBottomRightRadius: 2 },
  theirMsg: { alignSelf:'flex-start', backgroundColor:'#f0f0f0', borderBottomLeftRadius: 2 },
  inputArea: { flexDirection:'row', padding:10, alignItems:'center', borderTopWidth:1, borderColor:'#eee', backgroundColor:'white' },
  input: { flex:1, backgroundColor:'#f5f5f5', borderRadius:20, paddingHorizontal:15, paddingVertical:10, marginRight:10, maxHeight: 100 },
  sendBtn: { backgroundColor: '#b60e26', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' }
});