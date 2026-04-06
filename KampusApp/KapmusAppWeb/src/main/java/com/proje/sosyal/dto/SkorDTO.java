package com.proje.sosyal.dto;

public class SkorDTO implements Comparable<SkorDTO> {
    private String adSoyad;
    private String profilResmiBase64;
    private int toplamDakika;
    
    public SkorDTO(String adSoyad, String profilResmiBase64, int toplamDakika) {
        this.adSoyad = adSoyad;
        this.profilResmiBase64 = profilResmiBase64;
        this.toplamDakika = toplamDakika;
    }

   
    @Override
    public int compareTo(SkorDTO o) {
        return o.toplamDakika - this.toplamDakika; 
    }

 
    public String getAdSoyad() { return adSoyad; }
    public void setAdSoyad(String adSoyad) { this.adSoyad = adSoyad; }
    public String getProfilResmiBase64() { return profilResmiBase64; }
    public void setProfilResmiBase64(String profilResmiBase64) { this.profilResmiBase64 = profilResmiBase64; }
    public int getToplamDakika() { return toplamDakika; }
    public void setToplamDakika(int toplamDakika) { this.toplamDakika = toplamDakika; }
}