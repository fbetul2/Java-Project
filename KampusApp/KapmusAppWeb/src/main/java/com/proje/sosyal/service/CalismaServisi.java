package com.proje.sosyal.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import com.proje.sosyal.dto.SkorDTO;
import java.util.ArrayList;
import java.util.Collections;
import com.proje.sosyal.model.Calisma;
import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.CalismaRepository;

@Service
public class CalismaServisi {
    
    private final CalismaRepository calismaDeposu;
    

    public CalismaServisi(CalismaRepository calismaDeposu) {
        this.calismaDeposu = calismaDeposu;
    }
    
    public void calismaKaydet(Ogrenci ogrenci, int sure, String ders) {
        Calisma calisma = new Calisma();
        calisma.setOgrenci(ogrenci);
        calisma.setSureDakika(sure);
        calisma.setDersAdi(ders);
        calisma.setTarih(LocalDate.now());
        
        calismaDeposu.save(calisma);
    }
    
    public List<Calisma> gecmisiGetir(Ogrenci ogrenci) {
        return calismaDeposu.findByOgrenci(ogrenci);
    }
    public List<SkorDTO> yarisTablosunuGetir(Ogrenci ben) {
        List<SkorDTO> skorlar = new ArrayList<>();
        
        // 1. Kendini ekle
        int benimSürem = calismaDeposu.toplamCalismaSuresi(ben);
        skorlar.add(new SkorDTO(ben.getAdSoyad(), ben.getProfilResmiBase64(), benimSürem));
        
        // 2. Takip ettiklerini ekle
        for (Ogrenci arkadas : ben.getTakipEdilenler()) {
            int sure = calismaDeposu.toplamCalismaSuresi(arkadas);
            skorlar.add(new SkorDTO(arkadas.getAdSoyad(), arkadas.getProfilResmiBase64(), sure));
        }
        
        // 3. Sırala (En çok çalışandan en aza)
        Collections.sort(skorlar);
        
        return skorlar;
    }
}