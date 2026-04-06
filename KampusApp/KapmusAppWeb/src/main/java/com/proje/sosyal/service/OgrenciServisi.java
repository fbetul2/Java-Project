package com.proje.sosyal.service;

import java.util.Collections;
import java.util.Optional;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.OgrenciRepository;

@Service
public class OgrenciServisi implements UserDetailsService {

    private final OgrenciRepository ogrenciDeposu;
    private final PasswordEncoder passwordEncoder;


    public OgrenciServisi(OgrenciRepository ogrenciDeposu, @Lazy PasswordEncoder passwordEncoder) {
        this.ogrenciDeposu = ogrenciDeposu;
        this.passwordEncoder = passwordEncoder;
    }


    @Override
    public UserDetails loadUserByUsername(String kullaniciAdi) throws UsernameNotFoundException {
        Ogrenci ogrenci = ogrenciDeposu.findByKullaniciAdi(kullaniciAdi)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı"));

      
        return new User(
                ogrenci.getKullaniciAdi(),
                ogrenci.getSifre(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + ogrenci.getRol()))
        );
    }

    public void kayitOl(Ogrenci ogrenci) {
        ogrenci.setSifre(passwordEncoder.encode(ogrenci.getSifre()));
        ogrenciDeposu.save(ogrenci);
    }

    public boolean kullaniciAdiVarMi(String kAdi) {
        return ogrenciDeposu.findByKullaniciAdi(kAdi).isPresent();
    }

    public Ogrenci mevcutOgrenciyiGetir(String kullaniciAdi) {
        return ogrenciDeposu.findByKullaniciAdi(kullaniciAdi).orElse(null);
    }

    public Ogrenci idIleGetir(Long id) {
        return ogrenciDeposu.findById(id).orElse(null);
    }
    public void guncelle(Ogrenci ogrenci) {
        ogrenciDeposu.save(ogrenci); 
    }
 
    @Transactional
    public void takipEt(Long takipEdenId, Long takipEdilecekId) {
        Optional<Ogrenci> takipEden = ogrenciDeposu.findById(takipEdenId);
        Optional<Ogrenci> takipEdilecek = ogrenciDeposu.findById(takipEdilecekId);

        if (takipEden.isPresent() && takipEdilecek.isPresent()) {
            Ogrenci eden = takipEden.get();
            Ogrenci edilen = takipEdilecek.get();

            if (!eden.getTakipEdilenler().contains(edilen)) {
                eden.getTakipEdilenler().add(edilen);
                ogrenciDeposu.save(eden);
            }
        }
    }

    public void profilGuncelle(Ogrenci ogrenci, String yeniAd, String yeniBolum, String yeniSifre) {
        ogrenci.setAdSoyad(yeniAd);
        ogrenci.setBolum(yeniBolum);
        

        if (yeniSifre != null && !yeniSifre.trim().isEmpty()) {
            ogrenci.setSifre(passwordEncoder.encode(yeniSifre));
        }
        
        ogrenciDeposu.save(ogrenci);
    }

    @Transactional
    public void ogrenciyiSil(Long id) {

        ogrenciDeposu.begenileriSil(id);
 
        ogrenciDeposu.takipleriSil(id);
        
   
        ogrenciDeposu.yorumlariSil(id);
        
    
        ogrenciDeposu.bildirimleriSil(id);
  
        ogrenciDeposu.mesajlariSil(id);
        
        ogrenciDeposu.notlariSil(id);
        
        ogrenciDeposu.deleteById(id);
    }

    public void takibiBirak(Long benId, Long hedefId) {
        Ogrenci ben = ogrenciDeposu.findById(benId).orElse(null);
        Ogrenci hedef = ogrenciDeposu.findById(hedefId).orElse(null);
        
        if (ben != null && hedef != null) {
            ben.getTakipEdilenler().remove(hedef);
            ogrenciDeposu.save(ben);
        }
    }

    
    public void takipciyiCikar(Long benId, Long hedefTakipciId) {
        
        Ogrenci ben = ogrenciDeposu.findById(benId).orElse(null);
        Ogrenci takipci = ogrenciDeposu.findById(hedefTakipciId).orElse(null);
        
        if (ben != null && takipci != null) {
            takipci.getTakipEdilenler().remove(ben);
            ogrenciDeposu.save(takipci);
        }
    }
}