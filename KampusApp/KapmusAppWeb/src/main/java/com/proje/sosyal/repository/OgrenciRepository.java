package com.proje.sosyal.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.proje.sosyal.model.Ogrenci;

public interface OgrenciRepository extends JpaRepository<Ogrenci, Long> {
    
    Optional<Ogrenci> findByKullaniciAdi(String kullaniciAdi);

    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM gonderi_begenileri WHERE ogrenci_id = :id", nativeQuery = true)
    void begenileriSil(Long id);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM takip_tablosu WHERE takip_eden_id = :id OR takip_edilen_id = :id", nativeQuery = true)
    void takipleriSil(Long id);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM yorum WHERE ogrenci_id = :id", nativeQuery = true)
    void yorumlariSil(Long id);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM bildirim WHERE ogrenci_id = :id", nativeQuery = true)
    void bildirimleriSil(Long id);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM mesaj WHERE gonderen_id = :id OR alici_id = :id", nativeQuery = true)
    void mesajlariSil(Long id);


    @Modifying
    @Transactional
    @Query(value = "DELETE FROM notlar WHERE ogrenci_id = :id", nativeQuery = true)
    void notlariSil(Long id);
}