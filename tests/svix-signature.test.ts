import { describe, expect, it } from "vitest";
import { signSvix, verifySvixSignature } from "@/server/payments/svix-signature";

const secret = "whsec_" + Buffer.from("super-secreto-de-prueba-123456").toString("base64");
const body = JSON.stringify({ event_type: "intent.succeeded", checkout: { id: "ch_abc123" } });
const now = 1_790_000_000;

describe("verifySvixSignature", () => {
  it("acepta una firma válida", () => {
    const sig = signSvix(secret, "msg_1", now, body);
    expect(() => verifySvixSignature(secret, body, { id: "msg_1", timestamp: String(now), signature: sig }, now)).not.toThrow();
  });

  it("acepta cuando hay varias firmas (rotación de secreto)", () => {
    const sig = `v1,AAAA ${signSvix(secret, "msg_1", now, body)}`;
    expect(() => verifySvixSignature(secret, body, { id: "msg_1", timestamp: String(now), signature: sig }, now)).not.toThrow();
  });

  it("rechaza el cuerpo alterado (ej. monto modificado)", () => {
    const sig = signSvix(secret, "msg_1", now, body);
    const tampered = body.replace("ch_abc123", "ch_otro999");
    expect(() => verifySvixSignature(secret, tampered, { id: "msg_1", timestamp: String(now), signature: sig }, now)).toThrow(/Firma/);
  });

  it("rechaza un secreto distinto", () => {
    const sig = signSvix("whsec_" + Buffer.from("otro").toString("base64"), "msg_1", now, body);
    expect(() => verifySvixSignature(secret, body, { id: "msg_1", timestamp: String(now), signature: sig }, now)).toThrow();
  });

  it("rechaza replays fuera de la ventana de 5 minutos", () => {
    const old = now - 10 * 60;
    const sig = signSvix(secret, "msg_1", old, body);
    expect(() => verifySvixSignature(secret, body, { id: "msg_1", timestamp: String(old), signature: sig }, now)).toThrow(/tolerancia/);
  });

  it("rechaza cabeceras faltantes o mal formadas", () => {
    expect(() => verifySvixSignature(secret, body, { id: "", timestamp: String(now), signature: "v1,x" }, now)).toThrow();
    expect(() => verifySvixSignature(secret, body, { id: "m", timestamp: "abc", signature: "v1,x" }, now)).toThrow();
    expect(() => verifySvixSignature(secret, body, { id: "m", timestamp: String(now), signature: "v2,xyz" }, now)).toThrow();
  });
});
