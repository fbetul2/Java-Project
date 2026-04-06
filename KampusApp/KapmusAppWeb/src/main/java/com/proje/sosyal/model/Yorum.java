package com.proje.sosyal.model;

import java.time.LocalDateTime;
import java.util.Base64; // Import unutma

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data 
public class Yorum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String icerik;
    private LocalDateTime tarih;
    
    @Lob
    @Column(length = 10000000) 
    private byte[] resim;
    
    @ManyToOne
    @JoinColumn(name = "ogrenci_id")
    private Ogrenci yazar; 
    
    @ManyToOne
    @JoinColumn(name = "gonderi_id")
    private Gonderi gonderi; 
    

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIcerik() { return icerik; }
    public void setIcerik(String icerik) { this.icerik = icerik; }
    public LocalDateTime getTarih() { return tarih; }
    public void setTarih(LocalDateTime tarih) { this.tarih = tarih; }
    public byte[] getResim() { return resim; }
    public void setResim(byte[] resim) { this.resim = resim; }
    public Ogrenci getYazar() { return yazar; }
    public void setYazar(Ogrenci yazar) { this.yazar = yazar; }
    public Gonderi getGonderi() { return gonderi; }
    public void setGonderi(Gonderi gonderi) { this.gonderi = gonderi; }

    // HTML İçin Resim Çevirici
    public String getResimBase64() {
        if (this.resim == null) return null;
        return Base64.getEncoder().encodeToString(this.resim);
    }
}