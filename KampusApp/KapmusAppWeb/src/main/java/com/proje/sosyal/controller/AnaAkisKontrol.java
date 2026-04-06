package com.proje.sosyal.controller;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.BildirimRepository;
import com.proje.sosyal.service.CalismaServisi;
import com.proje.sosyal.service.GonderiServisi;
import com.proje.sosyal.service.NotServisi; // EKLENDİ
import com.proje.sosyal.service.OgrenciServisi;

@Controller
public class AnaAkisKontrol {

    private final GonderiServisi gonderiServisi;
    private final OgrenciServisi ogrenciServisi;
    private final CalismaServisi calismaServisi;
    private final BildirimRepository bildirimRepo;
    private final NotServisi notServisi;  

    
    public AnaAkisKontrol(GonderiServisi gonderiServisi, OgrenciServisi ogrenciServisi, CalismaServisi calismaServisi, BildirimRepository bildirimRepo, NotServisi notServisi) {
        this.gonderiServisi = gonderiServisi;
        this.ogrenciServisi = ogrenciServisi;
        this.calismaServisi = calismaServisi;
        this.bildirimRepo = bildirimRepo;
        this.notServisi = notServisi;
    }

    @GetMapping("/")
    public String anaSayfa(Model model, Principal principal) {
        String kullaniciAdi = principal.getName();
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(kullaniciAdi);

        model.addAttribute("ben", ben);
        model.addAttribute("akisGonderileri", gonderiServisi.takipEdilenlerinGonderileriniGetir(ben));
        model.addAttribute("kendiGonderiSayisi", gonderiServisi.ogrencininGonderileriniGetir(ben).size());
        model.addAttribute("calismalar", calismaServisi.gecmisiGetir(ben));
        model.addAttribute("bildirimler", bildirimRepo.findByOgrenciOrderByTarihDesc(ben));
        model.addAttribute("yarisTablosu", calismaServisi.yarisTablosunuGetir(ben));
        
   
        model.addAttribute("notlar", notServisi.notlariGetir(ben));
        
        return "anasayfa";
    }

   
    @PostMapping("/gonderi-paylas")
    public String gonderiPaylas(@RequestParam("metin") String metin, @RequestParam(value = "resim", required = false) MultipartFile resim, Principal principal) {
       try {
           if ((metin == null || metin.trim().isEmpty()) && (resim == null || resim.isEmpty())) return "redirect:/?hata=bosicerik";
           Ogrenci ogrenci = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
           gonderiServisi.gonderiPaylas(metin, resim, ogrenci);
       } catch (Exception e) { e.printStackTrace(); }
       return "redirect:/";
    }
    
    @PostMapping("/calisma-kaydet")
    public String calismaKaydet(@RequestParam("sure") int sure, @RequestParam("ders") String ders, Principal principal) {
        Ogrenci ogrenci = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        calismaServisi.calismaKaydet(ogrenci, sure, ders);
        return "redirect:/";
    }

    @GetMapping("/begen/{id}")
    public String begeniYap(@PathVariable Long id, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        gonderiServisi.begeniYap(id, ben);
        return "redirect:/"; 
    }

    @PostMapping("/yorum-yap")
    public String yorumYap(@RequestParam Long gonderiId, @RequestParam String yorumMetni, @RequestParam(value = "resim", required = false) MultipartFile resim, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        gonderiServisi.yorumYap(gonderiId, ben, yorumMetni, resim);
        return "redirect:/";
    }

    @PostMapping("/profil-bilgi-guncelle")
    public String profilBilgiGuncelle(@RequestParam String adSoyad, @RequestParam String bolum, @RequestParam(required = false) String yeniSifre, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        ogrenciServisi.profilGuncelle(ben, adSoyad, bolum, yeniSifre);
        return "redirect:/";
    }
 
    @PostMapping("/not-ekle")
    public String notEkle(@RequestParam String icerik, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        if(icerik != null && !icerik.trim().isEmpty()) {
            notServisi.notEkle(ben, icerik);
        }
        return "redirect:/";
    }

    @GetMapping("/not-sil/{id}")
    public String notSil(@PathVariable Long id, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        notServisi.notSil(id, ben);
        return "redirect:/";
    }
    @GetMapping("/not-durum/{id}")
    public String notDurum(@PathVariable Long id, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        notServisi.durumDegistir(id, ben);
        return "redirect:/";
    }
 

  
    @GetMapping("/bildirim-sil/{id}")
    public String bildirimSil(@PathVariable Long id) {
        bildirimRepo.deleteById(id);
        return "redirect:/";
    }

}