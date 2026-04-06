package com.proje.sosyal.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.proje.sosyal.model.Ogrenci;
import com.proje.sosyal.repository.OgrenciRepository;

@Configuration
public class BaslangicVerisi {

    @Bean
    public CommandLineRunner verileriYukle(OgrenciRepository repo, PasswordEncoder encoder) {
        return args -> {
          
            if (repo.findByKullaniciAdi("admin").isEmpty()) {
                Ogrenci admin = new Ogrenci();
                admin.setKullaniciAdi("admin");
                admin.setSifre(encoder.encode("admin123")); 
                admin.setAdSoyad("Sistem Yöneticisi");
                admin.setBolum("Rektörlük");
                admin.setRol("ADMIN"); 
                repo.save(admin);
            }
        };
    }
}