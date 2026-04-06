package com.proje.sosyal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proje.sosyal.model.Not;
import com.proje.sosyal.model.Ogrenci;

public interface NotRepository extends JpaRepository<Not, Long> {
    // En yeni not en üstte gelsin
    List<Not> findByOgrenciOrderByTarihDesc(Ogrenci ogrenci);
}