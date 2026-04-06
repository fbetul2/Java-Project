package com.proje.sosyal.service;

import java.time.LocalDateTime;
import java.util.List;
import com.proje.sosyal.model.Yorum;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.proje.sosyal.model.Gonderi;
import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.GonderiRepository;

@Service
public class GonderiServisi {

    private final GonderiRepository gonderiDeposu;


    public GonderiServisi(GonderiRepository gonderiDeposu) {
        this.gonderiDeposu = gonderiDeposu;
    }

    public void gonderiPaylas(String metin, MultipartFile resimDosyasi, Ogrenci ogrenci) throws Exception {
        Gonderi gonderi = new Gonderi();
        gonderi.setMetin(metin);
        gonderi.setTarih(LocalDateTime.now());
        gonderi.setOgrenci(ogrenci);

   
        if (resimDosyasi != null && !resimDosyasi.isEmpty()) {
            gonderi.setResim(resimDosyasi.getBytes());
        }

        gonderiDeposu.save(gonderi);
    }


    public List<Gonderi> takipEdilenlerinGonderileriniGetir(Ogrenci ogrenci) {

        return gonderiDeposu.findByOgrenciInOrOgrenciOrderByTarihDesc(ogrenci.getTakipEdilenler(), ogrenci);
    }
    
    public List<Gonderi> ogrencininGonderileriniGetir(Ogrenci ogrenci) {
        return gonderiDeposu.findByOgrenciOrderByTarihDesc(ogrenci);
    }


    public void begeniYap(Long gonderiId, Ogrenci begenenKisi) {
        Gonderi gonderi = gonderiDeposu.findById(gonderiId).orElse(null);
        
        if(gonderi != null) {
            
            if (gonderi.getOgrenci().getId().equals(begenenKisi.getId())) {
                return; 
            }
            
       
            if (gonderi.getBegenenler().contains(begenenKisi)) {
                gonderi.getBegenenler().remove(begenenKisi);  
            } else {
                gonderi.getBegenenler().add(begenenKisi);  
            }
            
            gonderiDeposu.save(gonderi);
        }
    }

    public void yorumYap(Long gonderiId, Ogrenci yazar, String icerik, MultipartFile resimDosyasi) {
        Gonderi gonderi = gonderiDeposu.findById(gonderiId).orElse(null);
        if(gonderi != null) {
            Yorum yorum = new Yorum();
            yorum.setGonderi(gonderi);
            yorum.setYazar(yazar);
            yorum.setIcerik(icerik);
            yorum.setTarih(LocalDateTime.now());
            

            if (resimDosyasi != null && !resimDosyasi.isEmpty()) {
                try {
                    yorum.setResim(resimDosyasi.getBytes());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            
            gonderi.getYorumlar().add(yorum);
            gonderiDeposu.save(gonderi);
        }
    }
}
