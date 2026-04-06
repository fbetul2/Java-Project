package com.proje.sosyal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proje.sosyal.model.Calisma;
import com.proje.sosyal.model.Ogrenci;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CalismaRepository extends JpaRepository<Calisma, Long> {
    
    List<Calisma> findByOgrenci(Ogrenci ogrenci);

    @Query("SELECT COALESCE(SUM(c.sureDakika), 0) FROM Calisma c WHERE c.ogrenci = :ogrenci")
    Integer toplamCalismaSuresi(@Param("ogrenci") Ogrenci ogrenci);
}