package com.proje.sosyal.model;

import java.time.LocalDateTime;
import java.util.Base64;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;

@Entity
public class Mesaj {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mesajMetni;
    private LocalDateTime zaman;

    @ManyToOne
    @JoinColumn(name = "gonderen_id")
    private Ogrenci gonderen;

    @ManyToOne
    @JoinColumn(name = "alici_id")
    private Ogrenci alici;

    @Lob
    @Column(length = 10000000) // 10MB Resim Desteği
    private byte[] resim;

    // --- GETTER VE SETTER METODLARI ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMesajMetni() { return mesajMetni; }
    public void setMesajMetni(String mesajMetni) { this.mesajMetni = mesajMetni; }

    public LocalDateTime getZaman() { return zaman; }
    public void setZaman(LocalDateTime zaman) { this.zaman = zaman; }

    public Ogrenci getGonderen() { return gonderen; }
    public void setGonderen(Ogrenci gonderen) { this.gonderen = gonderen; }

    public Ogrenci getAlici() { return alici; }
    public void setAlici(Ogrenci alici) { this.alici = alici; }

    public byte[] getResim() { return resim; }
    public void setResim(byte[] resim) { this.resim = resim; }

    // HTML'de resmi göstermek için yardımcı metod (Base64 çevirici)
    public String getResimBase64() {
        if (this.resim == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(this.resim);
    }
}