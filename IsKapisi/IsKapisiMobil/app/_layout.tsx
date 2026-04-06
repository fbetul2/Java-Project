import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native'; // <-- EKLENDİ: Kapsayıcı için gerekli

// --- BİLEŞEN IMPORTLARI ---
import AIChatButton from '../src/screens/AIChatButton'; // (Yolunu doğru kontrol et, components klasöründeyse oradan al)

// --- EKRAN IMPORTLARI ---
import BasvurularScreen from '../src/screens/BasvurularScreen';
import IlanDetayScreen from '../src/screens/IlanDetayScreen';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';

import TabsLayout from './(tabs)/_layout';

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      
      {/* KRİTİK DOKUNUŞ: 
          Navigasyon ve Butonu üst üste koymak için bir View açtık.
      */}
      <View style={{ flex: 1 }}>

        <Stack.Navigator initialRouteName="AnaAkis">
          
          {/* 1. Ana Sekmeler (Tabs - Bottom Navigation) */}
          <Stack.Screen 
            name="AnaAkis" 
            component={TabsLayout} 
            options={{ headerShown: false }} 
          />

          {/* 2. İlan Detay */}
          <Stack.Screen 
            name="IlanDetay" 
            options={{ 
              title: 'İlan Detayı',
              headerShown: false,
              headerBackTitle: 'Geri',
              presentation: 'card'
            }} 
          >
            {(props) => <IlanDetayScreen {...props} user={null} />} 
          </Stack.Screen>

          {/* 3. Giriş Ekranı */}
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => (
              <LoginScreen 
                {...props} 
                onLoginSuccess={() => props.navigation.replace('AnaAkis')}
                onRegisterClick={() => props.navigation.navigate('Register')}
                onCancel={() => {
                  if (props.navigation.canGoBack()) {
                    props.navigation.goBack();
                  } else {
                    props.navigation.replace('AnaAkis');
                  }
                }}
              />
            )}
          </Stack.Screen>

          {/* 4. Kayıt Ekranı */}
          <Stack.Screen name="Register" options={{ headerShown: false }}>
            {(props) => (
              <RegisterScreen 
                {...props}
                onRegisterSuccess={() => props.navigation.navigate('Login')}
                onBackToLogin={() => props.navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>

          {/* 5. İşveren Başvurular Ekranı */}
          <Stack.Screen 
            name="Basvurular" 
            component={BasvurularScreen} 
            options={{ 
              title: 'Başvuranlar',
              headerShown: true 
            }} 
          />

        </Stack.Navigator>

        {/* 🔥 AI BUTONU BURAYA EKLENDİ 
            Stack.Navigator'ın dışında olduğu için tüm ekranların üzerinde (overlay) durur.
        */}
        <AIChatButton />

      </View>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
} 