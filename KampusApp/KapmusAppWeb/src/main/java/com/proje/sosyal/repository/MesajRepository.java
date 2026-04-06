package com.proje.sosyal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.proje.sosyal.model.Mesaj;

public interface MesajRepository extends JpaRepository<Mesaj, Long> {


    @Query("SELECT m FROM Mesaj m WHERE (m.gonderen.id = :id1 AND m.alici.id = :id2) OR (m.gonderen.id = :id2 AND m.alici.id = :id1) ORDER BY m.zaman ASC")
    List<Mesaj> sohbetGecmisiniGetir(@Param("id1") Long kullanici1Id, @Param("id2") Long kullanici2Id);
}