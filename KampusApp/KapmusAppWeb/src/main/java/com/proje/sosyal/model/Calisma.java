package com.proje.sosyal.model;

import java.time.LocalDate;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Calisma {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private int sureDakika;
    private String dersAdi;
    private LocalDate tarih;
    
    @ManyToOne
    @JoinColumn(name = "ogrenci_id")
    private Ogrenci ogrenci;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getSureDakika() { return sureDakika; }
    public void setSureDakika(int sureDakika) { this.sureDakika = sureDakika; }
    public String getDersAdi() { return dersAdi; }
    public void setDersAdi(String dersAdi) { this.dersAdi = dersAdi; }
    public LocalDate getTarih() { return tarih; }
    public void setTarih(LocalDate tarih) { this.tarih = tarih; }
    public Ogrenci getOgrenci() { return ogrenci; }
    public void setOgrenci(Ogrenci ogrenci) { this.ogrenci = ogrenci; }
}