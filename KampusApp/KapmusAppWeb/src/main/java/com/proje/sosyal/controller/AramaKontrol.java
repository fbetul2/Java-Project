package com.proje.sosyal.controller;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.OgrenciRepository;
import com.proje.sosyal.service.OgrenciServisi;

@Controller
public class AramaKontrol {

    private final OgrenciRepository ogrenciRepository;
    private final OgrenciServisi ogrenciServisi;

    public AramaKontrol(OgrenciRepository ogrenciRepository, OgrenciServisi ogrenciServisi) {
        this.ogrenciRepository = ogrenciRepository;
        this.ogrenciServisi = ogrenciServisi;
    }

  
    @GetMapping("/ara")
    public String aramaYap(@RequestParam(value = "sorgu", required = false) String sorgu, Model model, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        List<Ogrenci> sonuclar = new ArrayList<>();

        if (sorgu != null && !sorgu.trim().isEmpty()) {
            sonuclar = ogrenciRepository.findAll().stream()
                    .filter(o -> !o.getId().equals(ben.getId()))
                    .filter(o -> (o.getAdSoyad() != null && o.getAdSoyad().toLowerCase().contains(sorgu.toLowerCase())) || 
                                 (o.getBolum() != null && o.getBolum().toLowerCase().contains(sorgu.toLowerCase())))
                    .toList();
        }

        model.addAttribute("sonuclar", sonuclar);
        model.addAttribute("ben", ben);
        return "arama-sonuc"; 
    }

    
    @GetMapping("/takip-et/{id}")
    public String takipEt(@PathVariable Long id, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        ogrenciServisi.takipEt(ben.getId(), id);
        
        
        return "redirect:/"; 
    }
    
    
    @PostMapping("/profil-resmi-guncelle")
    public String profilResmiGuncelle(@RequestParam("resim") MultipartFile resim, Principal principal) {
        try {
            Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
            if(resim != null && !resim.isEmpty()) {
                ben.setProfilResmi(resim.getBytes());
               
                ogrenciServisi.guncelle(ben);
            }
        } catch (Exception e) {
            System.out.println("RESİM YÜKLEME HATASI: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/?hata=resimyukleme";
        }
        return "redirect:/";
    }
}