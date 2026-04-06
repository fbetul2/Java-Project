import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ID'yi almak için lazım
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URLS } from '../config';

export const BildirimModal = () => {
  const [bildirimler, setBildirimler] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBildirim, setCurrentBildirim] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      // Sayfaya her gelindiğinde kontrol et
      const timer = setTimeout(() => {
          bildirimleriKontrolEt();
      }, 1000); 
      return () => clearTimeout(timer);
    }, [])
  );

  const bildirimleriKontrolEt = async () => {
    try {
      // 1. Önce ID'yi al
      const userId = await AsyncStorage.getItem('kullaniciId');
      if (!userId) return; // Giriş yapılmamışsa çık

      // 2. ID ile backend'e sor (Sorunun çözümü burada)
      const response = await fetch(`${API_URLS.BILDIRIMLER}?kullaniciId=${userId}`); 
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setBildirimler(data);
          setCurrentBildirim(data[0]); // İlk bildirimi seç
          setModalVisible(true);       // Modalı aç
        }
      }
    } catch (error) {
      console.log("Bildirim hatası:", error);
    }
  };

  const kapatVeSil = async () => {
    if (!currentBildirim) return;

    try {
      // Backend'den sil (Veritabanından uçar)
      await fetch(`${API_URLS.BILDIRIMLER}/${currentBildirim.id}`, { 
        method: 'DELETE',
      });

      // Listeden çıkar
      const kalanBildirimler = bildirimler.filter(b => b.id !== currentBildirim.id);
      setBildirimler(kalanBildirimler);

      // Başka bildirim varsa onu göster, yoksa kapat
      if (kalanBildirimler.length > 0) {
        setCurrentBildirim(kalanBildirimler[0]);
      } else {
        setModalVisible(false);
        setCurrentBildirim(null);
      }

    } catch (error) {
      console.log("Silme hatası:", error);
      setModalVisible(false); // Hata olursa kapat ki takılmasın
    }
  };

  if (!modalVisible || !currentBildirim) return null;

  return (
    <Modal transparent visible={modalVisible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          
          {/* Header Kısmı */}
          <View style={styles.header}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name="notifications" size={24} color="#fff" style={{marginRight:10}} />
                <Text style={styles.title}>YÖNETİCİ MESAJI</Text>
            </View>
            
            {/* SENİN İSTEDİĞİN X BUTONU */}
            <TouchableOpacity onPress={kapatVeSil} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* İçerik Kısmı */}
          <View style={styles.content}>
            <Text style={styles.messageBody}>
              {currentBildirim.mesaj}
            </Text>
            
            <View style={styles.dateContainer}>
                 <Text style={styles.date}>
                    {new Date(currentBildirim.tarih).toLocaleDateString()} - Yönetim
                 </Text>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', // Arka planı iyice kararttık, gözden kaçmasın
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  alertBox: { 
    width: '100%', 
    maxWidth: 350,
    backgroundColor: 'white', 
    borderRadius: 15, 
    overflow: 'hidden', 
    elevation: 20 
  },
  header: { 
    backgroundColor: '#b60e26', // Senin burgundy rengin
    padding: 15, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  closeBtn: {
    padding: 5,
  },
  content: { 
    padding: 30, 
    alignItems: 'center' 
  },
  messageBody: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#333', 
    marginBottom: 20,
    lineHeight: 26
  },
  dateContainer: {
      marginTop: 10,
      borderTopWidth: 1,
      borderColor: '#eee',
      width: '100%',
      alignItems: 'center',
      paddingTop: 10
  },
  date: { 
    fontSize: 12, 
    color: '#999',
    fontStyle: 'italic'
  }
});