package com.proje.sosyal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.proje.sosyal.model.Yorum;

public interface YorumRepository extends JpaRepository<Yorum, Long> {

}