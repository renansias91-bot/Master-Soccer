/**
 * Retorna a sigla de 2 letras do APELIDO do atleta (ex: DL, JO, PA, KA).
 * Se o atleta não tiver apelido, usa as iniciais do nome.
 */
export function obterIniciaisApelido(atleta?: { nome: string; apelido?: string } | null): string {
  if (!atleta) return '--';

  const apelidoLimpo = atleta.apelido ? atleta.apelido.trim() : '';
  if (apelidoLimpo) {
    const partes = apelidoLimpo.split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    if (apelidoLimpo.length >= 2) {
      return apelidoLimpo.substring(0, 2).toUpperCase();
    }
    return apelidoLimpo.toUpperCase();
  }

  const nomeLimpo = atleta.nome ? atleta.nome.trim() : '';
  if (!nomeLimpo) return '--';

  const partesNome = nomeLimpo.split(/\s+/);
  if (partesNome.length >= 2) {
    return (partesNome[0][0] + partesNome[1][0]).toUpperCase();
  }
  return nomeLimpo.substring(0, 2).toUpperCase();
}
