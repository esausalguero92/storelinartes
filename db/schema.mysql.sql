-- ─────────────────────────────────────────────────────────────────────────────
-- ZORA · Base de datos de la tienda web (MySQL 8 / MariaDB 10.6+ en Hostinger)
--
-- Cómo usarlo:
--   hPanel → Bases de datos → phpMyAdmin → seleccionar la base → pestaña SQL →
--   pegar este archivo completo → Continuar.
--
-- Es idempotente: se puede correr más de una vez sin borrar datos.
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;

-- Stock propio de la web (independiente del SAAS) ────────────────────────────
CREATE TABLE IF NOT EXISTS stock (
  slug            VARCHAR(80)  NOT NULL PRIMARY KEY,
  qty             INT          NOT NULL DEFAULT 0,
  low_threshold   INT          NOT NULL DEFAULT 3,   -- "Últimas unidades" cuando disponible <= este valor
  safety_buffer   INT          NOT NULL DEFAULT 1,   -- unidades que la web nunca vende (colchón vs. otros canales)
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_stock_qty    CHECK (qty >= 0),
  CONSTRAINT chk_stock_low    CHECK (low_threshold >= 0),
  CONSTRAINT chk_stock_buffer CHECK (safety_buffer >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de cambios de stock (auditoría) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_log (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(80)  NOT NULL,
  delta       INT          NOT NULL,
  qty_after   INT          NOT NULL,
  reason      VARCHAR(40)  NOT NULL,           -- 'telegram_set' | 'telegram_add' | 'sale'
  actor       VARCHAR(120) NULL,               -- usuario de Telegram o número de pedido
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stock_log_slug (slug, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pedidos web ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_orders (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  public_id            CHAR(36)     NOT NULL,             -- UUID que ve el cliente (nunca el id interno)
  status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING_PAYMENT',
                       -- PENDING_PAYMENT | PAID | REVIEW | EXPIRED | REFUNDED
  customer_name        VARCHAR(120) NOT NULL,
  customer_email       VARCHAR(160) NOT NULL,
  customer_phone       VARCHAR(20)  NOT NULL,
  shipping_type        VARCHAR(10)  NOT NULL,             -- CIUDAD | INTERIOR
  department           VARCHAR(60)  NOT NULL,
  municipality         VARCHAR(80)  NOT NULL,
  address              VARCHAR(300) NOT NULL,
  address_reference    VARCHAR(200) NULL,
  notes                VARCHAR(500) NULL,
  subtotal_cents       INT          NOT NULL,
  shipping_cents       INT          NOT NULL,
  total_cents          INT          NOT NULL,
  currency             CHAR(3)      NOT NULL DEFAULT 'GTQ',
  recurrente_checkout_id VARCHAR(60) NULL,
  recurrente_payment_id  VARCHAR(60) NULL,
  paid_cents           INT          NULL,
  oversold             TINYINT(1)   NOT NULL DEFAULT 0,   -- se pagó pero no alcanzó el stock web
  registered_in_saas   TINYINT(1)   NOT NULL DEFAULT 0,   -- el equipo ya lo cargó al SAAS
  registered_by        VARCHAR(120) NULL,
  client_ip            VARCHAR(45)  NULL,
  expires_at           DATETIME     NOT NULL,
  paid_at              DATETIME     NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orders_public_id (public_id),
  UNIQUE KEY uq_orders_checkout (recurrente_checkout_id),
  KEY idx_orders_status (status, created_at),
  CONSTRAINT chk_orders_totals CHECK (subtotal_cents >= 0 AND shipping_cents >= 0 AND total_cents >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_order_items (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id          BIGINT UNSIGNED NOT NULL,
  slug              VARCHAR(80)  NOT NULL,
  name              VARCHAR(160) NOT NULL,
  unit_price_cents  INT          NOT NULL,
  quantity          INT          NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES web_orders(id) ON DELETE CASCADE,
  CONSTRAINT chk_items_qty CHECK (quantity > 0 AND unit_price_cents >= 0),
  KEY idx_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos de webhook ya procesados (idempotencia) ────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id     VARCHAR(100) NOT NULL PRIMARY KEY,     -- svix-id (igual en reintentos)
  provider     VARCHAR(20)  NOT NULL,
  event_type   VARCHAR(60)  NOT NULL,
  received_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cola de notificaciones (patrón outbox) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  channel          VARCHAR(10)  NOT NULL,             -- telegram | email
  recipient        VARCHAR(160) NOT NULL,
  subject          VARCHAR(200) NULL,
  body_text        TEXT         NOT NULL,
  body_html        MEDIUMTEXT   NULL,
  status           VARCHAR(10)  NOT NULL DEFAULT 'pending',   -- pending | sending | sent | failed
  attempts         INT          NOT NULL DEFAULT 0,
  next_attempt_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_error       VARCHAR(500) NULL,
  order_id         BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_notifications_due (status, next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos iniciales (stock en 0: cárgalo con el bot, ej. /stock tarro 10) ──
INSERT IGNORE INTO stock (slug, qty) VALUES
  ('tarro-mundialista', 0),
  ('ahumador-de-whisky', 0),
  ('set-para-preparar-cafe', 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Mínimo privilegio (recomendado):
-- En hPanel el usuario de la base suele tener todos los permisos. Si tu plan
-- permite crear usuarios con permisos específicos, la app solo necesita:
--   SELECT, INSERT, UPDATE, DELETE  sobre esta base.
-- Nunca: CREATE, DROP, ALTER, GRANT, FILE.
-- ─────────────────────────────────────────────────────────────────────────────
