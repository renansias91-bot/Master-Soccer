// Utilitários de data com fuso horário do Brasil (America/Sao_Paulo)

/**
 * Retorna a data atual no fuso horário do Brasil (America/Sao_Paulo) no formato DD/MM/AAAA
 */
export function getDataAtualBrasil(): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return formatter.format(new Date());
}

/**
 * Retorna a data para exibição sem recalcular com new Date() para evitar o erro de fuso (-1 dia).
 * Se já estiver em DD/MM/AAAA, retorna direto.
 * Se estiver em YYYY-MM-DD, converte as partes diretamente.
 */
export function formatarDataExibicao(dataStr?: string): string {
  if (!dataStr) return '';
  const trimmed = dataStr.trim();
  
  // Formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const apenasData = trimmed.split('T')[0];
    const [ano, mes, dia] = apenasData.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return trimmed;
}

/**
 * Converte data (DD/MM/AAAA ou YYYY-MM-DD) para número de ordenação (YYYYMMDD)
 */
export function dataParaValorOrdenacao(dataStr?: string): number {
  if (!dataStr) return 0;
  const trimmed = dataStr.trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [dia, mes, ano] = trimmed.split('/');
    return Number(`${ano}${mes}${dia}`);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const apenasData = trimmed.split('T')[0];
    const [ano, mes, dia] = apenasData.split('-');
    return Number(`${ano}${mes}${dia}`);
  }

  return 0;
}
