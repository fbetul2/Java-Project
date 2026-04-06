package com.proje.sosyal.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
public class Bildirim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String mesaj;
    private LocalDateTime tarih;
    
    @ManyToOne
    @JoinColumn(name = "ogrenci_id")
    private Ogrenci ogrenci; // Bildirim kime gidecek?

    // Getter Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMesaj() { return mesaj; }
    public void setMesaj(String mesaj) { this.mesaj = mesaj; }
    public LocalDateTime getTarih() { return tarih; }
    public void setTarih(LocalDateTime tarih) { this.tarih = tarih; }
    public Ogrenci getOgrenci() { return ogrenci; }
    public void setOgrenci(Ogrenci ogrenci) { this.ogrenci = ogrenci; }
}