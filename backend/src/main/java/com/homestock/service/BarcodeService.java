package com.homestock.service;

import com.homestock.dto.ProductDTO;
import com.homestock.model.UnitType;
import com.homestock.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeService {

    private final CategoryRepository categoryRepository;
    private final RestTemplate restTemplate;

    private static final String OFF_URL =
            "https://world.openfoodfacts.org/api/v3/product/{barcode}.json";

    @SuppressWarnings("unchecked")
    public ProductDTO lookupBarcode(String barcode) {
        try {
            log.info("Looking up barcode: {}", barcode);
            Map<String, Object> response = restTemplate.getForObject(OFF_URL, Map.class, barcode);
            if (response == null) return null;

            String status = String.valueOf(response.get("status"));
            if (!"success".equalsIgnoreCase(status) && !"1".equals(status)) {
                log.info("Barcode {} not found in OpenFoodFacts", barcode);
                return null;
            }

            Map<String, Object> product = (Map<String, Object>) response.get("product");
            if (product == null) return null;

            String name = getStr(product, "product_name_es");
            if (name == null || name.isBlank()) name = getStr(product, "product_name");
            if (name == null || name.isBlank()) name = getStr(product, "abbreviated_product_name");
            if (name == null || name.isBlank()) return null;

            String brand = getStr(product, "brands");
            if (brand != null && brand.contains(",")) brand = brand.split(",")[0].trim();

            String quantityStr = getStr(product, "quantity");
            UnitType unitType = detectUnitType(quantityStr);
            Long categoryId = detectCategory(product);
            name = capitalize(name);

            log.info("Barcode {} found: {} ({})", barcode, name, brand);
            return new ProductDTO(null, name, brand, categoryId, null, unitType, BigDecimal.ONE, null);

        } catch (Exception e) {
            log.warn("Error looking up barcode {}: {}", barcode, e.getMessage());
            return null;
        }
    }

    private String getStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString().trim() : null;
    }

    private UnitType detectUnitType(String q) {
        if (q == null) return UnitType.UNITS;
        String ql = q.toLowerCase();
        if (ql.contains("ml") || ql.contains("cl") || ql.contains("litr")) return UnitType.MILLILITERS;
        if (ql.contains("kg") || ql.contains(" g") || ql.contains("gram")) return UnitType.GRAMS;
        return UnitType.UNITS;
    }

    private Long detectCategory(Map<String, Object> product) {
        String cat = getStr(product, "categories");
        if (cat == null) return null;
        String c = cat.toLowerCase();
        if (c.contains("bebida") || c.contains("drink") || c.contains("agua") || c.contains("jugo"))
            return categoryRepository.findByName("Bebidas").map(x -> x.getId()).orElse(null);
        if (c.contains("lácteo") || c.contains("leche") || c.contains("yogur") || c.contains("dairy"))
            return categoryRepository.findByName("Lácteos").map(x -> x.getId()).orElse(null);
        if (c.contains("limpieza") || c.contains("detergente") || c.contains("cleaning"))
            return categoryRepository.findByName("Limpieza").map(x -> x.getId()).orElse(null);
        if (c.contains("higiene") || c.contains("shampoo") || c.contains("personal care"))
            return categoryRepository.findByName("Higiene personal").map(x -> x.getId()).orElse(null);
        if (c.contains("pan") || c.contains("bread") || c.contains("panadería"))
            return categoryRepository.findByName("Panadería").map(x -> x.getId()).orElse(null);
        if (c.contains("congelad") || c.contains("frozen"))
            return categoryRepository.findByName("Congelados").map(x -> x.getId()).orElse(null);
        if (c.contains("aliment") || c.contains("food") || c.contains("comida"))
            return categoryRepository.findByName("Alimentos").map(x -> x.getId()).orElse(null);
        return null;
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        String l = s.toLowerCase();
        return Character.toUpperCase(l.charAt(0)) + l.substring(1);
    }
}
