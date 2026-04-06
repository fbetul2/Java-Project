import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const BASE_URL = 'http://13.61.151.121:8080/'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    // Content-Type'ı burada sabit tanımlamıyoruz, dinamik değişebilir
  }
});

// --- INTERCEPTORS ---
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.log("❌ SUNUCU HATASI:", error.response.status);
      console.log("📄 HATA İÇERİĞİ:", error.response.data);
    } else if (error.request) {
      console.log("⚠️ SUNUCUYA ULAŞILAMIYOR. Link doğru mu?");
    } else {
      console.log("❓ BİLİNMEYEN HATA:", error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  async (config) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      // Token gerekirse buraya eklenir
    } catch (error) {
      console.log('AsyncStorage error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 Hatasında Çıkış
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ============================================
// MOBİL API SERVİSLERİ
// ============================================

export const authService = {
  login: async (email, sifre) => {
    const response = await api.post('/mobil/hesap/giris', { email, sifre });
    return response.data;
  },

  // --- AKILLI ŞİFRE KOD GÖNDERME ---
  forgotPassword: async (email) => {
    const params = new URLSearchParams();
    params.append('email', email);

    console.log("📨 Mail isteği atılıyor:", email);

    try {
      // Backend form verisi (x-www-form-urlencoded) bekliyor
      const response = await fetch(`${BASE_URL}sifre-kod-gonder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      // Gelen cevabın URL'ini ve içeriğini alıyoruz
      const currentUrl = response.url;
      const htmlText = await response.text(); 
      
      console.log("🔍 Sunucu Dönüş URL:", currentUrl);

      // --- KESİN MANTIK KONTROLÜ ---

      // 1. BAŞARI: Eğer URL 'sifre-yenile' içeriyorsa -> KESİN BAŞARILI
      if (currentUrl && currentUrl.includes('sifre-yenile')) {
         return true; 
      }

      // 2. BAŞARI (Alternatif): Eğer gelen HTML içinde "kod" girme alanı varsa -> BAŞARILI
      // (Bazen URL değişmeyebilir ama sayfa içeriği değişir)
      if (htmlText.includes('name="kod"') || htmlText.includes('name="yeniSifre"')) {
         return true;
      }

      // 3. HATA: Eğer URL hala 'sifre-kod-gonder' veya 'sifre-iste' ise
      // VE başarı şartları sağlanmadıysa -> DEMEK Kİ KULLANICI YOK!
      if (currentUrl.includes('sifre-kod-gonder') || currentUrl.includes('sifre-iste')) {
          console.log("❌ Kullanıcı bulunamadı (URL değişmedi)");
          throw new Error('Bu e-posta adresi sistemde kayıtlı değil.');
      }

      // 4. HATA: Açıkça hata parametresi varsa
      if (currentUrl.includes('error')) {
          throw new Error('Bu e-posta adresi sistemde kayıtlı değil.');
      }

      // Hiçbir şarta uymuyorsa genel hata ver
      throw new Error('İşlem başarısız. Lütfen bilgilerinizi kontrol edin.');

    } catch (error) {
      console.log("❌ API Hatası:", error.message);
      throw error; // Hatayı ekrana basması için fırlat
    }
  },
  // ... diğer kodlar aynı ...
  // --- DÜZELTİLMİŞ ŞİFRE DEĞİŞTİRME ---
  resetPassword: async (email, code, newPassword) => {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('kod', code);
    params.append('yeniSifre', newPassword);

    const response = await fetch(`${BASE_URL}sifre-degistir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (response.url && response.url.includes('giris')) {
       return true;
    }

    throw new Error('Girdiğiniz kod hatalı!');
  },
  register: async (kullaniciData) => {
    const response = await api.post('/mobil/hesap/kayit', kullaniciData);
    return response.data;
  },
  getProfile: async (userId) => {
    const response = await api.get(`/mobil/hesap/profil/${userId}`);
    return response.data;
  },
  updateProfile: async (formData) => {
    // Resim yükleme için özel ayar
    const response = await api.post('/mobil/hesap/profil/guncelle', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data, // FormData'yı korur
    });
    return response.data;
  },
  getNotifications: async (userId) => {
    const response = await api.get(`/mobil/hesap/bildirimler/${userId}`);
    return response.data;
  },
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/mobil/hesap/bildirim-sil/${notificationId}`);
    return response.data;
  }
};

export const ilanService = {
  getAllIlanlar: async (kelime, sehir) => {
    const params = {};
    if (kelime) params.kelime = kelime;
    if (sehir) params.sehir = sehir;
    const response = await api.get('/mobil/ilanlar', { params });
    return response.data;
  },
  getIlanDetay: async (ilanId) => {
    const response = await api.get(`/mobil/ilanlar/${ilanId}`);
    return response.data;
  }
};

export const isverenService = {
  addIlan: async (ilanData) => {
    const response = await api.post('/mobil/ilan/ekle', ilanData);
    return response.data;
  },
  updateIlan: async (ilanData) => {
    const response = await api.post('/mobil/ilan/duzenle', ilanData);
    return response.data;
  },
  getMyIlanlar: async (kullaniciId) => {
    const response = await api.get(`/mobil/ilan/listele/${kullaniciId}`);
    return response.data;
  },
  deleteIlan: async (ilanId) => {
    const response = await api.post(`/mobil/ilan/sil/${ilanId}`);
    return response.data;
  },
  ilanTekrarYayinla: async (ilanId) => {
    const response = await api.post(`/mobil/ilan/tekrar-yayinla/${ilanId}`);
    return response.data;
  }
};

export const basvuruService = {
  checkBasvuru: async (kullaniciId, ilanId) => {
    const response = await api.get('/mobil/basvuru/kontrol', {
      params: { kullaniciId, ilanId }
    });
    return response.data;
  },
  makeBasvuru: async (kullaniciId, ilanId) => {
    const response = await api.post('/mobil/basvuru/yap', { kullaniciId, ilanId });
    return response.data;
  },
  getMyBasvurular: async (kullaniciId) => {
    const response = await api.get(`/mobil/basvuru/listele/${kullaniciId}`);
    return response.data;
  },
  
  // --- DÜZELTME BURADA YAPILDI ---
  // Eski hali: /api/basvurular/mobil/ilan/... (YANLIŞTI)
  // Yeni hali: /mobil/basvuru/ilan/... (DOĞRU - Backend Controller ile uyumlu)
  getIlanBasvurulari: async (ilanId) => {
    const response = await api.get(`/mobil/basvuru/ilan/${ilanId}`);
    return response.data;
  },
  // ---------------------------------

  updateBasvuruDurum: async (basvuruId, durum, mesaj, tarih, ilaniKapat) => {
    const response = await api.post('/mobil/basvuru/durum-guncelle', {
      basvuruId, durum, mesaj, tarih: tarih || null, ilaniKapat: ilaniKapat || false
    });
    return response.data;
  },
  getCV: async (basvuruId) => {
    const response = await api.get(`/mobil/basvuru/cv-getir/${basvuruId}`);
    return response.data;
  }
};

export const favoriService = {
  checkFavori: async (kullaniciId, ilanId) => {
    const response = await api.get('/mobil/favori/kontrol', {
      params: { kullaniciId, ilanId }
    });
    return response.data;
  },
  toggleFavori: async (kullaniciId, ilanId) => {
    const response = await api.post('/mobil/favori/islem', { kullaniciId, ilanId });
    return response.data;
  },
  getMyFavoriler: async (kullaniciId) => {
    const response = await api.get('/mobil/favori/listele', {
        params: { kullaniciId: kullaniciId }
    });
    return response.data;
  }
};

export const odemeService = {
  getPaketler: async () => {
    const response = await api.get('/mobil/odeme/paketler');
    return response.data;
  },
  satinAl: async (ilanId, paketId, kartBilgileri) => {
    const response = await api.post('/mobil/odeme/satin-al', {
      ilanId,
      paketId,
      kartSahibi: kartBilgileri.kartSahibi,
      kartNo: kartBilgileri.kartNo,
      ay: kartBilgileri.ay,
      yil: kartBilgileri.yil,
      cvv: kartBilgileri.cvv
    });
    return response.data;
  }
};

export const aiService = {
  getCVAnaliz: async (kullaniciId) => {
    const response = await api.get(`/mobil/ai/cv-analiz/${kullaniciId}`);
    return response.data;
  },
  genelSohbet: async (mesaj) => {
    const response = await api.post('/mobil/ai/sohbet', { mesaj });
    return response.data;
  },
  ilanMetniOlustur: async (kullaniciId, baslik) => {
    const response = await api.post('/mobil/ai/ilan-olustur', { 
        kullaniciId: kullaniciId, 
        baslik: baslik 
    });
    return response.data;
  }
};

export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/mobil/admin/dashboard');
    return response.data;
  },
  getKullanicilar: async () => {
    const response = await api.get('/mobil/admin/kullanicilar');
    return response.data;
  },
  deleteKullanici: async (kullaniciId) => {
    const response = await api.post(`/mobil/admin/kullanici-sil/${kullaniciId}`);
    return response.data;
  },
  getAllIlanlar: async () => {
    const response = await api.get('/mobil/admin/ilanlar');
    return response.data;
  },
  deleteIlan: async (ilanId, sebep) => {
    const response = await api.post(`/mobil/admin/ilan-sil/${ilanId}`, { sebep });
    return response.data;
  },
  getPaketler: async () => {
    const response = await api.get('/mobil/admin/paketler');
    return response.data;
  },
  savePaket: async (paket) => {
    const response = await api.post('/mobil/admin/paket-kaydet', paket);
    return response.data;
  },
  deletePaket: async (paketId) => {
    const response = await api.delete(`/mobil/admin/paket-sil/${paketId}`);
    return response.data;
  }
};

export default api;