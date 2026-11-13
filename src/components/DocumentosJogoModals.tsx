import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, FileText, Printer, RefreshCw, Share2, Shield, Users, X } from 'lucide-react';
import { Atleta, AtletaEscalado, JogoAgenda } from '../types';
import { formatarDataExibicao } from '../utils/dateUtils';
import { obterIniciaisApelido } from '../utils/apelidoUtils';
import {
  detectarFormacaoDaEscalacao,
  FORMACOES_CAMPINHO,
  mapearTitularesNosSlots,
  normalizarSlotId,
} from '../utils/formacoesUtils';
import {
  compartilharArquivoPdfPronto,
  compartilharDocumentoPdf,
  MENSAGEM_SEM_SUPORTE_SHARE,
  navegadorSuportaCompartilharArquivoPdf,
} from '../utils/pdfShareUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';

// ============================================================================
// DOCUMENTO 1: SÚMULA OFICIAL PARA ARBITRAGEM (25 LINHAS, SOMENTE LEITURA)
// ============================================================================

interface ModalSumulaArbitragemProps {
  isOpen: boolean;
  onClose: () => void;
  jogo: JogoAgenda | null;
  atletas: Atleta[];
  escalacaoMap: Record<string, AtletaEscalado>;
}

export const ModalSumulaArbitragem: React.FC<ModalSumulaArbitragemProps> = ({
  isOpen,
  onClose,
  jogo,
  atletas,
  escalacaoMap,
}) => {
  const [compartilhando, setCompartilhando] = useState(false);
  const [erroShare, setErroShare] = useState<string | null>(null);
  const [arquivoPronto, setArquivoPronto] = useState<{
    file: File;
    titulo: string;
    texto: string;
  } | null>(null);
  const docRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setErroShare(null);
    setArquivoPronto(null);
  }, [isOpen, jogo?.id, escalacaoMap]);

  // Lê todos os atletas selecionados para o jogo (titulares e reservas juntos),
  // sem distinguir quem é titular ou reserva, em ordem alfabética por Nome Completo.
  const atletasSelecionados = useMemo(() => {
    const idsSelecionados = Object.keys(escalacaoMap || {});
    const lista = idsSelecionados
      .map((id) => atletas.find((a) => a.id === id))
      .filter((a): a is Atleta => Boolean(a));

    lista.sort((a, b) => {
      const nomeA = (a.nomeCompleto || a.nome || '').trim();
      const nomeB = (b.nomeCompleto || b.nome || '').trim();
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

    return lista;
  }, [atletas, escalacaoMap]);

  if (!isOpen || !jogo) return null;

  const adversarioLimpo = (jogo.adversario || '').replace(/^vs\s+/i, '').trim() || 'Adversário';
  const totalLinhas = Math.max(25, atletasSelecionados.length);
  const linhas = Array.from({ length: totalLinhas }, (_, idx) => atletasSelecionados[idx] || null);

  const handleCompartilhar = async () => {
    setErroShare(null);

    if (arquivoPronto) {
      const resPronto = await compartilharArquivoPdfPronto(
        arquivoPronto.file,
        arquivoPronto.titulo,
        arquivoPronto.texto
      );
      if (resPronto.sucesso) {
        setArquivoPronto(null);
        return;
      }
      setErroShare(resPronto.erro || MENSAGEM_SEM_SUPORTE_SHARE);
      return;
    }

    if (!navegadorSuportaCompartilharArquivoPdf()) {
      setErroShare(MENSAGEM_SEM_SUPORTE_SHARE);
      return;
    }

    if (!docRef.current) return;
    setCompartilhando(true);
    try {
      const advSlug =
        adversarioLimpo
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, '') || 'Adversario';
      const dataStr = formatarDataExibicao(jogo.dataJogo || '').replace(/\//g, '-') || 'data';
      const nomeArquivo = `Sumula-Master-vs-${advSlug}-${dataStr}.pdf`;
      const titulo = `Súmula Oficial: Master Soccer vs ${adversarioLimpo}`;
      const texto = `Súmula Oficial para Arbitragem - Master Soccer vs ${adversarioLimpo} (${jogo.categoria})`;

      const res = await compartilharDocumentoPdf({
        elemento: docRef.current,
        nomeArquivo,
        titulo,
        texto,
      });

      if (!res.sucesso) {
        if (res.precisaSegundoToque && res.arquivoPronto) {
          setArquivoPronto({ file: res.arquivoPronto, titulo, texto });
        }
        setErroShare(res.erro || MENSAGEM_SEM_SUPORTE_SHARE);
      }
    } catch (err) {
      console.error('Erro ao compartilhar súmula:', err);
      setErroShare('Não foi possível gerar o PDF da súmula.');
    } finally {
      setCompartilhando(false);
    }
  };

  const modalContent = (
    <div className="print-modal-root fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="print-modal-card relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Barra Superior do Visualizador (oculta na impressão) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Súmula Oficial de Jogo — Arbitragem
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {totalLinhas} linhas ({atletasSelecionados.length} atletas preenchidos · Nº Camisa e T/R em branco para marcar à caneta)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Documento Imprimível */}
        <div className="print-modal-scroll overflow-y-auto flex-1 bg-white">
          <div
            ref={docRef}
            id="sumula-arbitragem-doc"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            className="p-5 sm:p-7 space-y-4 bg-white text-slate-900"
          >
            {/* Cabeçalho Oficial */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <MasterSoccerEscudo size={46} />
                <div>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight" style={{ color: '#020617' }}>
                    MASTER SOCCER RJ
                  </h2>
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#475569' }}>
                    Súmula Oficial de Jogo · Relação de Atletas para Arbitragem
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px]" style={{ color: '#475569' }}>
                <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
                <div className="font-extrabold uppercase" style={{ color: '#0f172a' }}>
                  {totalLinhas} Atletas na Súmula
                </div>
              </div>
            </div>

            {/* Dados da Partida */}
            <div
              className="rounded-xl p-3.5 text-xs"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Partida:
                  </span>
                  <span className="font-black text-sm" style={{ color: '#0f172a' }}>
                    Master Soccer vs {adversarioLimpo}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Campeonato:
                  </span>
                  <span className="font-black text-xs sm:text-sm" style={{ color: '#0f172a' }}>
                    {jogo.tipo || 'Campeonato'}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Categoria:
                  </span>
                  <span className="font-black text-sm" style={{ color: '#1d4ed8' }}>
                    {jogo.categoria}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Data:
                  </span>
                  <span className="font-black text-xs sm:text-sm" style={{ color: '#0f172a' }}>
                    {formatarDataExibicao(jogo.dataJogo)}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Horário:
                  </span>
                  <span className="font-black text-xs sm:text-sm" style={{ color: '#0f172a' }}>
                    {jogo.hora || '___:___'}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Local:
                  </span>
                  <span className="font-black text-xs sm:text-sm" style={{ color: '#0f172a' }}>
                    {jogo.local || '______________________'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de 25 Linhas (ou mais se > 25 atletas) */}
            <div>
              <table
                className="w-full text-left border-collapse text-xs"
                style={{ border: '1.5px solid #334155' }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', color: '#0f172a' }}>
                    <th
                      className="py-2 px-2 text-center font-black uppercase text-[10px] w-9"
                      style={{ border: '1px solid #64748b' }}
                    >
                      #
                    </th>
                    <th
                      className="py-2 px-2 text-center font-black uppercase text-[10px] w-20"
                      style={{ border: '1px solid #64748b' }}
                    >
                      Nº Camisa
                    </th>
                    <th
                      className="py-2 px-2.5 font-black uppercase text-[10px]"
                      style={{ border: '1px solid #64748b' }}
                    >
                      Nome Completo
                    </th>
                    <th
                      className="py-2 px-2.5 font-black uppercase text-[10px] w-36 sm:w-44"
                      style={{ border: '1px solid #64748b' }}
                    >
                      Identidade / RG / CPF
                    </th>
                    <th
                      className="py-2 px-2 text-center font-black uppercase text-[10px] w-20"
                      style={{ border: '1px solid #64748b' }}
                    >
                      T / R
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((atl, idx) => {
                    const nomeCompleto = atl ? (atl.nomeCompleto || atl.nome || '').trim() : '';
                    const docIdentidade = atl ? (atl.documento || atl.rg || '').trim() : '';

                    return (
                      <tr
                        key={atl ? atl.id : `linha-vazia-${idx}`}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          height: '28px',
                        }}
                      >
                        {/* Ordem numérica fixa 01..25 */}
                        <td
                          className="py-1 px-1.5 text-center font-mono font-bold text-[11px]"
                          style={{ border: '1px solid #94a3b8', color: '#475569' }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </td>

                        {/* Casinha em branco Nº Camisa (preencher à caneta) */}
                        <td
                          className="py-1 px-1.5 text-center"
                          style={{ border: '1px solid #94a3b8' }}
                        >
                          <div
                            style={{
                              border: '1px solid #64748b',
                              backgroundColor: '#ffffff',
                              height: '20px',
                              width: '48px',
                              margin: '0 auto',
                              borderRadius: '3px',
                            }}
                          />
                        </td>

                        {/* Nome Completo (ou em branco para preencher à caneta) */}
                        <td
                          className="py-1 px-2.5 font-bold text-xs uppercase"
                          style={{ border: '1px solid #94a3b8', color: '#0f172a' }}
                        >
                          {nomeCompleto}
                        </td>

                        {/* Identidade / RG / CPF (ou em branco para preencher à caneta) */}
                        <td
                          className="py-1 px-2.5 font-mono text-[11px] font-semibold"
                          style={{ border: '1px solid #94a3b8', color: '#1e293b' }}
                        >
                          {docIdentidade}
                        </td>

                        {/* Casinha em branco T / R (PROIBIDO pré-marcar; somente à caneta) */}
                        <td
                          className="py-1 px-1.5 text-center"
                          style={{ border: '1px solid #94a3b8' }}
                        >
                          <div
                            style={{
                              border: '1px solid #64748b',
                              backgroundColor: '#ffffff',
                              height: '20px',
                              width: '52px',
                              margin: '0 auto',
                              borderRadius: '3px',
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Assinaturas Capitão, Técnico e Espaço para Arbitragem */}
            <div className="print-break-inside-avoid pt-4 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 text-center text-xs">
                <div>
                  <div
                    className="pb-1 mb-1 h-8"
                    style={{ borderBottom: '1.5px solid #0f172a' }}
                  />
                  <div className="font-black uppercase text-[11px]" style={{ color: '#0f172a' }}>
                    Assinatura do Capitão
                  </div>
                  <div className="text-[10px]" style={{ color: '#64748b' }}>
                    Master Soccer RJ · {jogo.categoria}
                  </div>
                </div>
                <div>
                  <div
                    className="pb-1 mb-1 h-8"
                    style={{ borderBottom: '1.5px solid #0f172a' }}
                  />
                  <div className="font-black uppercase text-[11px]" style={{ color: '#0f172a' }}>
                    Assinatura do Técnico / Comissão Técnica
                  </div>
                  <div className="text-[10px]" style={{ color: '#64748b' }}>
                    Master Soccer RJ
                  </div>
                </div>
              </div>

              {/* Espaço Reservado para Arbitragem */}
              <div
                className="rounded-xl p-3.5 space-y-4"
                style={{ border: '1.5px solid #334155', backgroundColor: '#f8fafc' }}
              >
                <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: '#0f172a' }}>
                    Espaço Reservado para Arbitragem
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: '#64748b' }}>
                    Placar Final: Master Soccer _____ x _____ {adversarioLimpo}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 text-xs">
                  <div>
                    <div className="h-7" style={{ borderBottom: '1px solid #475569' }} />
                    <div className="text-[10px] font-bold uppercase mt-1" style={{ color: '#334155' }}>
                      Nome / Assinatura do Árbitro Principal
                    </div>
                  </div>
                  <div>
                    <div className="h-7" style={{ borderBottom: '1px solid #475569' }} />
                    <div className="text-[10px] font-bold uppercase mt-1" style={{ color: '#334155' }}>
                      Auxiliares / Representante / Federação
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] font-bold uppercase mb-1" style={{ color: '#475569' }}>
                    Observações da Arbitragem:
                  </div>
                  <div className="h-5" style={{ borderBottom: '1px dashed #94a3b8' }} />
                  <div className="h-5" style={{ borderBottom: '1px dashed #94a3b8' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de Compartilhamento (quando navegador não suporta ou precisa de 2º toque) */}
        {erroShare && (
          <div className="no-print px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{erroShare}</span>
            </div>
            <button
              type="button"
              onClick={() => setErroShare(null)}
              className="p-1 text-amber-700 hover:text-amber-950 dark:text-amber-300 cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Rodapé com 3 Botões: [Fechar] [Compartilhar] [Imprimir Agora] */}
        <div className="no-print p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/60 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={compartilhando}
            onClick={handleCompartilhar}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white hover:opacity-95 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            style={{ backgroundColor: '#059669', color: '#ffffff' }}
          >
            {compartilhando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Gerando PDF...</span>
              </>
            ) : arquivoPronto ? (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Abrir Compartilhar PDF</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white hover:opacity-95 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer transition"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Agora</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ============================================================================
// DOCUMENTO 2: ESTRATÉGIA DE JOGO (SOMENTE PARA O TREINADOR, SOMENTE LEITURA)
// ============================================================================

interface ModalEstrategiaJogoProps {
  isOpen: boolean;
  onClose: () => void;
  jogo: JogoAgenda | null;
  atletas: Atleta[];
  escalacaoMap: Record<string, AtletaEscalado>;
  formacao?: string;
}

export const ModalEstrategiaJogo: React.FC<ModalEstrategiaJogoProps> = ({
  isOpen,
  onClose,
  jogo,
  atletas,
  escalacaoMap,
  formacao,
}) => {
  const [compartilhando, setCompartilhando] = useState(false);
  const [erroShare, setErroShare] = useState<string | null>(null);
  const [arquivoPronto, setArquivoPronto] = useState<{
    file: File;
    titulo: string;
    texto: string;
  } | null>(null);
  const docRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setErroShare(null);
    setArquivoPronto(null);
  }, [isOpen, jogo?.id, escalacaoMap, formacao]);

  const formacaoEfetiva = useMemo(
    () => detectarFormacaoDaEscalacao(escalacaoMap, formacao || jogo?.formacao),
    [escalacaoMap, formacao, jogo?.formacao]
  );

  const { slotsAtribuidos, titularesExtras, reservasLista } = useMemo(() => {
    const slots = FORMACOES_CAMPINHO[formacaoEfetiva] || FORMACOES_CAMPINHO['4-4-2 Losango'];
    const titularesList = atletas.filter((a) => escalacaoMap?.[a.id]?.titular);
    const atribuidos = mapearTitularesNosSlots(titularesList, slots, escalacaoMap || {});

    const idsNosSlots = new Set(atribuidos.filter((x) => x.atleta).map((x) => x.atleta!.id));
    const extras = titularesList.filter((a) => !idsNosSlots.has(a.id));

    const reservas = atletas
      .filter((a) => escalacaoMap?.[a.id] && escalacaoMap[a.id].titular === false)
      .sort((a, b) => {
        const nA = (a.apelido || a.nome || '').trim();
        const nB = (b.apelido || b.nome || '').trim();
        return nA.localeCompare(nB, 'pt-BR');
      });

    return {
      slotsAtribuidos: atribuidos,
      titularesExtras: extras,
      reservasLista: reservas,
    };
  }, [atletas, escalacaoMap, formacaoEfetiva]);

  if (!isOpen || !jogo) return null;

  const adversarioLimpo = (jogo.adversario || '').replace(/^vs\s+/i, '').trim() || 'Adversário';
  const totalTitulares = slotsAtribuidos.filter((s) => s.atleta).length + titularesExtras.length;

  const handleCompartilhar = async () => {
    setErroShare(null);

    if (arquivoPronto) {
      const resPronto = await compartilharArquivoPdfPronto(
        arquivoPronto.file,
        arquivoPronto.titulo,
        arquivoPronto.texto
      );
      if (resPronto.sucesso) {
        setArquivoPronto(null);
        return;
      }
      setErroShare(resPronto.erro || MENSAGEM_SEM_SUPORTE_SHARE);
      return;
    }

    if (!navegadorSuportaCompartilharArquivoPdf()) {
      setErroShare(MENSAGEM_SEM_SUPORTE_SHARE);
      return;
    }

    if (!docRef.current) return;
    setCompartilhando(true);
    try {
      const advSlug =
        adversarioLimpo
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, '') || 'Adversario';
      const dataStr = formatarDataExibicao(jogo.dataJogo || '').replace(/\//g, '-') || 'data';
      const nomeArquivo = `Estrategia-Master-vs-${advSlug}-${dataStr}.pdf`;
      const titulo = `Estratégia de Jogo: Master Soccer vs ${adversarioLimpo}`;
      const texto = `Estratégia Tática (${formacaoEfetiva}) - Master Soccer vs ${adversarioLimpo} (${jogo.categoria})`;

      const res = await compartilharDocumentoPdf({
        elemento: docRef.current,
        nomeArquivo,
        titulo,
        texto,
      });

      if (!res.sucesso) {
        if (res.precisaSegundoToque && res.arquivoPronto) {
          setArquivoPronto({ file: res.arquivoPronto, titulo, texto });
        }
        setErroShare(res.erro || MENSAGEM_SEM_SUPORTE_SHARE);
      }
    } catch (err) {
      console.error('Erro ao compartilhar estratégia:', err);
      setErroShare('Não foi possível gerar o PDF da estratégia.');
    } finally {
      setCompartilhando(false);
    }
  };

  const modalContent = (
    <div className="print-modal-root fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="print-modal-card relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Barra Superior do Visualizador (oculta na impressão) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Estratégia de Jogo — Comissão Técnica
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Documento exclusivo do treinador · Leitura fiel da escalação ({formacaoEfetiva})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Documento Imprimível */}
        <div className="print-modal-scroll overflow-y-auto flex-1 bg-white">
          <div
            ref={docRef}
            id="estrategia-jogo-doc"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            className="p-5 sm:p-7 space-y-5 bg-white text-slate-900"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <MasterSoccerEscudo size={46} />
                <div>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight" style={{ color: '#020617' }}>
                    MASTER SOCCER RJ · ESTRATÉGIA DE JOGO
                  </h2>
                  <p className="text-[11px] font-bold uppercase" style={{ color: '#047857' }}>
                    Uso Exclusivo da Comissão Técnica · Plano Tático da Partida
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px]" style={{ color: '#475569' }}>
                <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
                <div
                  className="inline-block mt-1 px-2.5 py-0.5 rounded-md font-black uppercase text-xs"
                  style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}
                >
                  {formacaoEfetiva}
                </div>
              </div>
            </div>

            {/* Informações do Jogo + Formação em Destaque */}
            <div
              className="rounded-xl p-3.5 text-xs"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Confronto:
                  </span>
                  <span className="font-black text-sm" style={{ color: '#0f172a' }}>
                    Master Soccer vs {adversarioLimpo}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Categoria & Competição:
                  </span>
                  <span className="font-black text-xs sm:text-sm" style={{ color: '#1d4ed8' }}>
                    {jogo.categoria} · {jogo.tipo || 'Campeonato'}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase block text-[10px]" style={{ color: '#64748b' }}>
                    Data / Horário / Local:
                  </span>
                  <span className="font-bold text-xs" style={{ color: '#0f172a' }}>
                    {formatarDataExibicao(jogo.dataJogo)}
                    {jogo.hora ? ` às ${jogo.hora}` : ''}
                    {jogo.local ? ` · ${jogo.local}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* a) Nome da Formação */}
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2"
              style={{ backgroundColor: '#eff6ff', border: '1.5px solid #2563eb' }}
            >
              <div>
                <span className="text-[10px] font-black uppercase block" style={{ color: '#1e40af' }}>
                  Formação Tática Selecionada
                </span>
                <span className="text-lg font-black uppercase tracking-tight" style={{ color: '#0f172a' }}>
                  {formacaoEfetiva}
                </span>
              </div>
              <div className="text-xs font-extrabold" style={{ color: '#1e3a8a' }}>
                {totalTitulares} Titulares · {reservasLista.length} Reservas
              </div>
            </div>

            {/* Layout 2 colunas no desktop/impressão: Listas (Titulares + Reservas) à esquerda e Campinho à direita */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Coluna Esquerda: b) Lista TITULARES e c) Lista RESERVAS */}
              <div className="lg:col-span-5 space-y-4">
                {/* b) Lista TITULARES com posição + apelido */}
                <div
                  className="rounded-xl p-3.5 space-y-2"
                  style={{ backgroundColor: '#ffffff', border: '1.5px solid #16a34a' }}
                >
                  <div
                    className="flex items-center justify-between pb-1.5"
                    style={{ borderBottom: '2px solid #16a34a' }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wide" style={{ color: '#14532d' }}>
                      Titulares em Campo ({totalTitulares})
                    </h4>
                    <span className="text-[10px] font-bold uppercase" style={{ color: '#15803d' }}>
                      Posição — Apelido
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {slotsAtribuidos.map(({ slot, atleta }) => {
                      const posSigla = normalizarSlotId(slot.id) || slot.label;
                      const nomeExibicao = atleta
                        ? atleta.apelido?.trim() || atleta.nome.split(' ')[0] || atleta.nome
                        : 'Vago';

                      return (
                        <div
                          key={slot.id}
                          className="py-1.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="inline-block px-2 py-0.5 rounded font-black text-[10px] w-16 text-center shrink-0"
                              style={{
                                backgroundColor: atleta ? '#2563eb' : '#e2e8f0',
                                color: atleta ? '#ffffff' : '#475569',
                              }}
                            >
                              {posSigla}
                            </span>
                            <span
                              className={`font-black truncate ${atleta ? '' : 'italic font-medium'}`}
                              style={{ color: atleta ? '#0f172a' : '#94a3b8' }}
                            >
                              {nomeExibicao}
                            </span>
                          </div>
                          {atleta?.apelido && (
                            <span className="text-[10px] truncate max-w-[110px]" style={{ color: '#64748b' }}>
                              {atleta.nome.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {titularesExtras.map((atl) => {
                      const esc = escalacaoMap[atl.id];
                      return (
                        <div
                          key={atl.id}
                          className="py-1.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="inline-block px-2 py-0.5 rounded font-black text-[10px] w-16 text-center shrink-0"
                              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            >
                              {esc?.posicaoSlot || 'TIT'}
                            </span>
                            <span className="font-black truncate" style={{ color: '#0f172a' }}>
                              {atl.apelido?.trim() || atl.nome}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* c) Lista RESERVAS com apelido */}
                <div
                  className="rounded-xl p-3.5 space-y-2"
                  style={{ backgroundColor: '#fffbeb', border: '1.5px solid #f59e0b' }}
                >
                  <div
                    className="flex items-center justify-between pb-1.5"
                    style={{ borderBottom: '2px solid #f59e0b' }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5" style={{ color: '#92400e' }}>
                      <Users className="w-3.5 h-3.5" />
                      <span>Banco de Reservas ({reservasLista.length})</span>
                    </h4>
                  </div>

                  {reservasLista.length === 0 ? (
                    <p className="text-xs italic py-2 text-center" style={{ color: '#78716c' }}>
                      Nenhum reserva relacionado.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {reservasLista.map((atl, idx) => (
                        <li
                          key={atl.id}
                          className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg"
                          style={{ backgroundColor: '#ffffff', border: '1px solid #fde68a' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-[10px]" style={{ color: '#b45309' }}>
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span className="font-black truncate" style={{ color: '#0f172a' }}>
                              {atl.apelido?.trim() || atl.nome}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold shrink-0" style={{ color: '#64748b' }}>
                            {atl.posicao}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Coluna Direita: d) Desenho do CAMPINHO exatamente igual à Escalação */}
              <div className="lg:col-span-7 print-break-inside-avoid">
                <div
                  className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg select-none"
                  style={{
                    height: '560px',
                    backgroundColor: '#065f46',
                    border: '4px solid #022c22',
                    color: '#ffffff',
                  }}
                >
                  {/* Gramado listrado */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col" style={{ opacity: 0.16 }}>
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: i % 2 === 0 ? '#000000' : '#ffffff' }}
                      />
                    ))}
                  </div>

                  {/* Linhas de Marcação do Campo (SVG fiel ao Campinho da Escalação) */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="rgba(255,255,255,0.55)"
                  >
                    <rect x="3%" y="2%" width="94%" height="96%" strokeWidth="2.5" rx="8" />
                    <line x1="3%" y1="50%" x2="97%" y2="50%" strokeWidth="2.5" />
                    <circle cx="50%" cy="50%" r="44" strokeWidth="2.5" />
                    <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.75)" />

                    {/* Grande Área Superior (Adversário) */}
                    <rect x="22%" y="2%" width="56%" height="16%" strokeWidth="2.5" />
                    <rect x="35%" y="2%" width="30%" height="6%" strokeWidth="2" />
                    <circle cx="50%" cy="13%" r="2.5" fill="rgba(255,255,255,0.75)" />
                    <rect x="42%" y="0.5%" width="16%" height="1.5%" strokeWidth="2" fill="rgba(255,255,255,0.25)" />

                    {/* Grande Área Inferior (Nosso Goleiro) */}
                    <rect x="22%" y="82%" width="56%" height="16%" strokeWidth="2.5" />
                    <rect x="35%" y="92%" width="30%" height="6%" strokeWidth="2" />
                    <circle cx="50%" cy="87%" r="2.5" fill="rgba(255,255,255,0.75)" />
                    <rect x="42%" y="98%" width="16%" height="1.5%" strokeWidth="2" fill="rgba(255,255,255,0.25)" />
                  </svg>

                  {/* Bolinhas nas posições exatas da formação */}
                  {slotsAtribuidos.map(({ slot, atleta }) => (
                    <div
                      key={slot.id}
                      style={{
                        position: 'absolute',
                        left: `${slot.left}%`,
                        top: `${slot.top}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20,
                      }}
                      className="flex flex-col items-center"
                    >
                      {atleta ? (
                        <>
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg relative flex items-center justify-center p-0.5"
                            style={{
                              backgroundColor: '#16A34A',
                              color: '#FFFFFF',
                              border: '2px solid #14532D',
                            }}
                          >
                            <div
                              className="w-full h-full rounded-full flex items-center justify-center font-black text-[11px] tracking-tight"
                              style={{ color: '#FFFFFF' }}
                            >
                              {atleta.numeroCamisa ? `#${atleta.numeroCamisa}` : obterIniciaisApelido(atleta)}
                            </div>

                            {/* Selo da sigla da posição */}
                            <span
                              className="absolute -top-1.5 -right-1.5 text-[8px] font-black px-1.5 py-0.2 rounded-full shadow leading-tight"
                              style={{
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: '1px solid #ffffff',
                              }}
                            >
                              {slot.label}
                            </span>
                          </div>

                          {/* Apelido embaixo */}
                          <div
                            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-black shadow-md max-w-[86px] truncate text-center leading-tight"
                            style={{
                              backgroundColor: '#16A34A',
                              color: '#FFFFFF',
                              border: '1px solid #14532D',
                            }}
                          >
                            {atleta.apelido?.trim() || atleta.nome.split(' ')[0]}
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-md relative"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              border: '2px solid #cbd5e1',
                            }}
                          >
                            <span className="text-xs font-black">--</span>
                            <span
                              className="absolute -top-1.5 -right-1.5 text-[8px] font-black px-1.5 py-0.2 rounded-full shadow leading-tight"
                              style={{
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: '1px solid #ffffff',
                              }}
                            >
                              {slot.label}
                            </span>
                          </div>
                          <div
                            className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold shadow-xs leading-tight"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            Vago
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé do Documento */}
            <div
              className="pt-3 text-center text-[10px]"
              style={{ borderTop: '1px solid #e2e8f0', color: '#64748b' }}
            >
              Master Soccer RJ · Estratégia de Jogo (Documento Interno da Comissão Técnica)
            </div>
          </div>
        </div>

        {/* Aviso de Compartilhamento (quando navegador não suporta ou precisa de 2º toque) */}
        {erroShare && (
          <div className="no-print px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{erroShare}</span>
            </div>
            <button
              type="button"
              onClick={() => setErroShare(null)}
              className="p-1 text-amber-700 hover:text-amber-950 dark:text-amber-300 cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Rodapé com 3 Botões: [Fechar] [Compartilhar] [Imprimir Agora] */}
        <div className="no-print p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/60 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={compartilhando}
            onClick={handleCompartilhar}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white hover:opacity-95 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            style={{ backgroundColor: '#059669', color: '#ffffff' }}
          >
            {compartilhando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Gerando PDF...</span>
              </>
            ) : arquivoPronto ? (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Abrir Compartilhar PDF</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white hover:opacity-95 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer transition"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Agora</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
