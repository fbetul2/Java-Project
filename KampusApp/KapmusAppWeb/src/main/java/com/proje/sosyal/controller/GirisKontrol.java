package com.proje.sosyal.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.service.OgrenciServisi;

@Controller
public class GirisKontrol {

    private final OgrenciServisi ogrenciServisi;

    public GirisKontrol(OgrenciServisi ogrenciServisi) {
        this.ogrenciServisi = ogrenciServisi;
    }

   
    @GetMapping("/login")
    public String girisSayfasi() {
        return "login";
    } 

   
    @GetMapping("/kayit")
    public String kayitSayfasi(Model model) {
       
        model.addAttribute("ogrenci", new Ogrenci());
        return "kayit";
    }

   
    @PostMapping("/kayit")
    public String kayitOl(@ModelAttribute Ogrenci ogrenci) {
      
        if (ogrenciServisi.kullaniciAdiVarMi(ogrenci.getKullaniciAdi())) {
           
            return "redirect:/kayit?error=mevcut";
        }
        
      
        ogrenciServisi.kayitOl(ogrenci);
        return "redirect:/login?basarili";
    }
}