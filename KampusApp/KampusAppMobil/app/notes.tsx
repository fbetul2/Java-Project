import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../config';

const COLORS = { burgundy: '#b60e26', bgMain: '#f8f9fb', textDark: '#2d3142', muted: '#888' };

interface Not { id: number; icerik: string; tarih: string; tamamlandi: boolean; }

export default function NotesScreen() {
  const [notlar, setNotlar] = useState<Not[]>([]);
  const [yeniNot, setYeniNot] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { notlariGetir(); }, []);

  const notlariGetir = async () => {
    const id = await AsyncStorage.getItem('kullaniciId');
    fetch(`${API_URLS.NOT_LISTE}?kullaniciId=${id}`)
      .then(res => res.json())
      .then(data => { setNotlar(data); setLoading(false); })
      .catch(err => { console.log(err); setLoading(false); });
  };

  const notEkle = async () => {
    if (!yeniNot.trim()) return;
    const id = await AsyncStorage.getItem('kullaniciId');
    const form = new FormData();
    form.append('kullaniciId', id || '');
    form.append('icerik', yeniNot);

    const geciciNot: Not = { id: Date.now(), icerik: yeniNot, tarih: 'Şimdi', tamamlandi: false };
    setNotlar([geciciNot, ...notlar]);
    setYeniNot('');

    await fetch(API_URLS.NOT_EKLE, { method: 'POST', body: form });
    notlariGetir();
  };

  const islemYap = async (notId: number, tip: 'SIL' | 'DURUM') => {
    const id = await AsyncStorage.getItem('kullaniciId');
    const url = tip === 'SIL' ? API_URLS.NOT_SIL : API_URLS.NOT_DURUM;
    const form = new FormData();
    form.append('kullaniciId', id || '');
    form.append('notId', notId.toString());

    if (tip === 'DURUM') {
        setNotlar(prev => prev.map(n => n.id === notId ? {...n, tamamlandi: !n.tamamlandi} : n));
    } else {
        setNotlar(prev => prev.filter(n => n.id !== notId));
    }
    await fetch(url, { method: 'POST', body: form });
  };

  const renderNot = ({ item }: { item: Not }) => (
    <View style={[styles.card, item.tamamlandi && styles.cardDone]}>
        <TouchableOpacity style={styles.checkBtn} onPress={() => islemYap(item.id, 'DURUM')}>
            <Ionicons name={item.tamamlandi ? "checkbox" : "square-outline"} size={24} color={COLORS.burgundy} />
        </TouchableOpacity>
        <View style={{flex:1, marginLeft:10}}>
            <Text style={[styles.noteText, item.tamamlandi && styles.textDone]}>{item.icerik}</Text>
            <Text style={styles.dateText}>{item.tarih}</Text>
        </View>
        <TouchableOpacity onPress={() => islemYap(item.id, 'SIL')}>
            <Ionicons name="trash-outline" size={20} color="#999" />
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.burgundy} />
            </TouchableOpacity>
            <Text style={styles.title}>Notlarım</Text>
            <View style={{width:24}} />
          </View>

          <View style={{flex: 1}}>
              {loading ? <ActivityIndicator color={COLORS.burgundy} style={{marginTop:20}} /> : (
                  <FlatList 
                    data={notlar} 
                    renderItem={renderNot} 
                    keyExtractor={(item) => item.id.toString()} 
                    contentContainerStyle={{padding:20}}
                    ListEmptyComponent={<Text style={{textAlign:'center', color:'#999', marginTop:20}}>Henüz notun yok.</Text>}
                  />
              )}
          </View>

          <View style={styles.inputArea}>
              <TextInput style={styles.input} placeholder="Yeni not ekle..." value={yeniNot} onChangeText={setYeniNot} />
              <TouchableOpacity style={styles.addBtn} onPress={notEkle}>
                  <Ionicons name="arrow-up" size={24} color="white" />
              </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: 'white', borderBottomWidth:1, borderColor:'#eee' },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  cardDone: { backgroundColor: '#f0f0f0', opacity: 0.7 },
  checkBtn: { padding: 5 },
  noteText: { fontSize: 16, color: COLORS.textDark },
  textDone: { textDecorationLine: 'line-through', color: COLORS.muted },
  dateText: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  addBtn: { backgroundColor: COLORS.burgundy, width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' }
});