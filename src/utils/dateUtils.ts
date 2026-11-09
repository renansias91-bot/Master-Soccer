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

/**
 * Retorna texto amigável de data do jogo:
 * - "Hoje • DD/MM/AAAA às HH:MM" se for hoje
 * - "Amanhã • DD/MM às HH:MM" se for amanhã
 * - "DD/MM/AAAA às HH:MM" caso contrário
 */
export function formatarDataAmigavelJogo(dataStr?: string, hora?: string): string {
  if (!dataStr) return '';
  const dataFormatada = formatarDataExibicao(dataStr);
  const hoje = getDataAtualBrasil();

  const agora = new Date();
  const amanhaDate = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  const amanhaFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const amanha = amanhaFormatter.format(amanhaDate);

  const horaTexto = hora ? ` às ${hora}` : '';

  if (dataFormatada === hoje) {
    return `Hoje • ${dataFormatada}${horaTexto}`;
  }

  if (dataFormatada === amanha) {
    const partes = dataFormatada.split('/');
    const diaMes = partes.length >= 2 ? `${partes[0]}/${partes[1]}` : dataFormatada;
    return `Amanhã • ${diaMes}${horaTexto}`;
  }

  return `${dataFormatada}${horaTexto}`;
}

/**
 * Converte data e hora para número de ordenação preciso (YYYYMMDDHHMM)
 */
export function dataHoraParaValorOrdenacao(dataStr?: string, horaStr?: string): number {
  const dataVal = dataParaValorOrdenacao(dataStr);
  let minutos = 0;
  if (horaStr) {
    const limpo = horaStr.trim();
    const partes = limpo.split(':');
    const h = parseInt(partes[0] || '0', 10);
    const m = parseInt(partes[1] || '0', 10);
    minutos = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  }
  return dataVal * 10000 + minutos;
}

/**
 * Ordena lista de jogos conforme a regra estrita do Master Soccer:
 * 1º) Jogos que ainda vão acontecer (realizado = false) em ordem crescente de data + hora (mais próximo primeiro: ex 06/11 às 14:30, depois 06/11 às 15:50, depois 14/11...).
 * 2º) Jogos já realizados / finalizados (realizado = true) em ordem decrescente de data + hora (mais recente primeiro: ex 05/11, depois 28/10...).
 */
export function ordenarJogosAgenda<T extends { realizado?: boolean; dataJogo: string; hora?: string }>(jogos: T[]): T[] {
  return jogos.slice().sort((a, b) => {
    const realA = Boolean(a.realizado);
    const realB = Boolean(b.realizado);
    if (realA !== realB) {
      return realA ? 1 : -1;
    }

    const valA = dataHoraParaValorOrdenacao(a.dataJogo, a.hora);
    const valB = dataHoraParaValorOrdenacao(b.dataJogo, b.hora);

    if (!realA) {
      return valA - valB;
    }

    return valB - valA;
  });
}
