package com.proje.sosyal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proje.sosyal.model.Bildirim;
import com.proje.sosyal.model.Ogrenci;

public interface BildirimRepository extends JpaRepository<Bildirim, Long> {
    List<Bildirim> findByOgrenciOrderByTarihDesc(Ogrenci ogrenci);
}