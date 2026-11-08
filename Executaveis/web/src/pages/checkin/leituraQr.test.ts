import { BarcodeFormat, BinaryBitmap, DecodeHintType, EncodeHintType, HybridBinarizer, QRCodeReader, QRCodeWriter, RGBLuminanceSource } from "@zxing/library";
import { describe, expect, it } from "vitest";
import { lerQrIngresso, montarQrIngresso } from "../../providers/supabase/mapeamento";

/**
 * O app gera o QR do ingresso com ZXing ("PE:INGRESSO:{id}:{codigoIngresso}", IngressoQr.java) e o painel
 * lê com ZXing (@zxing/browser usa @zxing/library). Este teste gera a imagem do QR, lê de volta com o mesmo
 * leitor do painel e confere que o ingresso sai inteiro: nenhum caractere perdido no caminho.
 */
function gerarEDecodificar(texto: string): string {
  const matriz = new QRCodeWriter().encode(texto, BarcodeFormat.QR_CODE, 300, 300, new Map([[EncodeHintType.MARGIN, 4]]));
  const largura = matriz.getWidth();
  const altura = matriz.getHeight();
  const pixels = new Uint8ClampedArray(largura * altura);
  for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) pixels[y * largura + x] = matriz.get(x, y) ? 0 : 255;
  const imagem = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, largura, altura)));
  // Imagem gerada (sem ruído de câmera): PURE_BARCODE é o modo do ZXing para QR "limpo".
  return new QRCodeReader().decode(imagem, new Map([[DecodeHintType.PURE_BARCODE, true]])).getText();
}

describe("leitura do QR do ingresso", () => {
  it("lê o QR no formato do app e recupera inscrição e código", () => {
    const inscricaoId = "a1b2c3d4-0000-4000-8000-00000000abcd";
    const qr = montarQrIngresso(inscricaoId, "PE-AB12CD");

    const lido = gerarEDecodificar(qr);

    expect(lido).toBe("PE:INGRESSO:a1b2c3d4-0000-4000-8000-00000000abcd:PE-AB12CD");
    expect(lerQrIngresso(lido)).toEqual({ inscricaoId, codigo: "PE-AB12CD" });
  });

  it("QR de outra coisa não vira ingresso", () => {
    expect(lerQrIngresso(gerarEDecodificar("https://exemplo.org/qualquer"))).toBeNull();
  });
});
