package com.proje.sosyal.dto;

public class MesajGonderDTO {
    private Long aliciId;
    private String metin;
    private String gonderenAdi;
    
    private String resimData; 

 
    public Long getAliciId() { return aliciId; }
    public void setAliciId(Long aliciId) { this.aliciId = aliciId; }
    public String getMetin() { return metin; }
    public void setMetin(String metin) { this.metin = metin; }
    public String getGonderenAdi() { return gonderenAdi; }
    public void setGonderenAdi(String gonderenAdi) { this.gonderenAdi = gonderenAdi; }
    public String getResimData() { return resimData; }
    public void setResimData(String resimData) { this.resimData = resimData; }
}