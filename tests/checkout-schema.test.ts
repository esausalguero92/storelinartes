import { describe, expect, it } from "vitest";
import { checkoutRequestSchema, mergeItems, toCents } from "@/server/domain/checkout-schema";

const valid = {
  items: [{ slug: "ahumador-de-whisky", qty: 1 }],
  customer: { name: "Ana López", email: "ANA@Example.com ", phone: "5555-5555" },
  shipping: { type: "CIUDAD", department: "Guatemala", municipality: "Zona 10", address: "4a avenida 12-34" },
  turnstileToken: "tok",
};

describe("checkoutRequestSchema", () => {
  it("acepta y normaliza un pedido válido", () => {
    const r = checkoutRequestSchema.parse(valid);
    expect(r.customer.email).toBe("ana@example.com");
    expect(r.customer.phone).toBe("55555555");
    expect(r.shipping.reference).toBeNull();
  });

  it("rechaza campos extra (ej. intentar mandar el precio)", () => {
    expect(checkoutRequestSchema.safeParse({ ...valid, price: 1 }).success).toBe(false);
    expect(
      checkoutRequestSchema.safeParse({ ...valid, items: [{ slug: "ahumador-de-whisky", qty: 1, price: 1 }] }).success,
    ).toBe(false);
  });

  it("rechaza slugs con caracteres peligrosos (inyección)", () => {
    for (const slug of ["x' OR '1'='1", "../../etc", "a;DROP TABLE stock", "<script>"]) {
      expect(checkoutRequestSchema.safeParse({ ...valid, items: [{ slug, qty: 1 }] }).success).toBe(false);
    }
  });

  it("rechaza cantidades inválidas", () => {
    for (const qty of [0, -1, 1.5, 999]) {
      expect(checkoutRequestSchema.safeParse({ ...valid, items: [{ slug: "a-b", qty }] }).success).toBe(false);
    }
  });

  it("quita saltos de línea (anti inyección de cabeceras de correo)", () => {
    const r = checkoutRequestSchema.parse({
      ...valid,
      customer: { ...valid.customer, name: "Ana\r\nBcc: victima@x.com" },
    });
    expect(r.customer.name).not.toMatch(/[\r\n]/);
  });

  it("rechaza correos y teléfonos inválidos, y departamentos inexistentes", () => {
    expect(checkoutRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, email: "no-es-correo" } }).success).toBe(false);
    expect(checkoutRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, phone: "123" } }).success).toBe(false);
    expect(checkoutRequestSchema.safeParse({ ...valid, shipping: { ...valid.shipping, department: "Narnia" } }).success).toBe(false);
  });

  it("acepta teléfono con prefijo +502", () => {
    expect(checkoutRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, phone: "+502 4123 4567" } }).success).toBe(true);
  });
});

describe("helpers", () => {
  it("mergeItems agrupa productos repetidos", () => {
    expect(mergeItems([{ slug: "a", qty: 1 }, { slug: "a", qty: 2 }, { slug: "b", qty: 1 }])).toEqual([
      { slug: "a", qty: 3 },
      { slug: "b", qty: 1 },
    ]);
  });
  it("toCents evita errores de punto flotante", () => {
    expect(toCents(175)).toBe(17500);
    expect(toCents(19.99)).toBe(1999);
  });
});
