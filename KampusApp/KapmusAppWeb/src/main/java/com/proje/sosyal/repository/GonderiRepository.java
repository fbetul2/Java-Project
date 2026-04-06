package com.proje.sosyal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proje.sosyal.model.Gonderi;
import com.proje.sosyal.model.Ogrenci;

public interface GonderiRepository extends JpaRepository<Gonderi, Long> {
     
    List<Gonderi> findByOgrenciInOrOgrenciOrderByTarihDesc(List<Ogrenci> takipEdilenler, Ogrenci ben);
    
    
    List<Gonderi> findByOgrenciOrderByTarihDesc(Ogrenci ogrenci);
    
    
    List<Gonderi> findAllByOrderByTarihDesc();
}