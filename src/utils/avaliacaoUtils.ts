/**
 * Utilitários de avaliação conforme regra Master Soccer RJ
 * Avaliação Simples: Só nota + texto, sem especificação
 */

export function tituloNota(nota: number): string {
  const rounded = Math.round(nota);
  if (rounded <= 2) return "Muito Ruim";
  if (rounded <= 4) return "Ruim";
  if (rounded <= 6) return "Precisa Melhorar";
  if (rounded === 7) return "Bom";
  if (rounded === 8) return "Muito Bom";
  if (rounded === 9) return "Excelente";
  if (rounded >= 10) return "Perfeito 👏";
  return "";
}
