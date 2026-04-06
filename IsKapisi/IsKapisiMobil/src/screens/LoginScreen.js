import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { authService } from '../api/api';
import SifremiUnuttumScreen from './SifremiUnuttumScreen'; // <-- YENİ DOSYAYI IMPORT ET

const PRIMARY_COLOR = '#1e3a8a'; 

const LoginScreen = ({ onLoginSuccess, onCancel, onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // <-- YENİ STATE

  // --- EĞER ŞİFREMİ UNUTTUM MODUNDAYSA O EKRANI GÖSTER ---
  if (showForgotPassword) {
    return (
      <SifremiUnuttumScreen 
        onCancel={() => setShowForgotPassword(false)} 
        onResetSuccess={() => setShowForgotPassword(false)}
      />
    );
  }
  // --------------------------------------------------------

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !sifre) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setLoading(true);

    try {
      const user = await authService.login(email, sifre); 
      await AsyncStorage.setItem('user', JSON.stringify(user)); 
      if (onLoginSuccess) onLoginSuccess(user); 

    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Giriş Başarısız', 'E-posta veya şifreniz yanlış.');
      } else {
        Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{flex: 1, justifyContent: 'center'}}
            >
                <View style={styles.header}>
                    <Image 
                        source={require('../../assets/images/logo.jpeg')} 
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    
                    <Text style={styles.logo}>İş Kapısı</Text>
                    <Text style={styles.subTitle}>Kariyerin cebinde.</Text>
                </View>

                <View style={styles.formArea}>
                    <Text style={styles.label}>E-Posta Adresi</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ornek@mail.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Şifre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                        value={sifre}
                        onChangeText={setSifre}
                    />
                    
                    {/* --- YENİ EKLENEN ŞİFREMİ UNUTTUM LİNKİ --- */}
                    <TouchableOpacity 
                        style={{alignSelf: 'flex-end', marginTop: 10}}
                        onPress={() => setShowForgotPassword(true)}
                    >
                        <Text style={{color: PRIMARY_COLOR, fontWeight: '600', fontSize: 13}}>
                            Şifremi Unuttum?
                        </Text>
                    </TouchableOpacity>
                    {/* ------------------------------------------ */}

                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.registerLink} onPress={onRegisterClick}>
                        <Text style={styles.linkText}>Hesabın yok mu? <Text style={{fontWeight:'bold', color: PRIMARY_COLOR}}>Kayıt Ol</Text></Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={{marginTop: 25, alignSelf: 'center'}} onPress={onCancel}>
                        <Text style={{color: '#94a3b8', fontSize: 13}}>✕ Vazgeç ve İlanlara Dön</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', marginBottom: 40 }, 
  logoImage: { width: 80, height: 80, borderRadius: 16, marginBottom: 15 }, 
  logo: { fontSize: 32, fontWeight: '800', color: PRIMARY_COLOR, marginBottom: 5 }, 
  subTitle: { fontSize: 16, color: '#64748b' },
  formArea: { paddingHorizontal: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, color: '#1e293b' }, 
  button: { backgroundColor: PRIMARY_COLOR, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }, 
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#64748b', fontSize: 14 }
});

export default LoginScreen;