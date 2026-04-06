package com.proje.sosyal.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany; // Bu eksikti
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public class Gonderi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20000)
    private String metin;

    @Lob
    @Column(length = 10000000)
    private byte[] resim;

    private LocalDateTime tarih;

    @ManyToMany
    @JoinTable(
        name = "gonderi_begenileri",
        joinColumns = @JoinColumn(name = "gonderi_id"),
        inverseJoinColumns = @JoinColumn(name = "ogrenci_id")
    )
    private Set<Ogrenci> begenenler = new HashSet<>();
    
    public int getBegeniSayisi() {
        return begenenler.size();
    }

    @ManyToOne
    @JoinColumn(name = "ogrenci_id")
    private Ogrenci ogrenci;
    
    @OneToMany(mappedBy = "gonderi", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Yorum> yorumlar = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getMetin() { return metin; }
    public void setMetin(String metin) { this.metin = metin; }
    
    public byte[] getResim() { return resim; }
    public void setResim(byte[] resim) { this.resim = resim; }
    
    public LocalDateTime getTarih() { return tarih; }
    public void setTarih(LocalDateTime tarih) { this.tarih = tarih; }
    
    
    public Set<Ogrenci> getBegenenler() { return begenenler; }
    public void setBegenenler(Set<Ogrenci> begenenler) { this.begenenler = begenenler; }
    
    public Ogrenci getOgrenci() { return ogrenci; }
    public void setOgrenci(Ogrenci ogrenci) { this.ogrenci = ogrenci; }
    
    public List<Yorum> getYorumlar() { return yorumlar; }
    public void setYorumlar(List<Yorum> yorumlar) { this.yorumlar = yorumlar; }

    public String getResimBase64() {
        if (this.resim == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(this.resim);
    }
}