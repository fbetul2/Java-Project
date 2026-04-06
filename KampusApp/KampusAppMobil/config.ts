// Ngrok adresini buraya yapıştır (Sonunda / olmasın)
export const BASE_URL = 'https://eustatic-preliminarily-latia.ngrok-free.dev';

export const API_URLS = {
    // Giriş & Akış
    BASE_URL: BASE_URL,
    GIRIS: `${BASE_URL}/api/giris`,
    KAYIT: `${BASE_URL}/api/kayit`,
    AKIS: `${BASE_URL}/api/akis`,
    BEGEN: `${BASE_URL}/api/begen`,
    YORUM_YAP: `${BASE_URL}/api/yorum-yap`,
    YORUMLAR: `${BASE_URL}/api/yorumlar/`,
    YORUM_SIL: `${BASE_URL}/api/yorum-sil`,
    
    // Profil İşlemleri
    PROFIL: `${BASE_URL}/api/profil/`,
    PROFIL_GUNCELLE: `${BASE_URL}/api/profil-guncelle`,
    GONDERI_SIL: `${BASE_URL}/api/gonderi-sil`,
    
    // Arama & Takip İşlemleri
    ARA: `${BASE_URL}/api/ara`,           // <-- EKLENDİ
    TAKIP_ET: `${BASE_URL}/api/takip-et`, // <-- EKLENDİ
    ISTEK_KABUL: `${BASE_URL}/api/istek-kabul`,
    ISTEK_RED: `${BASE_URL}/api/istek-reddet`,
    TAKIPCI_CIKAR: `${BASE_URL}/api/takipci-cikar`,
    TAKIP_BIRAK: `${BASE_URL}/api/takip-birak`,
    
    // Mesajlaşma
    MESAJ_ARKADASLAR: `${BASE_URL}/api/mesaj/arkadaslar`,
    MESAJ_GECMIS: `${BASE_URL}/api/mesaj/gecmis`,
    MESAJ_GONDER: `${BASE_URL}/api/mesaj/gonder`,
    
    // Pomodoro & Liderlik
    CALISMA_KAYDET: `${BASE_URL}/api/calisma-kaydet`,
    LIDERLIK: `${BASE_URL}/api/liderlik-tablosu`,
    CALISMA_GECMISI: `${BASE_URL}/api/calisma-kaydet/gecmis`,
    CALISMA_GECMISI_GETIR: `${BASE_URL}/api/gecmis`,

    BILDIRIMLER: `${BASE_URL}/api/bildirimler`,

    NOT_LISTE: `${BASE_URL}/api/notlar/liste`,
    NOT_EKLE: `${BASE_URL}/api/notlar/ekle`,
    NOT_SIL: `${BASE_URL}/api/notlar/sil`,
    NOT_DURUM: `${BASE_URL}/api/notlar/durum`,


    ADMIN_VERILER: `${BASE_URL}/api/admin/veriler`,
    ADMIN_KULLANICI_SIL: `${BASE_URL}/api/admin/kullanici-sil`,
    ADMIN_GONDERI_SIL: `${BASE_URL}/api/admin/gonderi-sil`,
    ADMIN_YORUM_SIL: `${BASE_URL}/api/admin/yorum-sil`,

};