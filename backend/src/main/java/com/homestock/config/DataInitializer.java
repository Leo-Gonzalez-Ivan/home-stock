package com.homestock.config;

import com.homestock.model.Category;
import com.homestock.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        List<String> defaultCategories = List.of(
                "Alimentos", "Bebidas", "Limpieza", "Higiene personal",
                "Congelados", "Lácteos", "Panadería", "Otros"
        );

        for (String name : defaultCategories) {
            if (categoryRepository.findByName(name).isEmpty()) {
                categoryRepository.save(new Category(null, name));
            }
        }
    }
}
