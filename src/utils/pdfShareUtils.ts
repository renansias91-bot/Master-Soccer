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
  cancelado?: boolean;
  semSuporte?: boolean;
  precisaSegundoToque?: boolean;
  arquivoPronto?: File;
  erro?: string;
}

export const MENSAGEM_SEM_SUPORTE_SHARE =
  'Seu navegador não permite compartilhar arquivo. Use o Chrome para compartilhar.';

const colorCache = new Map<string, string>();
let colorCtx: CanvasRenderingContext2D | null = null;

function getColorContext(): CanvasRenderingContext2D | null {
  if (colorCtx) return colorCtx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  colorCtx = canvas.getContext('2d');
  return colorCtx;
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${base}.pdf`;
}

/**
 * Verifica se o navegador suporta compartilhamento nativo de arquivos PDF via Web Share API
 */
export function navegadorSuportaCompartilharArquivoPdf(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    const arquivoTeste = new File(['%PDF-1.4\n'], 'teste.pdf', {
      type: 'application/pdf',
    });
    return navigator.canShare({ files: [arquivoTeste] });
  } catch {
    return false;
  }
}

/**
 * Converte uma cor CSS moderna (oklch, oklab, lab, lch, color-mix) para rgba/transparent
 * usando canvas nativo do navegador.
 */
function converterCorUnicaParaRgba(corCss: string): string {
  const chave = corCss.trim();
  const emCache = colorCache.get(chave);
  if (emCache) return emCache;

  try {
    const ctx = getColorContext();
    if (!ctx) return '#1e293b';

    // Verifica se o navegador aceita a cor no canvas
    ctx.fillStyle = '#000001';
    ctx.fillStyle = chave;
    const aplicado = String(ctx.fillStyle || '');

    // Se o valor contiver transparent explícito
    if (chave.toLowerCase() === 'transparent') {
      colorCache.set(chave, 'transparent');
      return 'transparent';
    }

    // Se o canvas rejeitou color-mix com variáveis CSS não resolvidas (ex: var(--tw-...))
    if (aplicado === '#000001' && !chave.includes('0, 0, 1') && !chave.includes('#000001')) {
      const fallback = chave.includes('transparent') ? 'rgba(15, 23, 42, 0.12)' : '#1e293b';
      colorCache.set(chave, fallback);
      return fallback;
    }

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    const resultado =
      data[3] === 0
        ? 'transparent'
        : `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(3)})`;
    colorCache.set(chave, resultado);
    return resultado;
  } catch {
    return '#1e293b';
  }
}

/**
 * Substitui todas as chamadas oklch(...), oklab(...), lab(...), lch(...) e color-mix(...)
 * dentro de qualquer string CSS (suporta parênteses aninhados).
 */
function sanitizarFuncoesCorCss(cssText: string): string {
  if (!cssText) return cssText;
  const regexInicio = /(oklch|oklab|color-mix|lab|lch)\(/gi;
  if (!regexInicio.test(cssText)) return cssText;

  let resultado = '';
  let i = 0;

  while (i < cssText.length) {
    regexInicio.lastIndex = i;
    const match = regexInicio.exec(cssText);
    if (!match) {
      resultado += cssText.slice(i);
      break;
    }

    const startIdx = match.index;
    resultado += cssText.slice(i, startIdx);

    let depth = 0;
    let endIdx = startIdx + match[0].length - 1;
    for (let j = endIdx; j < cssText.length; j++) {
      const ch = cssText[j];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          endIdx = j;
          break;
        }
      }
    }

    const tokenCompleto = cssText.slice(startIdx, endIdx + 1);
    if (tokenCompleto.includes('var(')) {
      // Variáveis não resolvidas em folhas brutas não podem ser rasterizadas em canvas
      resultado += 'rgba(15, 23, 42, 0.15)';
    } else {
      resultado += converterCorUnicaParaRgba(tokenCompleto);
    }
    i = endIdx + 1;
  }

  return resultado;
}

function temCorNaoSuportada(valor: string | null | undefined): boolean {
  if (!valor) return false;
  return /oklch\(|oklab\(|color-mix\(|lab\(|lch\(/i.test(valor);
}

/**
 * Serializa CSS de uma stylesheet mesma-origem para remover oklch/oklab/color-mix
 * antes que o html2canvas tente parsear a folha de estilo.
 */
function extrairCssSeguroDeStylesheet(sheet: CSSStyleSheet): string | null {
  try {
    const rules = sheet.cssRules;
    if (!rules) return null;
    const partes: string[] = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const text = rule.cssText;
      if (!text) continue;
      // Remove regras @property que o html2canvas não entende
      if (text.startsWith('@property')) continue;
      partes.push(sanitizarFuncoesCorCss(text));
    }
    return partes.join('\n');
  } catch {
    return null;
  }
}

/**
 * Converte um elemento HTML em um Blob PDF real na memória.
 */
export async function gerarPdfBlobDeElemento(elemento: HTMLElement): Promise<Blob> {
  const tempId = elemento.id || `pdf-target-${Date.now()}`;
  const hadId = Boolean(elemento.id);
  if (!hadId) {
    elemento.id = tempId;
  }

  try {
    // Pré-extrai CSS seguro de todas as folhas mesmas-origem do documento real
    const cssSheetsSeguros = new Map<string, string>();
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      if (sheet.href) {
        const cssSeguro = extrairCssSeguroDeStylesheet(sheet);
        if (cssSeguro !== null) {
          cssSheetsSeguros.set(sheet.href, cssSeguro);
        }
      }
    }

    const alturaEstimada = elemento.scrollHeight || elemento.offsetHeight || 1000;
    const scale = alturaEstimada > 3200 ? 1.25 : 1.5;

    // Captura cores computadas reais (já com var() e color-mix() resolvidos pelo Chrome)
    // antes de o html2canvas clonar e sanitizar as folhas de estilo.
    const realNodes = [elemento, ...Array.from(elemento.querySelectorAll<HTMLElement>('*'))];
    const resolvedInlineColors: Array<{
      color?: string;
      backgroundColor?: string;
      borderTopColor?: string;
      borderRightColor?: string;
      borderBottomColor?: string;
      borderLeftColor?: string;
      outlineColor?: string;
      textDecorationColor?: string;
      backgroundImage?: string;
      fill?: string;
      stroke?: string;
    } | null> = realNodes.map((node) => {
      try {
        const cs = window.getComputedStyle(node);
        const entry: Record<string, string> = {};
        if (temCorNaoSuportada(cs.color)) entry.color = converterCorUnicaParaRgba(cs.color);
        if (temCorNaoSuportada(cs.backgroundColor)) {
          entry.backgroundColor = converterCorUnicaParaRgba(cs.backgroundColor);
        }
        if (temCorNaoSuportada(cs.borderTopColor)) {
          entry.borderTopColor = converterCorUnicaParaRgba(cs.borderTopColor);
        }
        if (temCorNaoSuportada(cs.borderRightColor)) {
          entry.borderRightColor = converterCorUnicaParaRgba(cs.borderRightColor);
        }
        if (temCorNaoSuportada(cs.borderBottomColor)) {
          entry.borderBottomColor = converterCorUnicaParaRgba(cs.borderBottomColor);
        }
        if (temCorNaoSuportada(cs.borderLeftColor)) {
          entry.borderLeftColor = converterCorUnicaParaRgba(cs.borderLeftColor);
        }
        if (temCorNaoSuportada(cs.outlineColor)) {
          entry.outlineColor = converterCorUnicaParaRgba(cs.outlineColor);
        }
        if (temCorNaoSuportada(cs.textDecorationColor)) {
          entry.textDecorationColor = converterCorUnicaParaRgba(cs.textDecorationColor);
        }
        if (temCorNaoSuportada(cs.backgroundImage)) {
          entry.backgroundImage = sanitizarFuncoesCorCss(cs.backgroundImage);
        }
        if (temCorNaoSuportada(cs.fill)) entry.fill = converterCorUnicaParaRgba(cs.fill);
        if (temCorNaoSuportada(cs.stroke)) entry.stroke = converterCorUnicaParaRgba(cs.stroke);
        return Object.keys(entry).length > 0 ? entry : null;
      } catch {
        return null;
      }
    });

    const canvas = await html2canvas(elemento, {
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 2500,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(elemento.scrollWidth || 800, 800),
      onclone: (clonedDoc) => {
        // 1. Sanitiza todas as tags <style> do documento clonado
        const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
        for (const tag of styleTags) {
          if (tag.textContent && temCorNaoSuportada(tag.textContent)) {
            tag.textContent = sanitizarFuncoesCorCss(tag.textContent);
          }
        }

        // 2. Substitui <link rel="stylesheet"> do Tailwind v4 por <style> sanitizado
        const linkTags = Array.from(
          clonedDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
        );
        for (const link of linkTags) {
          const href = link.href || link.getAttribute('href') || '';
          const cssSeguro = cssSheetsSeguros.get(href);
          if (cssSeguro !== undefined) {
            const styleSubstituto = clonedDoc.createElement('style');
            styleSubstituto.textContent = cssSeguro;
            link.parentNode?.insertBefore(styleSubstituto, link);
            link.remove();
          } else if (href && !href.includes('fonts.googleapis.com')) {
            link.remove();
          }
        }

        // 3. Injeta resets seguros para renderização A4 limpa e rápida
        const resetStyle = clonedDoc.createElement('style');
        resetStyle.textContent = `
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            max-width: none !important;
          }
          .no-print {
            display: none !important;
          }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            animation: none !important;
            transition: none !important;
          }
        `;
        clonedDoc.head.appendChild(resetStyle);

        const clonedEl = clonedDoc.getElementById(tempId);
        if (!clonedEl) return;

        // 4. Oculta elementos irmãos fora da cadeia ancestral do documento (acelera muito no Android)
        const cadeiaAncestrais = new Set<HTMLElement>();
        let cursor: HTMLElement | null = clonedEl;
        while (cursor) {
          cadeiaAncestrais.add(cursor);
          cursor.style.overflow = 'visible';
          cursor.style.maxHeight = 'none';
          cursor.style.height = 'auto';
          cursor.style.maxWidth = 'none';
          if (cursor !== clonedDoc.body && cursor !== clonedDoc.documentElement) {
            cursor.style.transform = 'none';
          }
          cursor = cursor.parentElement;
        }

        const ocultarIrmaosForaDaCadeia = (pai: HTMLElement | null) => {
          if (!pai) return;
          for (const filho of Array.from(pai.children)) {
            if (!(filho instanceof HTMLElement)) continue;
            if (!cadeiaAncestrais.has(filho)) {
              filho.style.display = 'none';
            } else if (filho !== clonedEl) {
              ocultarIrmaosForaDaCadeia(filho);
            }
          }
        };
        ocultarIrmaosForaDaCadeia(clonedDoc.body);

        // 5. Aplica as cores computadas exatas em todos os nós clonados
        const clonedNodes = [clonedEl, ...Array.from(clonedEl.querySelectorAll<HTMLElement>('*'))];
        for (let i = 0; i < clonedNodes.length; i++) {
          const node = clonedNodes[i];
          const overrides = resolvedInlineColors[i];
          if (!node?.style || !overrides) continue;
          try {
            if (overrides.color) node.style.color = overrides.color;
            if (overrides.backgroundColor) node.style.backgroundColor = overrides.backgroundColor;
            if (overrides.borderTopColor) node.style.borderTopColor = overrides.borderTopColor;
            if (overrides.borderRightColor) node.style.borderRightColor = overrides.borderRightColor;
            if (overrides.borderBottomColor) {
              node.style.borderBottomColor = overrides.borderBottomColor;
            }
            if (overrides.borderLeftColor) node.style.borderLeftColor = overrides.borderLeftColor;
            if (overrides.outlineColor) node.style.outlineColor = overrides.outlineColor;
            if (overrides.textDecorationColor) {
              node.style.textDecorationColor = overrides.textDecorationColor;
            }
            if (overrides.backgroundImage) node.style.backgroundImage = overrides.backgroundImage;
            if (overrides.fill) node.style.fill = overrides.fill;
            if (overrides.stroke) node.style.stroke = overrides.stroke;
          } catch {
            // Ignora nós especiais que não aceitam style inline
          }
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.88);

    const pdfWidth = 210;
    const pdfHeight = 297;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 2) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  } finally {
    if (!hadId) {
      elemento.removeAttribute('id');
    }
  }
}

/**
 * Dispara o menu nativo de compartilhamento do sistema (Android / iOS)
 * para um arquivo PDF já gerado em memória.
 */
export async function compartilharArquivoPdfPronto(
  arquivoPDF: File,
  titulo = 'Master Soccer RJ',
  texto = 'Documento Master Soccer RJ'
): Promise<ResultadoCompartilhamento> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function' ||
    typeof navigator.canShare !== 'function'
  ) {
    return {
      sucesso: false,
      semSuporte: true,
      erro: MENSAGEM_SEM_SUPORTE_SHARE,
    };
  }

  let podeCompartilharArquivo = false;
  try {
    podeCompartilharArquivo = navigator.canShare({ files: [arquivoPDF] });
  } catch {
    podeCompartilharArquivo = false;
  }

  if (!podeCompartilharArquivo) {
    return {
      sucesso: false,
      semSuporte: true,
      erro: MENSAGEM_SEM_SUPORTE_SHARE,
    };
  }

  try {
    await navigator.share({
      files: [arquivoPDF],
      title: titulo,
      text: texto,
    });
    return { sucesso: true };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { sucesso: true, cancelado: true };
    }
    if (err?.name === 'NotAllowedError') {
      return {
        sucesso: false,
        precisaSegundoToque: true,
        arquivoPronto: arquivoPDF,
        erro: 'PDF gerado! Toque novamente no botão para abrir a aba de compartilhamento.',
      };
    }
    return {
      sucesso: false,
      erro: err?.message || 'Não foi possível abrir o compartilhamento do sistema.',
    };
  }
}

/**
 * Gera o PDF em memória a partir do elemento HTML e abre a aba nativa de compartilhamento
 * com o arquivo PDF real anexado (sem download e sem fallback de link/texto).
 */
export async function compartilharDocumentoPdf({
  elemento,
  nomeArquivo,
  titulo = 'Master Soccer RJ',
  texto = 'Documento Master Soccer RJ',
}: CompartilharPdfOpcoes): Promise<ResultadoCompartilhamento> {
  if (!navegadorSuportaCompartilharArquivoPdf()) {
    return {
      sucesso: false,
      semSuporte: true,
      erro: MENSAGEM_SEM_SUPORTE_SHARE,
    };
  }

  try {
    const pdfBlob = await gerarPdfBlobDeElemento(elemento);
    const arquivoPDF = new File([pdfBlob], nomeArquivo, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    return await compartilharArquivoPdfPronto(arquivoPDF, titulo, texto);
  } catch (error: any) {
    console.error('Erro ao gerar/compartilhar PDF:', error);
    return {
      sucesso: false,
      erro: error?.message || 'Falha ao gerar o PDF para compartilhamento.',
    };
  }
}
