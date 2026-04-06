package com.proje.sosyal.model;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore; // EKLENDİ: Sonsuz döngüyü önler

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;

@Entity
public class Ogrenci {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String kullaniciAdi;

    private String sifre;
    private String adSoyad;
    private String bolum;

    @Lob
    @Column(length = 10000000)
    private byte[] profilResmi;

    @OneToMany(mappedBy = "ogrenci", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore 
    private List<Gonderi> gonderiler = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "takip_tablosu",
        joinColumns = @JoinColumn(name = "takip_eden_id"),
        inverseJoinColumns = @JoinColumn(name = "takip_edilen_id")
    )
    @JsonIgnore 
    private List<Ogrenci> takipEdilenler = new ArrayList<>();
    
    @OneToMany(mappedBy = "ogrenci", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Calisma> calismalar = new ArrayList<>();


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKullaniciAdi() { return kullaniciAdi; }
    public void setKullaniciAdi(String kullaniciAdi) { this.kullaniciAdi = kullaniciAdi; }

    public String getSifre() { return sifre; }
    public void setSifre(String sifre) { this.sifre = sifre; }

    public String getAdSoyad() { return adSoyad; }
    public void setAdSoyad(String adSoyad) { this.adSoyad = adSoyad; }

    public String getBolum() { return bolum; }
    public void setBolum(String bolum) { this.bolum = bolum; }

    public byte[] getProfilResmi() { return profilResmi; }
    public void setProfilResmi(byte[] profilResmi) { this.profilResmi = profilResmi; }

    public List<Gonderi> getGonderiler() { return gonderiler; }
    public void setGonderiler(List<Gonderi> gonderiler) { this.gonderiler = gonderiler; }

    public List<Ogrenci> getTakipEdilenler() { return takipEdilenler; }
    public void setTakipEdilenler(List<Ogrenci> takipEdilenler) { this.takipEdilenler = takipEdilenler; }

    public List<Calisma> getCalismalar() { return calismalar; }
    public void setCalismalar(List<Calisma> calismalar) { this.calismalar = calismalar; }


    public String getProfilResmiBase64() {
        if (this.profilResmi == null) {
            return null;
        }
        return java.util.Base64.getEncoder().encodeToString(this.profilResmi);
    }

    @ManyToMany(mappedBy = "takipEdilenler", fetch = FetchType.LAZY)
    @JsonIgnore 
    private List<Ogrenci> takipciler = new ArrayList<>();

    public List<Ogrenci> getTakipciler() { return takipciler; }
    public void setTakipciler(List<Ogrenci> takipciler) { this.takipciler = takipciler; }
    private String rol = "USER";  

    
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}