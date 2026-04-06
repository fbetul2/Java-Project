package com.proje.sosyal.controller;

import java.time.LocalDateTime;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.proje.sosyal.model.Bildirim;
import com.proje.sosyal.model.Gonderi;
import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.BildirimRepository;
import com.proje.sosyal.repository.GonderiRepository;
import com.proje.sosyal.repository.OgrenciRepository;
import com.proje.sosyal.service.OgrenciServisi; // İŞTE EKSİK OLAN BU SATIRDI

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminKontrol {

    private final OgrenciRepository ogrenciRepo;
    private final GonderiRepository gonderiRepo;
    private final BildirimRepository bildirimRepo;
    private final OgrenciServisi ogrenciServisi; 
 
    public AdminKontrol(OgrenciRepository ogrenciRepo, GonderiRepository gonderiRepo, BildirimRepository bildirimRepo, OgrenciServisi ogrenciServisi) {
        this.ogrenciRepo = ogrenciRepo;
        this.gonderiRepo = gonderiRepo;
        this.bildirimRepo = bildirimRepo;
        this.ogrenciServisi = ogrenciServisi;
    }

    @GetMapping
    public String adminPaneli(Model model) {
        model.addAttribute("tumOgrenciler", ogrenciRepo.findAll());
        model.addAttribute("tumGonderiler", gonderiRepo.findAllByOrderByTarihDesc());
        return "admin";
    }

   
    @GetMapping("/kullanici-sil/{id}")
    public String kullaniciSil(@PathVariable Long id) {
        ogrenciServisi.ogrenciyiSil(id);  
        return "redirect:/admin";
    }

    @PostMapping("/gonderi-sil")
    public String gonderiSil(@RequestParam Long gonderiId, @RequestParam String sebep) {
        Gonderi gonderi = gonderiRepo.findById(gonderiId).orElse(null);
        
        if(gonderi != null) {
            Ogrenci sahip = gonderi.getOgrenci();
            
             
            Bildirim bildirim = new Bildirim();
            bildirim.setOgrenci(sahip);
            bildirim.setTarih(LocalDateTime.now());
            bildirim.setMesaj("UYARI: Bir gönderiniz yöneticiler tarafından kaldırıldı. Sebep: " + sebep);
            bildirimRepo.save(bildirim);
            
            
            gonderiRepo.delete(gonderi);
        }
        return "redirect:/admin";
    }
}