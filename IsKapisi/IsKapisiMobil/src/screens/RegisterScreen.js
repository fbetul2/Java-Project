import { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../api/api';

// Logodaki lacivert renk tonu
const PRIMARY_COLOR = '#1e3a8a';

const RegisterScreen = ({ onRegisterSuccess, onBackToLogin }) => {
  const [ad, setAd] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  
  // ROL SEÇİMİ İÇİN STATE
  const [rol, setRol] = useState('IS_ARAYAN'); // Varsayılan

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !sifre || !telefon) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurunuz.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ad: ad, // Ad Soyad bilgisini de gönderelim
        email: email,
        telefon: telefon,
        sifre: sifre,
        rol: rol // Seçilen rolü gönder
      };

      await authService.register(payload);

      Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı! Şimdi giriş yapabilirsin.');
      if (onRegisterSuccess) onRegisterSuccess();

    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data || 'Kayıt olurken bir sorun oluştu.';
      Alert.alert('Hata', typeof errorMessage === 'string' ? errorMessage : 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
        
        <View style={styles.header}>
          <Image 
              source={require('../../assets/images/logo.jpeg')} 
              style={styles.logoImage}
              resizeMode="contain"
          />
          <Text style={styles.logo}>İş Kapısı</Text>
          <Text style={styles.subTitle}>Hemen aramıza katıl.</Text>
        </View>

        <View style={styles.formArea}>
            
            {/* --- ROL SEÇİM BUTONLARI --- */}
            <View style={styles.roleContainer}>
                <TouchableOpacity 
                    style={[styles.roleButton, rol === 'IS_ARAYAN' && styles.activeRole]} 
                    onPress={() => setRol('IS_ARAYAN')}
                >
                    <Text style={[styles.roleText, rol === 'IS_ARAYAN' && styles.activeRoleText]}>🧑‍💼 İş Arıyorum</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.roleButton, rol === 'ISVEREN' && styles.activeRole]} 
                    onPress={() => setRol('ISVEREN')}
                >
                    <Text style={[styles.roleText, rol === 'ISVEREN' && styles.activeRoleText]}>🏢 İşverenim</Text>
                </TouchableOpacity>
            </View>
            {/* --------------------------- */}

          <Text style={styles.label}>{rol === 'ISVEREN' ? 'Şirket Adı' : 'Ad Soyad'}</Text>
          <TextInput
            style={styles.input}
            placeholder={rol === 'ISVEREN' ? "Şirketinizin Adı" : "Adınız Soyadınız"}
            placeholderTextColor="#94a3b8"
            value={ad}
            onChangeText={setAd}
          />

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

          <Text style={styles.label}>Telefon</Text>
          <TextInput
            style={styles.input}
            placeholder="0555 555 55 55"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={telefon}
            onChangeText={setTelefon}
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

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Kaydediliyor...' : (rol === 'ISVEREN' ? 'Şirket Hesabı Oluştur' : 'Kayıt Ol')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={onBackToLogin}>
            <Text style={styles.linkText}>Zaten hesabın var mı? <Text style={{fontWeight:'bold', color: PRIMARY_COLOR}}>Giriş Yap</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    color: '#64748b',
  },
  formArea: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  
  // --- YENİ ROL BUTON STİLLERİ ---
  roleContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 10,
  },
  roleButton: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: 'white',
  },
  activeRole: {
      backgroundColor: PRIMARY_COLOR, // Lacivert
      borderColor: PRIMARY_COLOR,
  },
  roleText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#64748b',
  },
  activeRoleText: {
      color: 'white',
  },
  // ------------------------------

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#64748b',
    fontSize: 14,
  }
});

export default RegisterScreen;