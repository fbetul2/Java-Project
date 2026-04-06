package com.proje.sosyal.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import com.proje.sosyal.model.Not;
import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.NotRepository;

@Service
public class NotServisi {

    private final NotRepository notRepo;

    public NotServisi(NotRepository notRepo) {
        this.notRepo = notRepo;
    }

    public List<Not> notlariGetir(Ogrenci ogrenci) {
        return notRepo.findByOgrenciOrderByTarihDesc(ogrenci);
    }

    public void notEkle(Ogrenci ogrenci, String icerik) {
        try {
            Not not = new Not();
            not.setOgrenci(ogrenci);
            not.setIcerik(icerik);
            not.setTarih(LocalDateTime.now());
            notRepo.save(not);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void notSil(Long id, Ogrenci ogrenci) {
        Not not = notRepo.findById(id).orElse(null);
        // Başkasının notunu silemesin kontrolü
        if (not != null && not.getOgrenci().getId().equals(ogrenci.getId())) {
            notRepo.delete(not);
        }
    }
 // Not durumunu değiştir (Tik at / kaldır)
    public void durumDegistir(Long id, Ogrenci ogrenci) {
        Not not = notRepo.findById(id).orElse(null);
        if (not != null && not.getOgrenci().getId().equals(ogrenci.getId())) {
            not.setTamamlandi(!not.isTamamlandi()); // True ise False, False ise True yap
            notRepo.save(not);
        }
    }
}