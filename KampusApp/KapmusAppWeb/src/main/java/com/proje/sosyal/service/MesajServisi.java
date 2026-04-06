package com.proje.sosyal.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.proje.sosyal.model.Mesaj;
import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.MesajRepository;

@Service
public class MesajServisi {

    private final MesajRepository mesajDeposu;


    public MesajServisi(MesajRepository mesajDeposu) {
        this.mesajDeposu = mesajDeposu;
    }

 // Parametreye 'String resimData' eklendi
    public void mesajGonder(Ogrenci gonderen, Ogrenci alici, String mesajMetni, String resimData) {
        Mesaj mesaj = new Mesaj();
        mesaj.setGonderen(gonderen);
        mesaj.setAlici(alici);
        mesaj.setMesajMetni(mesajMetni);
        mesaj.setZaman(LocalDateTime.now());

        // Resim varsa dönüştür ve kaydet
        if (resimData != null && !resimData.isEmpty()) {
            try {
                // "data:image/png;base64," kısmını temizle
                String temizBase64 = resimData.split(",")[1]; 
                byte[] decodedByte = java.util.Base64.getDecoder().decode(temizBase64);
                mesaj.setResim(decodedByte);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        mesajDeposu.save(mesaj);
    }

    public List<Mesaj> sohbetGecmisiniGetir(Long kullanici1Id, Long kullanici2Id) {
        return mesajDeposu.sohbetGecmisiniGetir(kullanici1Id, kullanici2Id);
    }
}