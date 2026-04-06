package com.proje.sosyal.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "notlar") // SQL hatası vermesin diye isim değiştirdik
public class Not {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500)
    private String icerik; // Sadece yazı
    
    private LocalDateTime tarih;

    @ManyToOne
    @JoinColumn(name = "ogrenci_id")
    private Ogrenci ogrenci;

    // --- GETTER SETTER ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIcerik() { return icerik; }
    public void setIcerik(String icerik) { this.icerik = icerik; }
    public LocalDateTime getTarih() { return tarih; }
    public void setTarih(LocalDateTime tarih) { this.tarih = tarih; }
    public Ogrenci getOgrenci() { return ogrenci; }
    public void setOgrenci(Ogrenci ogrenci) { this.ogrenci = ogrenci; }
 // ... (diğer alanların altına)

    private boolean tamamlandi = false; // Varsayılan olarak yapılmadı

    // Getter ve Setter
    public boolean isTamamlandi() { return tamamlandi; }
    public void setTamamlandi(boolean tamamlandi) { this.tamamlandi = tamamlandi; }
}