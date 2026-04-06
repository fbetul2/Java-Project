import { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { authService } from '../api/api';

const PRIMARY_COLOR = '#1e3a8a';

const SifremiUnuttumScreen = ({ onCancel, onResetSuccess }) => {
  const [step, setStep] = useState(1); // 1: Mail Gir, 2: Kod ve Yeni Şifre Gir
  const [email, setEmail] = useState('');
  const [kod, setKod] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    Keyboard.dismiss(); // Klavyeyi indir
    
    if (!email) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      // Hata fırlatılmazsa burası çalışır
      Alert.alert('Başarılı', 'Doğrulama kodu e-posta adresinize gönderildi.');
      setStep(2); 

    } catch (error) {
      // API'den gelen hatayı (error.message) ekrana basıyoruz
      // Önceki kodda burası sabit bir mesajdı, şimdi dinamik oldu.
      const mesaj = error.message || 'Mail gönderilemedi. Lütfen tekrar deneyin.';
      Alert.alert('İşlem Başarısız', mesaj);
    } finally {
      setLoading(false);
    }
  };
  // 2. ADIM: ŞİFREYİ DEĞİŞTİR
  const handleResetPassword = async () => {
    if (!kod || !yeniSifre) {
      Alert.alert('Hata', 'Lütfen kodu ve yeni şifrenizi girin.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email, kod, yeniSifre);
      Alert.alert('Harika!', 'Şifreniz başarıyla değiştirildi. Şimdi giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => onResetSuccess() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Kod hatalı veya süre dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1, justifyContent: 'center', padding: 20}}
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              {step === 1 ? 'Şifre Sıfırlama' : 'Yeni Şifre Belirle'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Hesabınıza kayıtlı e-posta adresini girin.' 
                : `${email} adresine gelen kodu girin.`}
            </Text>

            {step === 1 ? (
              // ADIM 1 FORMU
              <View>
                <Text style={styles.label}>E-Posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // ADIM 2 FORMU
              <View>
                <Text style={styles.label}>Doğrulama Kodu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={kod}
                  onChangeText={setKod}
                />

                <Text style={styles.label}>Yeni Şifre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Yeni şifreniz"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={yeniSifre}
                  onChangeText={setYeniSifre}
                />

                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'İşleniyor...' : 'Şifreyi Değiştir'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Vazgeç ve Girişe Dön</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: PRIMARY_COLOR, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', color: '#333' },
  button: { backgroundColor: PRIMARY_COLOR, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#94a3b8' }
});

export default SifremiUnuttumScreen;