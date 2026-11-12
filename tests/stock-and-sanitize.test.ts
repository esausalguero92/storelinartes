import { describe, expect, it } from "vitest";
import { resolveSlug, sellableUnits, stockStatus } from "@/server/domain/stock";
import { escapeHtml, headerSafe, safeEqual } from "@/server/security/sanitize";

const slugs = ["tarro-mundialista", "ahumador-de-whisky", "set-para-preparar-cafe"];

describe("stock", () => {
  it("respeta el colchón de seguridad", () => {
    expect(sellableUnits({ qty: 5, safety_buffer: 1 })).toBe(4);
    expect(sellableUnits({ qty: 1, safety_buffer: 1 })).toBe(0);
  });
  it("calcula el estado", () => {
    const base = { slug: "x", low_threshold: 3, safety_buffer: 1 };
    expect(stockStatus({ ...base, qty: 1 })).toBe("soldout");
    expect(stockStatus({ ...base, qty: 3 })).toBe("low");
    expect(stockStatus({ ...base, qty: 10 })).toBe("available");
    expect(stockStatus(undefined)).toBe("soldout");
  });
  it("resuelve alias del bot", () => {
    expect(resolveSlug("tarro", slugs)).toBe("tarro-mundialista");
    expect(resolveSlug("cafe", slugs)).toBe("set-para-preparar-cafe");
    expect(resolveSlug("AHUMADOR", slugs)).toBe("ahumador-de-whisky");
    expect(resolveSlug("x' or 1=1", slugs)).toBeNull();
    expect(resolveSlug("zz", slugs)).toBeNull();
  });
});

describe("sanitize", () => {
  it("escapa HTML", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
  it("limpia cabeceras", () => {
    expect(headerSafe("a\r\nBcc: b")).toBe("a  Bcc: b");
  });
  it("compara secretos", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
  });
});
