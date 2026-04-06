package com.proje.sosyal.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import com.proje.sosyal.dto.MesajGonderDTO;
import com.proje.sosyal.model.Mesaj;
import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.service.MesajServisi;
import com.proje.sosyal.service.OgrenciServisi;

@Controller
public class MesajKontrol {

    private final MesajServisi mesajServisi;
    private final OgrenciServisi ogrenciServisi;
    private final SimpMessagingTemplate messagingTemplate; 

    public MesajKontrol(MesajServisi mesajServisi, OgrenciServisi ogrenciServisi, SimpMessagingTemplate messagingTemplate) {
        this.mesajServisi = mesajServisi;
        this.ogrenciServisi = ogrenciServisi;
        this.messagingTemplate = messagingTemplate;
    }

    // Mesajlaşma Sayfasını Aç
    @GetMapping("/mesajlar")
    public String mesajlarSayfasi(Model model, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        model.addAttribute("ben", ben);
        // Takip ettiklerini listele (sohbet edebileceği kişiler)
        model.addAttribute("arkadaslar", ben.getTakipEdilenler()); 
        return "mesajlar"; 
    }

    // İki kişi arasındaki eski mesajları getir (AJAX/Fetch için)
    @GetMapping("/api/mesajlar/{karsiId}")
    @ResponseBody
    public List<Mesaj> gecmisMesajlar(@PathVariable Long karsiId, Principal principal) {
        Ogrenci ben = ogrenciServisi.mevcutOgrenciyiGetir(principal.getName());
        return mesajServisi.sohbetGecmisiniGetir(ben.getId(), karsiId);
    }

    // --- WEBSOCKET KISMI (Canlı Sohbet) ---
    @MessageMapping("/sohbet")
    public void mesajAl(@Payload MesajGonderDTO mesajVerisi, Principal principal) {
        String gonderenAdi = principal.getName();
        Ogrenci gonderen = ogrenciServisi.mevcutOgrenciyiGetir(gonderenAdi);
        Ogrenci alici = ogrenciServisi.idIleGetir(mesajVerisi.getAliciId());

        if (alici != null) {
            // 1. Mesajı Veritabanına Kaydet (Metin + Resim)
            mesajServisi.mesajGonder(gonderen, alici, mesajVerisi.getMetin(), mesajVerisi.getResimData());

            // 2. Mesajı Canlı Olarak Alıcıya İlet
            MesajGonderDTO iletilenMesaj = new MesajGonderDTO();
            iletilenMesaj.setGonderenAdi(gonderen.getAdSoyad());
            iletilenMesaj.setMetin(mesajVerisi.getMetin());
            iletilenMesaj.setResimData(mesajVerisi.getResimData()); // Resmi de canlı ilet
            
            // Alıcının dinlediği kanala gönder: /topic/user-{ID}
            messagingTemplate.convertAndSend("/topic/user-" + alici.getId(), iletilenMesaj);
        } else {
            System.out.println("HATA: Alıcı bulunamadı!");
        }
    }
}