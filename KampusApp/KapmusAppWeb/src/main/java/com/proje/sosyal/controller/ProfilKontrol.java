package com.proje.sosyal.controller;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.service.GonderiServisi;
import com.proje.sosyal.service.OgrenciServisi;

@Controller // BU ÇOK ÖNEMLİ! YOKSA SAYFA AÇILMAZ.
public class ProfilKontrol {

    private final OgrenciServisi ogrenciServisi;
    private final GonderiServisi gonderiServisi;

    public ProfilKontrol(OgrenciServisi ogrenciServisi, GonderiServisi gonderiServisi) {
        this.ogrenciServisi = ogrenciServisi;
        this.gonderiServisi = gonderiServisi;
    }

    // PROFİL SAYFASINI AÇAN KOD
    @GetMapping("/profil")
    public String profilSayfasi(Model model, Principal principal) {
        // Giriş yapan kullanıcıyı bul
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        
        // HTML'e gönder
        model.addAttribute("ben", ben);
        
        // Kendi gönderilerimi de gönder
        model.addAttribute("gonderilerim", gonderiServisi.ogrencininGonderileriniGetir(ben));
        
        return "profil"; // src/main/resources/templates/profil.html dosyasını açar
    }

    // TAKİBİ BIRAKMA
    @GetMapping("/takip-birak/{id}")
    public String takibiBirak(@PathVariable Long id, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        ogrenciServisi.takibiBirak(ben.getId(), id);
        return "redirect:/profil";
    }

    // TAKİPÇİYİ ÇIKARMA
    @GetMapping("/takipci-cikar/{id}")
    public String takipciCikar(@PathVariable Long id, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        ogrenciServisi.takipciyiCikar(ben.getId(), id);
        return "redirect:/profil";
    }
}