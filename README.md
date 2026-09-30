# 🏠 Home Stock Manager

Sistema de gestión de stock hogareño. Permite registrar productos del hogar escaneando tickets de supermercado y controlar el consumo de forma manual.

## 🌐 Demo en vivo

> La app está desplegada y lista para usar. Pedile la URL a Leo.

## ✨ Funcionalidades

- **📷 Escaneo de QR** — Activá la cámara y apuntala al QR de tu ticket de supermercado. El sistema detecta el código y abre un formulario para cargar los productos.
- **✏️ Carga manual** — Agregá productos directamente con nombre, marca, categoría, cantidad y unidad (unidades / gramos / mililitros).
- **📦 Inventario** — Visualizá todo el stock en cards. Filtrá por categoría o buscá por nombre.
- **🔻 Consumo parcial o total** — Consumí una cantidad específica (ej: 200g) o eliminá todo el stock de un producto de una vez.
- **⚠️ Alertas de stock bajo** — Si un producto cae por debajo del mínimo configurado, aparece una alerta en el dashboard.
- **📊 Dashboard** — Resumen del inventario con estadísticas y los últimos movimientos.
- **🗂️ Categorías** — Alimentos, Bebidas, Limpieza, Higiene personal, Lácteos, Congelados, Panadería, Otros.

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 21 + Spring Boot 3.3 |
| Base de datos | PostgreSQL (Neon - cloud) |
| ORM | Hibernate / Spring Data JPA |
| Frontend | React 18 + Vite + TailwindCSS |
| QR Scanner | jsQR (via cámara del navegador) |
| Testing | JUnit 5 + Mockito |
| Deploy Backend | Render (Docker) |
| Deploy Frontend | Vercel |
| Deploy DB | Neon (PostgreSQL serverless) |

## 🏗️ Arquitectura

```
Vercel (Frontend React)
        │
        │ HTTP REST (JSON)
        ▼
Render (Backend Spring Boot) ←→ Neon (PostgreSQL)
```

## 📁 Estructura del proyecto

```
home-stock/
├── backend/                          ← Spring Boot 3 + Java 21
│   ├── Dockerfile                    ← Build + deploy en Render
│   ├── railway.json
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/homestock/
│       │   ├── HomeStockApplication.java
│       │   ├── model/          ← Product, Category, Ticket, TicketItem, StockMovement
│       │   ├── dto/            ← ProductDTO, ConsumeDTO, TicketDTO, TicketItemDTO
│       │   ├── repository/     ← 4 repositorios JPA
│       │   ├── service/        ← ProductService, TicketService, StockMovementService
│       │   ├── controller/     ← 4 REST controllers
│       │   ├── validator/      ← StockValidator (lógica de validación)
│       │   ├── exception/      ← GlobalExceptionHandler + excepciones custom
│       │   └── config/         ← CorsConfig, DataInitializer
│       └── test/java/com/homestock/
│           ├── EquivalencePartitionTest.java  ← 7 tests
│           ├── BlackBoxTest.java              ← 9 tests
│           └── BoundaryValueTest.java         ← 6 tests
└── frontend/                         ← React 18 + Vite + TailwindCSS
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               ← Router + Navegación
        ├── api/homeStockApi.js   ← Cliente Axios
        ├── components/
        │   ├── ProductCard.jsx   ← Card de producto con botón consumir
        │   ├── ConsumeModal.jsx  ← Modal consumo parcial/total
        │   └── LowStockAlert.jsx ← Alerta de stock bajo
        └── pages/
            ├── Dashboard.jsx     ← Stats + movimientos recientes
            ├── Inventory.jsx     ← Lista de productos con filtros
            ├── ScanTicket.jsx    ← Escáner QR + formulario de carga
            └── AddProduct.jsx    ← Formulario agregar producto
```

## 🧪 Tests

El proyecto incluye **22 tests unitarios** (JUnit 5, no requieren base de datos):

| Técnica | Archivo | Tests | Qué prueba |
|---|---|---|---|
| Particiones Equivalentes | `EquivalencePartitionTest.java` | 7 | Cantidades válidas (>0), cero, negativas y null |
| Caja Negra | `BlackBoxTest.java` | 9 | Consumo parcial, consumo exacto y consumo que excede el stock |
| Valores de Borde | `BoundaryValueTest.java` | 6 | Límites exactos de la validación de cantidad y consumo |

### Correr los tests

```bash
cd backend
mvn clean test
```

Resultado esperado:
```
Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## 🚀 Correr el proyecto localmente

### Requisitos previos
- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16 (o usar la base de datos Neon con las variables de entorno)

### Backend

```bash
cd backend
mvn spring-boot:run
```

El backend queda disponible en `http://localhost:8080`.
Las tablas se crean automáticamente al iniciar.
Las 8 categorías se cargan automáticamente.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrí `http://localhost:5173` en el navegador.

### Variables de entorno (backend)

| Variable | Descripción | Valor local por defecto |
|---|---|---|
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL | `jdbc:postgresql://localhost:5432/homestock` |
| `SPRING_DATASOURCE_USERNAME` | Usuario de la DB | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Password de la DB | `postgres` |
| `DB_SSL_MODE` | Modo SSL (Neon requiere `require`) | `disable` |
| `DB_SSL` | Habilitar SSL | `false` |
| `PORT` | Puerto del servidor | `8080` |

### Variables de entorno (frontend)

| Variable | Descripción | Valor local por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:8080/api` |

## ☁️ Deploy (producción)

### Base de datos — Neon
- Servicio: [neon.tech](https://neon.tech) (PostgreSQL serverless gratuito)
- Sin vencimiento, sin tarjeta de crédito

### Backend — Render
- Servicio: [render.com](https://render.com) (Web Service gratuito)
- Runtime: Docker (usa el `Dockerfile` del proyecto)
- ⚠️ En el plan gratuito el servidor se "duerme" después de 15 min de inactividad. La primera petición puede tardar ~30 segundos en despertar.

### Frontend — Vercel
- Servicio: [vercel.com](https://vercel.com) (gratuito, sin limitaciones)
- Deploy automático en cada push a `main`

## 📡 API REST

```
GET    /api/products              → Listar todos los productos
GET    /api/products?search=X     → Buscar por nombre
GET    /api/products?categoryId=X → Filtrar por categoría
POST   /api/products              → Crear producto
PUT    /api/products/{id}         → Editar producto
DELETE /api/products/{id}         → Eliminar producto
PATCH  /api/products/{id}/consume → Consumir stock (parcial o total)
GET    /api/products/low-stock    → Productos con stock bajo

POST   /api/tickets/scan          → Parsear QR de ticket
POST   /api/tickets/process       → Procesar ticket y actualizar stock
GET    /api/tickets               → Historial de tickets

GET    /api/categories            → Listar categorías
GET    /api/movements             → Últimos 20 movimientos
GET    /api/movements/product/{id}→ Movimientos de un producto
```

## 💡 Ideas a futuro

- Automatización de la carga de productos mediante integración con APIs de supermercados
- Lector físico en el tacho de basura para eliminar productos automáticamente al descartarlos
- Notificaciones push cuando el stock cae por debajo del mínimo
- Lista de compras automática basada en productos con stock bajo
- Historial de gasto mensual
