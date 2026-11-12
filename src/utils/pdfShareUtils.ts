import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface CompartilharPdfOpcoes {
  elemento: HTMLElement;
  nomeArquivo: string;
  titulo?: string;
  texto?: string;
}

export interface ResultadoCompartilhamento {
  sucesso: boolean;
  metodo: 'share_files' | 'share_text' | 'download';
  erro?: string;
}

/**
 * Normaliza um nome de arquivo para padrão seguro (sem acentos, espaços viram hífens)
 */
export function normalizarNomeArquivoPdf(
  tipo: string,
  identificador: string,
  dataStr?: string
): string {
  const dataHoje = dataStr || new Date().toISOString().split('T')[0];
  const dataFormatada = dataHoje.replace(/\//g, '-');

  const base = `${tipo}-${identificador}-${dataFormatada}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-') // substitui caracteres especiais por hífens
    .replace(/-+/g, '-') // remove hífens duplicados
    .replace(/^-|-$/g, ''); // remove hífens nas pontas

  return `${base}.pdf`;
}

/**
 * Converte um elemento HTML em um Blob PDF de alta fidelidade
 */
export async function gerarPdfBlobDeElemento(elemento: HTMLElement): Promise<Blob> {
  // Configuração para renderização perfeita do canvas
  const canvas = await html2canvas(elemento, {
    scale: 2, // 2x para garantir nitidez em telas retina e celulares
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: elemento.scrollWidth || 800,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Dimensões A4 em milímetros
  const pdfWidth = 210;
  const pdfHeight = 297;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calcula proporção de escala da imagem
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Primeira página
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Se o conteúdo ultrapassar 1 página A4, adiciona páginas subsequentes
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  return pdf.output('blob');
}

/**
 * Faz o download direto de um Blob como arquivo
 */
export function baixarBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Compartilha o documento PDF gerado na memória utilizando a Web Share API (navigator.share).
 * Se o navegador / celular suportar compartilhamento de arquivos (Android, iPhone / Safari, PWA),
 * abre o menu nativo diretamente com o arquivo PDF anexado.
 * Caso contrário, faz fallback inteligente (compartilhamento de texto ou download automático).
 */
export async function compartilharDocumentoPdf({
  elemento,
  nomeArquivo,
  titulo = 'Master Soccer RJ',
  texto = 'Documento Master Soccer RJ',
}: CompartilharPdfOpcoes): Promise<ResultadoCompartilhamento> {
  try {
    // 1. Gera o PDF em memória sem abrir janela de impressão
    const pdfBlob = await gerarPdfBlobDeElemento(elemento);

    // 2. Cria o arquivo File a partir do Blob
    const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });

    // 3. Testa se navigator.share com arquivos é suportado
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: titulo,
          text: texto,
          files: [file],
        });
        return { sucesso: true, metodo: 'share_files' };
      } catch (err: any) {
        // Se o usuário apenas cancelou a janela de compartilhamento, não é erro
        if (err?.name === 'AbortError') {
          return { sucesso: true, metodo: 'share_files' };
        }
        console.warn('Erro ao compartilhar arquivo via Web Share, tentando fallback:', err);
      }
    }

    // 4. Fallback: Se Web Share suporta apenas texto ou URL
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          text: `${texto} (${nomeArquivo})`,
        });
        baixarBlob(pdfBlob, nomeArquivo);
        return { sucesso: true, metodo: 'share_text' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { sucesso: true, metodo: 'share_text' };
        }
      }
    }

    // 5. Fallback final: Download automático do arquivo PDF
    baixarBlob(pdfBlob, nomeArquivo);
    return { sucesso: true, metodo: 'download' };
  } catch (error: any) {
    console.error('Erro na geração/compartilhamento do PDF:', error);
    return {
      sucesso: false,
      metodo: 'download',
      erro: error?.message || 'Falha ao gerar PDF.',
    };
  }
}
