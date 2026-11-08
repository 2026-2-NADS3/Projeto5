import type { LetraDisc } from "../types/dominio";

/**
 * Formação dos grupos DISC — seção 4.3 do documento de implementação.
 *
 * - Nº de grupos = total de participantes ÷ 4, arredondado para baixo (mínimo 1).
 * - Cada grupo recebe uma pessoa de cada letra (D, I, S, C) enquanto houver.
 * - As vagas restantes são completadas evitando letra repetida no grupo.
 * - Quem sobra vai para grupos já formados, preferindo os que não têm sua letra (ficam com 5).
 *
 * `embaralhar` decide a ordem dentro de cada letra (regerar dá grupos diferentes);
 * nos testes ela é a identidade, para o resultado ser previsível.
 */

export const LETRAS: LetraDisc[] = ["D", "I", "S", "C"];
export const TAMANHO_GRUPO = 4;

export interface Participante {
  alunoId: string;
  letra: LetraDisc | null;
}

export function formarGrupos<T extends Participante>(participantes: T[], embaralhar: <U>(lista: U[]) => U[] = (l) => l): T[][] {
  if (participantes.length === 0) return [];
  const quantidade = Math.max(1, Math.floor(participantes.length / TAMANHO_GRUPO));
  const grupos: T[][] = Array.from({ length: quantidade }, () => []);

  // 1) uma pessoa de cada letra por grupo, enquanto houver
  const sobra: T[] = [];
  for (const letra of LETRAS) {
    const daLetra = embaralhar(participantes.filter((p) => p.letra === letra));
    daLetra.forEach((p, i) => (i < quantidade ? grupos[i].push(p) : sobra.push(p)));
  }
  sobra.push(...embaralhar(participantes.filter((p) => p.letra === null)));

  // 2) e 3) o resto vai sempre para o grupo menor, evitando letra repetida
  for (const pessoa of sobra) {
    const menor = Math.min(...grupos.map((g) => g.length));
    const candidatos = grupos.filter((g) => g.length === menor);
    const semALetra = candidatos.find((g) => !g.some((m) => m.letra !== null && m.letra === pessoa.letra));
    (semALetra ?? candidatos[0]).push(pessoa);
  }
  return grupos;
}

/** Embaralhamento de Fisher-Yates (usado pelo mock/API ao gerar ou regerar). */
export function embaralharAleatorio<U>(lista: U[]): U[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
