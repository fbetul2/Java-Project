import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- EKRAN İMPORTLARI ---
import AdminScreen from '../../src/screens/AdminScreen';
import FavoritesScreen from '../../src/screens/FavoritesScreen';
import HomeScreen from '../../src/screens/HomeScreen';
import IlanDetayScreen from '../../src/screens/IlanDetayScreen';
import LoginScreen from '../../src/screens/LoginScreen';
import MyApplicationsScreen from '../../src/screens/MyApplicationsScreen';
import ProfileScreen from '../../src/screens/ProfileScreen';
import RegisterScreen from '../../src/screens/RegisterScreen';
// İşveren Ekranları
import BasvurularScreen from '../../src/screens/BasvurularScreen';
import IlanDuzenleScreen from '../../src/screens/IlanDuzenleScreen';
import IlanEkleScreen from '../../src/screens/IlanEkleScreen';
import IlanlarimScreen from '../../src/screens/IlanlarimScreen';
import PaymentScreen from '../../src/screens/PaymentScreen';

// Renk Sabiti (Lacivert)
const PRIMARY_COLOR = '#1e3a8a';

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState('home'); 
  const [user, setUser] = useState<any>(null); 
  
  // Seçili ilan ve işlem verileri
  const [selectedIlanId, setSelectedIlanId] = useState<number | null>(null);
  const [selectedIlanBaslik, setSelectedIlanBaslik] = useState<string>('');
  const [selectedPaket, setSelectedPaket] = useState<any>(null); 
  const [editingIlan, setEditingIlan] = useState<any>(null);

  // Uygulama açıldığında AsyncStorage'dan kullanıcı bilgisini yükle
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          if (parsedUser.rol === 'ADMIN') {
            setCurrentScreen('admin-panel');
          }
        }
      } catch (error) {
        console.log('AsyncStorage yükleme hatası:', error);
      }
    };
    loadUser();
  }, []);

  // --- ACTIONS ---
  const handleLoginSuccess = async (userData: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.log('AsyncStorage kaydetme hatası:', error);
    }
    setUser(userData);
    if (userData.rol === 'ADMIN') {
        setCurrentScreen('admin-panel');
    } else {
        setCurrentScreen('home');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.log('AsyncStorage temizleme hatası:', error);
    }
    setUser(null);
    setCurrentScreen('home');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  const handleIlanClick = (id: number) => {
    setSelectedIlanId(id);
    setCurrentScreen('detail');
  };

  // --- İŞVEREN AKSİYONLARI ---
  
  const handleBasvurularClick = (id: number, baslik: string) => {
      setSelectedIlanId(id);
      setSelectedIlanBaslik(baslik);
      setCurrentScreen('basvurular');
  };

  const handleEditClick = (ilan: any) => {
      setEditingIlan(ilan);
      setCurrentScreen('edit-ad');
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (currentScreen) {
      // 1. AUTH EKRANLARI
      case 'login':
        return (
            <LoginScreen 
                onLoginSuccess={handleLoginSuccess} 
                onCancel={() => setCurrentScreen('home')}
                onRegisterClick={() => setCurrentScreen('register')} 
            />
        );
      case 'admin-panel':
        return <AdminScreen user={user} onLogout={handleLogout} />;
      case 'register':
        return (
            <RegisterScreen
                onRegisterSuccess={() => setCurrentScreen('login')}
                onBackToLogin={() => setCurrentScreen('login')}
            />
        );

      // 2. GENEL EKRANLAR
      case 'detail':
        return (
          <IlanDetayScreen 
            route={{ params: { ilanId: selectedIlanId } }} 
            navigation={{ 
              goBack: () => setCurrentScreen('home'),
              navigate: (screen: string) => setCurrentScreen(screen)
            }} 
            user={user}
          />
        );
      
      case 'profile':
        return (
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout} 
            onBack={() => setCurrentScreen('home')} 
            onUpdateSuccess={handleUserUpdate}
          />
        );

      // 3. İŞ ARAYAN EKRANLARI
      case 'my-applications':
        return (
            <MyApplicationsScreen 
                user={user} 
                onBack={() => setCurrentScreen('home')} 
                onIlanClick={handleIlanClick} 
            />
        );
      
      case 'favorites': 
        return (
            <FavoritesScreen 
                user={user} 
                onBack={() => setCurrentScreen('home')} 
                onIlanClick={handleIlanClick} 
            />
        );

      // 4. İŞVEREN EKRANLARI
      case 'my-ads': // İlanlarım
        return (
            <IlanlarimScreen 
                user={user} 
                onIlanEkleClick={() => setCurrentScreen('add-ad')}
                onEditClick={handleEditClick}           
                onBasvurularClick={handleBasvurularClick}
                // Mock Navigation: PaymentScreen'e veri taşıyoruz
                navigation={{
                    navigate: (screen: string, params: any) => {
                        if (screen === 'Payment') {
                            setSelectedIlanId(params.ilanId);
                            setSelectedIlanBaslik(params.ilanBaslik);
                            setSelectedPaket(params.paket);
                            setCurrentScreen('payment');
                        }
                    }
                }}
            />
        );

      case 'add-ad': // İlan Ekle
        return (
            <IlanEkleScreen 
                user={user}
                navigation={{ goBack: () => setCurrentScreen('my-ads') }}
                onIlanEklendi={() => setCurrentScreen('my-ads')}
            />
        );

      case 'edit-ad': // İlan Düzenle
        return (
            <IlanDuzenleScreen 
                navigation={{ goBack: () => setCurrentScreen('my-ads') }}
                route={{ params: { ilan: editingIlan } }} 
                onIlanGuncellendi={() => setCurrentScreen('my-ads')}
            />
        );

      case 'basvurular': // Başvurular Listesi
        return (
            <BasvurularScreen 
                route={{ params: { ilanId: selectedIlanId, baslik: selectedIlanBaslik } }}
                navigation={{ goBack: () => setCurrentScreen('my-ads') }}
            />
        );

      // 5. ÖDEME EKRANI (YENİ)
      case 'payment':
        return (
            <PaymentScreen 
                route={{ 
                    params: { 
                        ilanId: selectedIlanId, 
                        ilanBaslik: selectedIlanBaslik, 
                        paket: selectedPaket 
                    } 
                }}
                navigation={{ goBack: () => setCurrentScreen('my-ads') }}
            />
        );
      
      case 'home':
      default:
        return (
          <HomeScreen 
            user={user} 
            onLoginPress={() => setCurrentScreen('login')}
            onLogoutPress={handleLogout}
            onIlanClick={handleIlanClick}
            onProfileClick={() => setCurrentScreen('profile')} 
          />
        );
    }
  };

  // --- BOTTOM TAB BAR MANTIĞI ---
  const showTabBar = ['home', 'my-applications', 'favorites', 'profile', 'my-ads'].includes(currentScreen);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* ALT MENÜ (TAB BAR) */}
      {showTabBar && (
        <View style={styles.tabBar}>
          
          {/* 1. ANA SAYFA TAB */}
          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={() => setCurrentScreen('home')}
          >
            <Ionicons 
              name={currentScreen === 'home' ? "home" : "home-outline"} 
              size={24} 
              // Mor yerine PRIMARY_COLOR
              color={currentScreen === 'home' ? PRIMARY_COLOR : "#94a3b8"} 
            />
            <Text style={[styles.tabText, currentScreen === 'home' && styles.activeTabText]}>İlanlar</Text>
          </TouchableOpacity>

          {/* İŞ ARAYAN MENÜSÜ */}
          {user?.rol === 'IS_ARAYAN' && (
            <>
                <TouchableOpacity 
                  style={styles.tabItem} 
                  onPress={() => setCurrentScreen('my-applications')}
                >
                  <Ionicons 
                    name={currentScreen === 'my-applications' ? "document-text" : "document-text-outline"} 
                    size={24} 
                    // Mor yerine PRIMARY_COLOR
                    color={currentScreen === 'my-applications' ? PRIMARY_COLOR : "#94a3b8"} 
                  />
                  <Text style={[styles.tabText, currentScreen === 'my-applications' && styles.activeTabText]}>Başvurularım</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.tabItem} 
                  onPress={() => setCurrentScreen('favorites')}
                >
                  <Ionicons 
                    name={currentScreen === 'favorites' ? "heart" : "heart-outline"} 
                    size={24} 
                    // Mor yerine PRIMARY_COLOR
                    color={currentScreen === 'favorites' ? PRIMARY_COLOR : "#94a3b8"} 
                  />
                  <Text style={[styles.tabText, currentScreen === 'favorites' && styles.activeTabText]}>Favorilerim</Text>
                </TouchableOpacity>
            </>
          )}

          {/* İŞVEREN MENÜSÜ */}
          {user?.rol === 'ISVEREN' && (
            <>
                <TouchableOpacity 
                  style={styles.tabItem} 
                  onPress={() => setCurrentScreen('my-ads')}
                >
                  <Ionicons 
                    name={currentScreen === 'my-ads' ? "briefcase" : "briefcase-outline"} 
                    size={24} 
                    // Mor yerine PRIMARY_COLOR
                    color={currentScreen === 'my-ads' ? PRIMARY_COLOR : "#94a3b8"} 
                  />
                  <Text style={[styles.tabText, currentScreen === 'my-ads' && styles.activeTabText]}>İlanlarım</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.tabItem} 
                  onPress={() => setCurrentScreen('add-ad')}
                >
                  <Ionicons 
                    name={currentScreen === 'add-ad' ? "add-circle" : "add-circle-outline"} 
                    size={24} 
                    // Mor yerine PRIMARY_COLOR
                    color={currentScreen === 'add-ad' ? PRIMARY_COLOR : "#94a3b8"} 
                  />
                  <Text style={[styles.tabText, currentScreen === 'add-ad' && styles.activeTabText]}>İlan Ekle</Text>
                </TouchableOpacity>
            </>
          )}

          {/* 4. PROFİL TAB */}
          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={() => {
                if (user) {
                    setCurrentScreen('profile');
                } else {
                    setCurrentScreen('login');
                }
            }}
          >
            <Ionicons 
              name={currentScreen === 'profile' ? "person" : "person-outline"} 
              size={24} 
              // Mor yerine PRIMARY_COLOR
              color={currentScreen === 'profile' ? PRIMARY_COLOR : "#94a3b8"} 
            />
            <Text style={[styles.tabText, currentScreen === 'profile' && styles.activeTabText]}>
                {user ? 'Profilim' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>

        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { flex: 1 }, 
  
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    height: Platform.OS === 'ios' ? 85 : 65, 
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    paddingTop: 5,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    color: '#94a3b8',
    fontWeight: '500',
  },
  activeTabText: {
    // Mor yerine PRIMARY_COLOR
    color: PRIMARY_COLOR,
    fontWeight: '700',
  }
});