-- ─────────────────────────────────────────────────────────────────────────────
-- LINARTES · Base de datos de la tienda web (Postgres en Supabase)
--
-- Cómo usarlo:
--   Supabase → tu proyecto → SQL Editor → New query → pegar este archivo
--   completo → Run.
--
-- Es idempotente: se puede correr más de una vez sin borrar datos.
-- (La versión anterior para MySQL quedó en db/schema.mysql.sql solo como referencia.)
-- ─────────────────────────────────────────────────────────────────────────────

-- Mantiene updated_at al día (equivalente a ON UPDATE CURRENT_TIMESTAMP de MySQL)
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Stock propio de la web (independiente del SAAS) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock (
  slug            VARCHAR(80)  NOT NULL PRIMARY KEY,
  qty             INTEGER      NOT NULL DEFAULT 0,
  low_threshold   INTEGER      NOT NULL DEFAULT 3,   -- "Últimas unidades" cuando disponible <= este valor
  safety_buffer   INTEGER      NOT NULL DEFAULT 1,   -- unidades que la web nunca vende (colchón vs. otros canales)
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_stock_qty    CHECK (qty >= 0),
  CONSTRAINT chk_stock_low    CHECK (low_threshold >= 0),
  CONSTRAINT chk_stock_buffer CHECK (safety_buffer >= 0)
);

-- Historial de cambios de stock (auditoría) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        VARCHAR(80)  NOT NULL,
  delta       INTEGER      NOT NULL,
  qty_after   INTEGER      NOT NULL,
  reason      VARCHAR(40)  NOT NULL,           -- 'telegram_set' | 'telegram_add' | 'sale'
  actor       VARCHAR(120) NULL,               -- usuario de Telegram o número de pedido
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_log_slug ON public.stock_log (slug, created_at);

-- Pedidos web ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.web_orders (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id              CHAR(36)     NOT NULL,           -- UUID que ve el cliente (nunca el id interno)
  status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING_PAYMENT',
                         -- PENDING_PAYMENT | PAID | REVIEW | EXPIRED | REFUNDED
  customer_name          VARCHAR(120) NOT NULL,
  customer_email         VARCHAR(160) NOT NULL,
  customer_phone         VARCHAR(20)  NOT NULL,
  shipping_type          VARCHAR(10)  NOT NULL,           -- CIUDAD | INTERIOR
  department             VARCHAR(60)  NOT NULL,
  municipality           VARCHAR(80)  NOT NULL,
  address                VARCHAR(300) NOT NULL,
  address_reference      VARCHAR(200) NULL,
  notes                  VARCHAR(500) NULL,
  subtotal_cents         INTEGER      NOT NULL,
  shipping_cents         INTEGER      NOT NULL,
  total_cents            INTEGER      NOT NULL,
  currency               CHAR(3)      NOT NULL DEFAULT 'GTQ',
  recurrente_checkout_id VARCHAR(60)  NULL,
  recurrente_payment_id  VARCHAR(60)  NULL,
  paid_cents             INTEGER      NULL,
  oversold               SMALLINT     NOT NULL DEFAULT 0, -- se pagó pero no alcanzó el stock web
  registered_in_saas     SMALLINT     NOT NULL DEFAULT 0, -- el equipo ya lo cargó al SAAS
  registered_by          VARCHAR(120) NULL,
  client_ip              VARCHAR(45)  NULL,
  expires_at             TIMESTAMPTZ  NOT NULL,
  paid_at                TIMESTAMPTZ  NULL,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_orders_public_id UNIQUE (public_id),
  CONSTRAINT uq_orders_checkout  UNIQUE (recurrente_checkout_id),
  CONSTRAINT chk_orders_totals   CHECK (subtotal_cents >= 0 AND shipping_cents >= 0 AND total_cents >= 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.web_orders (status, created_at);

CREATE TABLE IF NOT EXISTS public.web_order_items (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id          BIGINT       NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  slug              VARCHAR(80)  NOT NULL,
  name              VARCHAR(160) NOT NULL,
  unit_price_cents  INTEGER      NOT NULL,
  quantity          INTEGER      NOT NULL,
  CONSTRAINT chk_items_qty CHECK (quantity > 0 AND unit_price_cents >= 0)
);
CREATE INDEX IF NOT EXISTS idx_items_order ON public.web_order_items (order_id);

-- Eventos de webhook ya procesados (idempotencia) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  event_id     VARCHAR(100) NOT NULL PRIMARY KEY,     -- svix-id (igual en reintentos)
  provider     VARCHAR(20)  NOT NULL,
  event_type   VARCHAR(60)  NOT NULL,
  received_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Cola de notificaciones (patrón outbox) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  channel          VARCHAR(10)  NOT NULL,             -- telegram | email
  recipient        VARCHAR(160) NOT NULL,
  subject          VARCHAR(200) NULL,
  body_text        TEXT         NOT NULL,
  body_html        TEXT         NULL,
  status           VARCHAR(10)  NOT NULL DEFAULT 'pending',   -- pending | sending | sent | failed
  attempts         INTEGER      NOT NULL DEFAULT 0,
  next_attempt_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_error       VARCHAR(500) NULL,
  order_id         BIGINT       NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_due ON public.notifications (status, next_attempt_at);

-- Triggers de updated_at ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_stock_updated_at ON public.stock;
CREATE TRIGGER trg_stock_updated_at BEFORE UPDATE ON public.stock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.web_orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.web_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- SEGURIDAD (importante en Supabase)
-- Supabase publica automáticamente las tablas de "public" por su API REST
-- usando la llave anon. Esta tienda NO usa esa API: el servidor se conecta
-- directo a Postgres. Por eso:
--   1. Se activa RLS en todas las tablas SIN crear políticas → la API pública
--      no puede leer ni escribir nada (pedidos, correos, teléfonos…).
--   2. Además se quitan los permisos a los roles anon y authenticated.
-- El usuario "postgres" (el de la cadena de conexión) no se ve afectado.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.stock           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.stock, public.stock_log, public.web_orders, public.web_order_items,
                  public.webhook_events, public.notifications FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.stock, public.stock_log, public.web_orders, public.web_order_items,
                  public.webhook_events, public.notifications FROM authenticated;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;

-- Productos iniciales (stock en 0: cárgalo con el bot, ej. /stock marco 10) ──
-- Los slugs deben coincidir con los de src/data/products.ts.
INSERT INTO public.stock (slug, qty) VALUES
  ('set-regalo-premium', 0),
  ('kit-corporativo', 0),
  ('marco-giratorio-360', 0),
  ('kit-damas-de-honor', 0)
ON CONFLICT (slug) DO NOTHING;
