import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Award,
  Calendar,
  Activity,
  ArrowRight,
  TrendingUp,
  Download,
  Plus,
  Trophy,
  Clock,
  MapPin,
  Shield,
  Percent,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo, NotasPilares, JogoAgenda } from '../types';
import { RadarChart } from './RadarChart';
import { storageService } from '../services/storage';
import {
  formatarDataExibicao,
  dataParaValorOrdenacao,
  formatarDataAmigavelJogo,
} from '../utils/dateUtils';
import { obterIniciaisApelido } from '../utils/apelidoUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';

const STORAGE_KEY_PAINEL_CATEGORIA = 'mastersoccer_painel_categoria_v1';
const STORAGE_KEY_PAINEL_COMPETICAO = 'mastersoccer_painel_competicao_v1';

interface PainelGeralProps {
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  jogos?: JogoAgenda[];
  onNavegarPlantel: (categoria?: string) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
  onNovaAvaliacao: () => void;
  onNovoAtleta?: () => void;
  onNavegarJogo?: (jogoId?: string, categoria?: string, competicao?: string) => void;
}

/**
 * Função utilitária para extrair resultado e placar (Vitória, Empate, Derrota, GF, GS)
 * de uma string de resultado/placar (ex: "V 2x1", "E 1x1", "D 0x2", "2 x 1", "3 x 1")
 */
function extrairResultadoPartida(texto?: string): {
  v: number;
  e: number;
  d: number;
  gf: number;
  gs: number;
} | null {
  if (!texto) return null;
  const str = texto.trim();

  // Caso 1: Começa com V, E ou D (ex: "V 2x1", "V 3x0", "E 1x1", "D 0x2")
  const matchVED = str.match(/^([VEDved])\s*(\d+)?\s*[xX-]?\s*(\d+)?/i);
  if (matchVED) {
    const letra = matchVED[1].toUpperCase();
    const g1 = matchVED[2] ? parseInt(matchVED[2], 10) : letra === 'V' ? 1 : letra === 'E' ? 1 : 0;
    const g2 = matchVED[3] ? parseInt(matchVED[3], 10) : letra === 'V' ? 0 : letra === 'E' ? 1 : 1;
    return {
      v: letra === 'V' ? 1 : 0,
      e: letra === 'E' ? 1 : 0,
      d: letra === 'D' ? 1 : 0,
      gf: g1,
      gs: g2,
    };
  }

  // Caso 2: Placar numérico "2 x 1", "3 - 0", "Master 2 x 1 Magé"
  const matchPlacar = str.match(/(\d+)\s*[xX-]\s*(\d+)/);
  if (matchPlacar) {
    const gf = parseInt(matchPlacar[1], 10);
    const gs = parseInt(matchPlacar[2], 10);
    const v = gf > gs ? 1 : 0;
    const e = gf === gs ? 1 : 0;
    const d = gf < gs ? 1 : 0;
    return { v, e, d, gf, gs };
  }

  return null;
}

/**
 * Gera um caminho SVG linear passando pelos pontos exatos
 */
function gerarCaminhoLinhas(pontos: Array<{ x: number; y: number }>): string {
  if (pontos.length === 0) return '';
  return pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export const PainelGeral: React.FC<PainelGeralProps> = ({
  atletas,
  avaliacoes,
  categorias,
  jogos: jogosProps,
  onNavegarPlantel,
  onSelecionarAtleta,
  onNovaAvaliacao,
  onNavegarJogo,
}) => {
  // Estado da aba de filtro selecionada: restaurado da memória ou 'GERAL' por padrão
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEY_PAINEL_CATEGORIA) ||
        sessionStorage.getItem(STORAGE_KEY_PAINEL_CATEGORIA) ||
        'GERAL'
      );
    } catch {
      return 'GERAL';
    }
  });

  // Estado do filtro de competição selecionado: restaurado da memória ou 'Todas' por padrão
  const [competicaoAtiva, setCompeticaoAtiva] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEY_PAINEL_COMPETICAO) ||
        sessionStorage.getItem(STORAGE_KEY_PAINEL_COMPETICAO) ||
        'Todas'
      );
    } catch {
      return 'Todas';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAINEL_CATEGORIA, categoriaAtiva);
      sessionStorage.setItem(STORAGE_KEY_PAINEL_CATEGORIA, categoriaAtiva);
    } catch {}
  }, [categoriaAtiva]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAINEL_COMPETICAO, competicaoAtiva);
      sessionStorage.setItem(STORAGE_KEY_PAINEL_COMPETICAO, competicaoAtiva);
    } catch {}
  }, [competicaoAtiva]);

  // Estado do ponto selecionado no gráfico (ao clicar / passar o mouse / toque)
  const [pontoAtivoIndex, setPontoAtivoIndex] = useState<number | null>(null);

  // Jogos consolidados (usa jogosProps diretamente inclusive se estiver vazio [])
  const listaJogos = useMemo(() => {
    if (jogosProps !== undefined) return jogosProps;
    return storageService.getJogosAgenda();
  }, [jogosProps]);

  // Lista dinâmica de categorias: GERAL | SUB-15 | SUB-16 | SUB-17 + qualquer outra existente
  const todasCategorias = useMemo(() => {
    const catsSet = new Set<string>();
    categorias.forEach((c) => {
      if (c && c.trim()) catsSet.add(c.trim());
    });
    atletas.forEach((a) => {
      if (a.categoria && a.categoria.trim()) catsSet.add(a.categoria.trim());
    });
    listaJogos.forEach((j) => {
      if (j.categoria && j.categoria.trim()) catsSet.add(j.categoria.trim());
    });
    avaliacoes.forEach((av) => {
      if (av.categoria && av.categoria.trim()) catsSet.add(av.categoria.trim());
    });

    const arr = Array.from(catsSet);
    const prioridade: Record<string, number> = {
      'SUB-15': 1,
      'SUB-16': 2,
      'SUB-17': 3,
      'Sub-20': 4,
      'SUB-20': 4,
      Profissional: 5,
    };
    arr.sort((a, b) => (prioridade[a] || 99) - (prioridade[b] || 99));

    return ['GERAL', ...arr];
  }, [categorias, atletas, listaJogos, avaliacoes]);

  // Lista dinâmica de competições existentes (mesma regra da Agenda: somente competições com >= 1 jogo em qualquer categoria)
  const todasCompeticoes = useMemo(() => {
    const contagem: Record<string, number> = {};
    listaJogos.forEach((j) => {
      const nomeComp = j.tipo?.trim() || 'Amistoso';
      contagem[nomeComp] = (contagem[nomeComp] || 0) + 1;
    });
    const arr = Object.entries(contagem)
      .filter(([, count]) => count > 0)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], 'pt-BR');
      })
      .map(([nome]) => nome);
    return ['Todas', ...arr];
  }, [listaJogos]);

  // Se o último jogo de uma competição selecionada foi apagado, volta automaticamente para 'Todas'
  useEffect(() => {
    if (competicaoAtiva !== 'Todas' && !todasCompeticoes.includes(competicaoAtiva)) {
      setCompeticaoAtiva('Todas');
    }
  }, [competicaoAtiva, todasCompeticoes]);

  // =========================================================
  // CÁLCULO DE DESEMPENHO (V, E, D, GF, GS, APROVEITAMENTO, 5 PILARES & LINHAS DE EVOLUÇÃO)
  // =========================================================
  const estatisticasDesempenho = useMemo(() => {
    // 1. Coleta partidas realizadas / avaliadas de forma única
    interface PartidaUnica {
      id: string;
      categoria: string;
      adversario: string;
      dataJogo: string;
      competicao: string;
      v: number;
      e: number;
      d: number;
      gf: number;
      gs: number;
      placarOriginal: string;
    }

    const mapaPartidas: Record<string, PartidaUnica> = {};

    // 1.1 Do cadastro de jogos da agenda
    listaJogos.forEach((j) => {
      if (j.realizado || j.placar) {
        const res = extrairResultadoPartida(j.placar);
        if (res) {
          mapaPartidas[j.id] = {
            id: j.id,
            categoria: j.categoria,
            adversario: j.adversario,
            dataJogo: j.dataJogo,
            competicao: j.tipo || 'Geral',
            placarOriginal: j.placar || `${res.gf} x ${res.gs}`,
            ...res,
          };
        }
      }
    });

    // 1.2 Das avaliações cadastradas (deduplicando por jogo)
    avaliacoes.forEach((av) => {
      const key = av.jogoAgendaId || `${av.dataJogo}_${av.adversario}_${av.categoria}`;
      if (!mapaPartidas[key] && av.resultado) {
        const res = extrairResultadoPartida(av.resultado);
        if (res) {
          mapaPartidas[key] = {
            id: key,
            categoria: av.categoria,
            adversario: av.adversario,
            dataJogo: av.dataJogo,
            competicao: av.competicao || 'Geral',
            placarOriginal: av.resultado || `${res.gf} x ${res.gs}`,
            ...res,
          };
        }
      }
    });

    // Filtra pelo critério de categoria e de competição selecionadas
    const partidasFiltradas = Object.values(mapaPartidas).filter((p) => {
      const matchCat = categoriaAtiva === 'GERAL' || p.categoria === categoriaAtiva;
      const matchComp = competicaoAtiva === 'Todas' || p.competicao === competicaoAtiva;
      return matchCat && matchComp;
    });

    // Ordenação cronológica (do mais antigo para o mais recente)
    partidasFiltradas.sort((a, b) => {
      const valA = dataParaValorOrdenacao(a.dataJogo);
      const valB = dataParaValorOrdenacao(b.dataJogo);
      if (valA !== valB) return valA - valB;
      return a.adversario.localeCompare(b.adversario);
    });

    // Geração dos dados de evolução (Vitórias, Empates e Derrotas Acumuladas)
    let acumV = 0;
    let acumE = 0;
    let acumD = 0;
    let acumuladorPts = 0;
    const partidasEvolucao = partidasFiltradas.map((p) => {
      acumV += p.v;
      acumE += p.e;
      acumD += p.d;
      const pontosJogo = p.v === 1 ? 3 : p.e === 1 ? 1 : 0;
      acumuladorPts += pontosJogo;

      // Encontra avaliações vinculadas a esta partida
      const avsDestaPartida = avaliacoes.filter((av) => {
        if (av.jogoAgendaId && av.jogoAgendaId === p.id) return true;
        const avData = formatarDataExibicao(av.dataJogo);
        const pData = formatarDataExibicao(p.dataJogo);
        const advAv = av.adversario.toLowerCase().replace(/^vs\.?\s*/i, '').trim();
        const advP = p.adversario.toLowerCase().replace(/^vs\.?\s*/i, '').trim();
        const catMatch = !p.categoria || p.categoria === 'GERAL' || av.categoria === p.categoria;
        return avData === pData && advAv === advP && catMatch;
      });

      let notaMediaEquipe = 0;
      if (avsDestaPartida.length > 0) {
        const soma = avsDestaPartida.reduce((acc, av) => acc + (av.notaGeral || 0), 0);
        notaMediaEquipe = Number((soma / avsDestaPartida.length).toFixed(1));
      } else {
        notaMediaEquipe = p.v === 1 ? 8.5 : p.e === 1 ? 7.2 : 6.0;
      }

      const resultadoExtenso = p.v === 1 ? 'Vitória' : p.e === 1 ? 'Empate' : 'Derrota';
      const resultadoTipo: 'V' | 'E' | 'D' = p.v === 1 ? 'V' : p.e === 1 ? 'E' : 'D';
      const dataFormatada = formatarDataExibicao(p.dataJogo).slice(0, 5) || '—';
      const adversarioLimpo = p.adversario.trim();
      const adversarioComVs = /^vs\.?\s+/i.test(adversarioLimpo)
        ? adversarioLimpo
        : `vs ${adversarioLimpo}`;
      const placarLimpo = (p.placarOriginal || `${p.gf} x ${p.gs}`).replace(/^[VEDved]\s*/, '').trim();

      return {
        id: p.id,
        categoria: p.categoria,
        competicao: p.competicao,
        adversario: adversarioLimpo,
        adversarioComVs,
        dataJogo: p.dataJogo,
        dataFormatada,
        resultadoTipo,
        resultadoExtenso,
        placarLimpo,
        pontosJogo,
        pontosAcumulados: acumuladorPts,
        vitoriasAcumuladas: acumV,
        empatesAcumulados: acumE,
        derrotasAcumuladas: acumD,
        notaMediaEquipe,
        totalAvaliacoes: avsDestaPartida.length,
      };
    });

    const totalJogos = partidasFiltradas.length;
    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    let golsFeitos = 0;
    let golsSofridos = 0;

    partidasFiltradas.forEach((p) => {
      vitorias += p.v;
      empates += p.e;
      derrotas += p.d;
      golsFeitos += p.gf;
      golsSofridos += p.gs;
    });

    // Se ainda não houver partidas com placar registrado, mas existirem avaliações, calcula com base nas avaliações
    const avsCategoria = avaliacoes.filter((av) => {
      const matchCat = categoriaAtiva === 'GERAL' || av.categoria === categoriaAtiva;
      const matchComp = competicaoAtiva === 'Todas' || av.competicao === competicaoAtiva;
      return matchCat && matchComp;
    });

    const pontosPossiveis = totalJogos * 3;
    const pontosConquistados = vitorias * 3 + empates * 1;
    const aproveitamentoPct =
      pontosPossiveis > 0 ? Number(((pontosConquistados / pontosPossiveis) * 100).toFixed(1)) : 0;

    // Cálculo das médias dos 5 Pilares para a categoria selecionada
    let mediasPilares: NotasPilares = {
      tecnica: 0,
      tatica: 0,
      fisica: 0,
      mental: 0,
      disciplinar: 0,
    };

    if (avsCategoria.length > 0) {
      const soma = avsCategoria.reduce(
        (acc, av) => {
          acc.tecnica += av.notas?.tecnica || 0;
          acc.tatica += av.notas?.tatica || 0;
          acc.fisica += av.notas?.fisica || 0;
          acc.mental += av.notas?.mental || 0;
          acc.disciplinar += av.notas?.disciplinar || 0;
          return acc;
        },
        { tecnica: 0, tatica: 0, fisica: 0, mental: 0, disciplinar: 0 }
      );
      const n = avsCategoria.length;
      mediasPilares = {
        tecnica: Number((soma.tecnica / n).toFixed(1)),
        tatica: Number((soma.tatica / n).toFixed(1)),
        fisica: Number((soma.fisica / n).toFixed(1)),
        mental: Number((soma.mental / n).toFixed(1)),
        disciplinar: Number((soma.disciplinar / n).toFixed(1)),
      };
    }

    const mediaGeralPilares =
      avsCategoria.length > 0
        ? Number(
            (
              (mediasPilares.tecnica +
                mediasPilares.tatica +
                mediasPilares.fisica +
                mediasPilares.mental +
                mediasPilares.disciplinar) /
              5
            ).toFixed(1)
          )
        : 0;

    return {
      totalJogos,
      vitorias,
      empates,
      derrotas,
      golsFeitos,
      golsSofridos,
      saldoGols: golsFeitos - golsSofridos,
      aproveitamentoPct,
      mediasPilares,
      mediaGeralPilares,
      totalAvaliacoes: avsCategoria.length,
      partidasEvolucao,
    };
  }, [categoriaAtiva, competicaoAtiva, listaJogos, avaliacoes]);

  // Ponto ativo no gráfico (hover/clique/toque)
  const pontoAtivo = useMemo(() => {
    const lista = estatisticasDesempenho.partidasEvolucao;
    if (lista.length === 0) return null;
    if (pontoAtivoIndex !== null && lista[pontoAtivoIndex]) {
      return lista[pontoAtivoIndex];
    }
    return lista[lista.length - 1];
  }, [estatisticasDesempenho.partidasEvolucao, pontoAtivoIndex]);

  // =========================================================
  // PRÓXIMOS JOGOS (3 PRÓXIMOS EM ORDEM DE DATA E HORÁRIO)
  // Obedece os mesmos 2 filtros ativos (Categoria e Competição)
  // =========================================================
  const proximosJogos = useMemo(() => {
    const jogosNaoRealizados = listaJogos.filter((j) => !j.realizado);

    const catFiltro = categoriaAtiva.trim().toUpperCase();
    const compFiltro = competicaoAtiva.trim().toLowerCase();

    const filtrados = jogosNaoRealizados.filter((j) => {
      const matchCat =
        categoriaAtiva === 'GERAL' ||
        (j.categoria || '').trim().toUpperCase() === catFiltro;
      const matchComp =
        competicaoAtiva === 'Todas' ||
        (j.tipo || '').trim().toLowerCase() === compFiltro;
      return matchCat && matchComp;
    });

    // Ordena do mais próximo para o mais distante (crescente de data e hora)
    filtrados.sort((a, b) => {
      const valA = dataParaValorOrdenacao(a.dataJogo);
      const valB = dataParaValorOrdenacao(b.dataJogo);
      if (valA !== valB) return valA - valB;
      const horaA = a.hora || '00:00';
      const horaB = b.hora || '00:00';
      return horaA.localeCompare(horaB);
    });

    return filtrados.slice(0, 3);
  }, [categoriaAtiva, competicaoAtiva, listaJogos]);

  // =========================================================
  // DESEMPENHO DOS JOGADORES / DESTAQUES DA TEMPORADA
  // Lista dos atletas em ordem do melhor para o pior, com média e posição
  // Obedece o mesmo filtro: em GERAL mostra todos, em SUB-15 só SUB-15, etc.
  // =========================================================
  const atletasRanqueados = useMemo(() => {
    const atletasFiltrados = atletas.filter((a) => {
      if (categoriaAtiva === 'GERAL') return true;
      return a.categoria === categoriaAtiva;
    });

    const atletasComStats = atletasFiltrados.map((atleta) => {
      const avs = avaliacoes.filter((av) => {
        if (av.atletaId !== atleta.id) return false;
        const matchCat = categoriaAtiva === 'GERAL' || av.categoria === categoriaAtiva;
        const matchComp = competicaoAtiva === 'Todas' || av.competicao === competicaoAtiva;
        return matchCat && matchComp;
      });

      const totalJogos = avs.length;
      const mediaGeral =
        totalJogos > 0 ? Number((avs.reduce((acc, av) => acc + av.notaGeral, 0) / totalJogos).toFixed(1)) : 0;

      // Melhor pilar
      let melhorPilarNome = 'Equilibrado';
      if (totalJogos > 0) {
        const medias = {
          Técnico: avs.reduce((acc, av) => acc + (av.notas?.tecnica || 0), 0) / totalJogos,
          Tático: avs.reduce((acc, av) => acc + (av.notas?.tatica || 0), 0) / totalJogos,
          Físico: avs.reduce((acc, av) => acc + (av.notas?.fisica || 0), 0) / totalJogos,
          Mental: avs.reduce((acc, av) => acc + (av.notas?.mental || 0), 0) / totalJogos,
          Disciplinar: avs.reduce((acc, av) => acc + (av.notas?.disciplinar || 0), 0) / totalJogos,
        };
        const entradas = Object.entries(medias);
        entradas.sort((a, b) => b[1] - a[1]);
        if (entradas[0] && entradas[0][1] > 0) {
          melhorPilarNome = entradas[0][0];
        }
      }

      return {
        atleta,
        totalJogos,
        mediaGeral,
        melhorPilarNome,
      };
    });

    // Ordenação: Do melhor para o pior (maior média para menor média)
    atletasComStats.sort((a, b) => {
      if (b.mediaGeral !== a.mediaGeral) {
        return b.mediaGeral - a.mediaGeral;
      }
      if (b.totalJogos !== a.totalJogos) {
        return b.totalJogos - a.totalJogos;
      }
      return a.atleta.nome.localeCompare(b.atleta.nome);
    });

    return atletasComStats;
  }, [categoriaAtiva, competicaoAtiva, atletas, avaliacoes]);

  const getCorNota = (nota: number) => {
    if (nota >= 8.5)
      return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800';
    if (nota >= 7.0)
      return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800';
    if (nota >= 5.0)
      return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-5 pb-[120px] w-full max-w-full box-border">
      {/* ========================================================= */}
      {/* BANNER DE BOAS-VINDAS MASTER SOCCER (AZUL E OURO) */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col items-center justify-center text-center gap-3 border border-blue-800/80 relative overflow-hidden">
        {/* Glow sutil de fundo dourado */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-3 z-10 max-w-2xl">
          <MasterSoccerEscudo size={74} className="drop-shadow-lg shrink-0" />
          <div className="space-y-1.5 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[13px] font-black text-amber-400 tracking-wider uppercase font-mono bg-blue-950/90 px-3 py-1 rounded-lg border border-amber-400/40">
                Master Soccer · Rio de Janeiro
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Controle & Avaliação das Categorias de Base
            </h2>
            <p className="text-[14px] sm:text-[15px] text-slate-200 leading-relaxed font-medium">
              Monitoramento dos atletas com notas estruturadas nos 5 pilares fundamentais, estatísticas
              oficiais e pareceres pós-jogo.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2 & 3. SEÇÃO DESEMPENHO (ABAS DE FILTRO + GRÁFICO + PILARES) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Topo da Seção: Título e Abas de Filtro GERAL | SUB-15 | SUB-16 | SUB-17 ... */}
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Desempenho da Equipe
                </h3>
              </div>
              <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Resultados, aproveitamento e média dos 5 pilares das partidas avaliadas
              </p>
            </div>

            {/* Abas de Filtro de Categoria */}
            <div className="flex flex-wrap items-center gap-2">
              {todasCategorias.map((cat) => {
                const ativo = categoriaAtiva === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoriaAtiva(cat);
                      setPontoAtivoIndex(null);
                    }}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
                      ativo
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                    style={ativo ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro de Competição - BOTÕES IGUAIS AOS DE CATEGORIA */}
          {todasCompeticoes.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2 text-[14px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span>COMPETIÇÃO:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {todasCompeticoes.map((comp) => {
                  const ativo = competicaoAtiva === comp;
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => {
                        setCompeticaoAtiva(comp);
                        setPontoAtivoIndex(null);
                      }}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
                        ativo
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                      style={
                        ativo
                          ? { backgroundColor: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }
                          : {}
                      }
                    >
                      {comp}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* GRÁFICO E NÚMEROS DE DESEMPENHO + PENTÁGONO */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLUNA ESQUERDA: Aproveitamento, Barras V/E/D e Tabela de Números (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card de Destaque: Aproveitamento % */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-slate-850 dark:via-slate-850 dark:to-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <span className="text-[14px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                  Aproveitamento {categoriaAtiva === 'GERAL' ? 'Geral' : `Categoria ${categoriaAtiva}`}
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tabular-nums flex flex-wrap items-baseline gap-2">
                  <span>{estatisticasDesempenho.aproveitamentoPct}%</span>
                  <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300 font-sans">
                    dos pontos disputados
                  </span>
                </div>
                <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium">
                  {estatisticasDesempenho.totalJogos > 0
                    ? `Calculado sobre ${estatisticasDesempenho.totalJogos} ${
                        estatisticasDesempenho.totalJogos === 1 ? 'partida avaliada' : 'partidas avaliadas'
                      }`
                    : 'Nenhuma partida finalizada registrada nesta categoria'}
                </p>
              </div>

              {/* Selo visual de status do aproveitamento */}
              <div className="shrink-0">
                <div
                  className={`px-4 py-2 rounded-xl text-[14px] font-black border flex items-center gap-1.5 shadow-2xs ${
                    estatisticasDesempenho.aproveitamentoPct >= 70
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : estatisticasDesempenho.aproveitamentoPct >= 45
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  <span>
                    {estatisticasDesempenho.aproveitamentoPct >= 70
                      ? 'Excelente Desempenho'
                      : estatisticasDesempenho.aproveitamentoPct >= 45
                      ? 'Campanha Regular'
                      : 'Em Evolução'}
                  </span>
                </div>
              </div>
            </div>

            {/* GRÁFICO DE EVOLUÇÃO (V / E / D) - LINHAS: VITÓRIAS, EMPATES E DERROTAS ACUMULADAS */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h4 className="text-[15px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    GRÁFICO DE EVOLUÇÃO (V / E / D) - {estatisticasDesempenho.totalJogos}{' '}
                    {estatisticasDesempenho.totalJogos === 1 ? 'jogo' : 'jogos'}
                  </span>
                </h4>

                {/* Legenda em cima do gráfico: [— Vitórias] [-- Empates] [-- Derrotas] */}
                <div className="flex flex-wrap items-center gap-3 text-[14px] font-bold shrink-0">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="w-3.5 h-1 bg-emerald-600 dark:bg-emerald-400 inline-block rounded-full" />
                    <span>Vitórias</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="w-3.5 border-t-2 border-dashed border-amber-500 dark:border-amber-400 inline-block" />
                    <span>Empates</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-3.5 border-t-2 border-dashed border-rose-600 dark:border-rose-400 inline-block" />
                    <span>Derrotas</span>
                  </div>
                </div>
              </div>

              {/* Informação / Tooltip da partida selecionada ou ativa */}
              <div className="min-h-[42px] flex items-center">
                {pontoAtivo ? (
                  <div className="w-full flex flex-wrap items-center gap-2 p-3 rounded-xl bg-blue-50/90 dark:bg-slate-800/90 border border-blue-200 dark:border-slate-700 text-[14px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span className="text-slate-900 dark:text-white font-black">
                      {pontoAtivo.adversarioComVs}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-black text-[13px] ${
                        pontoAtivo.resultadoTipo === 'V'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : pontoAtivo.resultadoTipo === 'E'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {pontoAtivo.resultadoExtenso} {pontoAtivo.placarLimpo}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">
                      Vitórias: {pontoAtivo.vitoriasAcumuladas}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">
                      Empates: {pontoAtivo.empatesAcumulados}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      Derrotas: {pontoAtivo.derrotasAcumuladas}
                    </span>
                  </div>
                ) : (
                  <div className="text-[14px] text-slate-500 dark:text-slate-400 italic">
                    Toque ou passe o mouse em um ponto do gráfico para ver detalhes da partida.
                  </div>
                )}
              </div>

              {/* GRÁFICO DE LINHAS OU EMPTY STATE */}
              {estatisticasDesempenho.partidasEvolucao.length === 0 ? (
                <div className="h-[220px] flex flex-col items-center justify-center p-5 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                  <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
                  <p className="text-[15px] font-bold text-slate-600 dark:text-slate-300">
                    Sem jogos avaliados neste filtro.
                  </p>
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">
                    Cadastre partidas na Agenda ou avalie atletas nesta categoria / competição para visualizar o gráfico.
                  </p>
                </div>
              ) : (
                <div className="relative w-full h-[230px] overflow-hidden select-none bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800/80">
                  {(() => {
                    const partidas = estatisticasDesempenho.partidasEvolucao;
                    const N = partidas.length;
                    const maxY = Math.max(1, N);

                    const width = 560;
                    const height = 235;
                    const plotLeft = 40;
                    const plotRight = 520;
                    const plotTop = 20;
                    const plotBottom = 165;
                    const plotWidth = plotRight - plotLeft;
                    const plotHeight = plotBottom - plotTop;

                    const pontosPlot = partidas.map((p, i) => {
                      const x = N === 1 ? (plotLeft + plotRight) / 2 : plotLeft + (i / (N - 1)) * plotWidth;
                      const yVit = plotBottom - (p.vitoriasAcumuladas / maxY) * plotHeight;
                      const yEmp = plotBottom - (p.empatesAcumulados / maxY) * plotHeight;
                      const yDer = plotBottom - (p.derrotasAcumuladas / maxY) * plotHeight;
                      return {
                        ...p,
                        index: i,
                        x,
                        yVit,
                        yEmp,
                        yDer,
                      };
                    });

                    const caminhoVit = gerarCaminhoLinhas(pontosPlot.map((pt) => ({ x: pt.x, y: pt.yVit })));
                    const caminhoEmp = gerarCaminhoLinhas(pontosPlot.map((pt) => ({ x: pt.x, y: pt.yEmp })));
                    const caminhoDer = gerarCaminhoLinhas(pontosPlot.map((pt) => ({ x: pt.x, y: pt.yDer })));

                    const ticksY: number[] = [];
                    if (maxY <= 6) {
                      for (let v = 0; v <= maxY; v++) ticksY.push(v);
                    } else {
                      const step = Math.ceil(maxY / 5);
                      for (let v = 0; v <= maxY; v += step) ticksY.push(v);
                      if (ticksY[ticksY.length - 1] !== maxY) ticksY.push(maxY);
                    }

                    return (
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        {ticksY.map((val) => {
                          const y = plotBottom - (val / maxY) * plotHeight;
                          return (
                            <g key={val}>
                              <line
                                x1={plotLeft}
                                y1={y}
                                x2={plotRight}
                                y2={y}
                                stroke="currentColor"
                                className="text-slate-200 dark:text-slate-800"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                              <text
                                x={plotLeft - 7}
                                y={y + 4}
                                textAnchor="end"
                                className="text-[11px] font-bold fill-slate-600 dark:fill-slate-400 select-none"
                              >
                                {val}
                              </text>
                            </g>
                          );
                        })}

                        {pontoAtivo && (
                          <line
                            x1={pontosPlot[partidas.findIndex((pt) => pt.id === pontoAtivo.id)]?.x || 0}
                            y1={plotTop - 6}
                            x2={pontosPlot[partidas.findIndex((pt) => pt.id === pontoAtivo.id)]?.x || 0}
                            y2={plotBottom}
                            stroke="#2563eb"
                            strokeDasharray="3 3"
                            strokeWidth="1.5"
                            opacity="0.6"
                          />
                        )}

                        <path
                          d={caminhoVit}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d={caminhoEmp}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray="5 4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d={caminhoDer}
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2.5"
                          strokeDasharray="5 4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {pontosPlot.map((pt) => {
                          const isAtivo = pontoAtivo?.id === pt.id;
                          return (
                            <g key={pt.id}>
                              <circle
                                cx={pt.x}
                                cy={pt.yDer}
                                r={isAtivo ? 6 : 4.5}
                                fill="#dc2626"
                                stroke="#ffffff"
                                strokeWidth={isAtivo ? 2 : 1.5}
                                className="transition-all duration-150 pointer-events-none"
                              />

                              <circle
                                cx={pt.x}
                                cy={pt.yEmp}
                                r={isAtivo ? 6 : 4.5}
                                fill="#f59e0b"
                                stroke="#ffffff"
                                strokeWidth={isAtivo ? 2 : 1.5}
                                className="transition-all duration-150 pointer-events-none"
                              />

                              <circle
                                cx={pt.x}
                                cy={pt.yVit}
                                r={isAtivo ? 7.5 : 6}
                                fill="#16a34a"
                                stroke="#ffffff"
                                strokeWidth={isAtivo ? 2.5 : 2}
                                className="transition-all duration-150 pointer-events-none drop-shadow-xs"
                              />

                              <text
                                x={pt.x}
                                y={plotBottom + 19}
                                textAnchor="middle"
                                className={`text-[11px] font-black select-none pointer-events-none ${
                                  isAtivo
                                    ? 'fill-blue-600 dark:fill-blue-400'
                                    : 'fill-slate-800 dark:fill-slate-200'
                                }`}
                              >
                                {pt.adversarioComVs.length > 13
                                  ? `${pt.adversarioComVs.slice(0, 11)}...`
                                  : pt.adversarioComVs}
                              </text>
                              <text
                                x={pt.x}
                                y={plotBottom + 34}
                                textAnchor="middle"
                                className={`text-[11px] font-bold select-none pointer-events-none ${
                                  isAtivo
                                    ? 'fill-blue-600 dark:fill-blue-400'
                                    : 'fill-slate-600 dark:fill-slate-400'
                                }`}
                              >
                                {pt.placarLimpo}
                              </text>

                              <rect
                                x={pt.x - 24}
                                y={plotTop - 10}
                                width={48}
                                height={plotHeight + 50}
                                fill="transparent"
                                className="cursor-pointer"
                                onClick={() => setPontoAtivoIndex(pt.index)}
                                onMouseEnter={() => setPontoAtivoIndex(pt.index)}
                                onTouchStart={() => setPontoAtivoIndex(pt.index)}
                              >
                                <title>{`${pt.adversarioComVs} • ${pt.resultadoExtenso} ${pt.placarLimpo} • Vitórias: ${pt.vitoriasAcumuladas} • Empates: ${pt.empatesAcumulados} • Derrotas: ${pt.derrotasAcumuladas}`}</title>
                              </rect>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              )}

              {/* RESUMO MANTIDO ABAIXO DO GRÁFICO (VITÓRIAS, EMPATES, DERROTAS) */}
              <div className="space-y-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                {/* 1. Vitórias */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[14px] font-bold">
                    <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      Vitórias
                    </span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-black">
                      {estatisticasDesempenho.vitorias}{' '}
                      <span className="text-[13px] text-slate-500 font-sans font-bold">
                        (
                        {estatisticasDesempenho.totalJogos > 0
                          ? Math.round(
                              (estatisticasDesempenho.vitorias / estatisticasDesempenho.totalJogos) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      style={{
                        width: `${
                          estatisticasDesempenho.totalJogos > 0
                            ? (estatisticasDesempenho.vitorias / estatisticasDesempenho.totalJogos) * 100
                            : 0
                        }%`,
                        backgroundColor: '#16A34A',
                      }}
                      className="h-full rounded-lg transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 2. Empates */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[14px] font-bold">
                    <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Empates
                    </span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-black">
                      {estatisticasDesempenho.empates}{' '}
                      <span className="text-[13px] text-slate-500 font-sans font-bold">
                        (
                        {estatisticasDesempenho.totalJogos > 0
                          ? Math.round(
                              (estatisticasDesempenho.empates / estatisticasDesempenho.totalJogos) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      style={{
                        width: `${
                          estatisticasDesempenho.totalJogos > 0
                            ? (estatisticasDesempenho.empates / estatisticasDesempenho.totalJogos) * 100
                            : 0
                        }%`,
                        backgroundColor: '#EAB308',
                      }}
                      className="h-full rounded-lg transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 3. Derrotas */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[14px] font-bold">
                    <span className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                      Derrotas
                    </span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-black">
                      {estatisticasDesempenho.derrotas}{' '}
                      <span className="text-[13px] text-slate-500 font-sans font-bold">
                        (
                        {estatisticasDesempenho.totalJogos > 0
                          ? Math.round(
                              (estatisticasDesempenho.derrotas / estatisticasDesempenho.totalJogos) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      style={{
                        width: `${
                          estatisticasDesempenho.totalJogos > 0
                            ? (estatisticasDesempenho.derrotas / estatisticasDesempenho.totalJogos) * 100
                            : 0
                        }%`,
                        backgroundColor: '#E11D48',
                      }}
                      className="h-full rounded-lg transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GRID DE NÚMEROS:
                1ª linha: Nº DE JOGOS | VITÓRIAS | GOLS FEITOS | SALDO DE GOL
                2ª linha: EMPATES | GOLS SOFRIDOS | DERROTAS | APROVEITAMENTO (azul destacado)
            */}
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* 1. Nº de Jogos */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block tracking-tight">
                  Nº de Jogos
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums block">
                  {estatisticasDesempenho.totalJogos}
                </span>
              </div>

              {/* 2. Vitórias */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 block tracking-tight">
                  Vitórias
                </span>
                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 tabular-nums block">
                  {estatisticasDesempenho.vitorias}
                </span>
              </div>

              {/* 3. Gols Feitos */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-blue-800 dark:text-blue-300 block tracking-tight">
                  Gols Feitos
                </span>
                <span className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400 tabular-nums block">
                  {estatisticasDesempenho.golsFeitos}
                </span>
              </div>

              {/* 4. Saldo de Gol */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-slate-600 dark:text-slate-300 block tracking-tight">
                  Saldo de Gol
                </span>
                <span
                  className={`text-2xl font-black font-mono tabular-nums block ${
                    estatisticasDesempenho.saldoGols > 0
                      ? 'text-emerald-600'
                      : estatisticasDesempenho.saldoGols < 0
                      ? 'text-rose-600'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {estatisticasDesempenho.saldoGols > 0
                    ? `+${estatisticasDesempenho.saldoGols}`
                    : estatisticasDesempenho.saldoGols}
                </span>
              </div>

              {/* 5. Empates */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-amber-800 dark:text-amber-300 block tracking-tight">
                  Empates
                </span>
                <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400 tabular-nums block">
                  {estatisticasDesempenho.empates}
                </span>
              </div>

              {/* 6. Gols Sofridos */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-slate-600 dark:text-slate-300 block tracking-tight">
                  Gols Sofridos
                </span>
                <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200 tabular-nums block">
                  {estatisticasDesempenho.golsSofridos}
                </span>
              </div>

              {/* 7. Derrotas */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-2xs space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-rose-800 dark:text-rose-300 block tracking-tight">
                  Derrotas
                </span>
                <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400 tabular-nums block">
                  {estatisticasDesempenho.derrotas}
                </span>
              </div>

              {/* 8. Aproveitamento (destacado em azul) */}
              <div className="p-3.5 rounded-xl bg-blue-600 text-white shadow-sm space-y-1">
                <span className="text-[13px] font-extrabold uppercase text-blue-100 block tracking-tight">
                  Aproveitamento
                </span>
                <span className="text-2xl font-black font-mono tabular-nums block">
                  {estatisticasDesempenho.aproveitamentoPct}%
                </span>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: O Pentágono dos 5 Pilares (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/80 dark:bg-slate-850 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between gap-3 shadow-2xs">
            <div className="w-full flex flex-wrap items-start justify-between gap-2.5 mb-1">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Média dos 5 Pilares
                </h4>
                <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  {categoriaAtiva === 'GERAL' ? 'Balanço Geral de todas as categorias' : `Média exclusiva ${categoriaAtiva}`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                  Média Geral
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 inline-block mt-0.5">
                  {estatisticasDesempenho.mediaGeralPilares.toFixed(1)} / 10
                </span>
              </div>
            </div>

            {/* Gráfico Pentagonal (RadarChart) */}
            <div className="py-1 flex items-center justify-center">
              <RadarChart notas={estatisticasDesempenho.mediasPilares} size={245} />
            </div>

            {/* Valores numéricos dos 5 Pilares: TÉC, TÁT, FÍS, MEN, DISC */}
            <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-2 text-center pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block">TÉC</span>
                <span className="text-[16px] font-mono font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {estatisticasDesempenho.mediasPilares.tecnica.toFixed(1)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block">TÁT</span>
                <span className="text-[16px] font-mono font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {estatisticasDesempenho.mediasPilares.tatica.toFixed(1)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block">FÍS</span>
                <span className="text-[16px] font-mono font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {estatisticasDesempenho.mediasPilares.fisica.toFixed(1)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block">MEN</span>
                <span className="text-[16px] font-mono font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {estatisticasDesempenho.mediasPilares.mental.toFixed(1)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block">DISC</span>
                <span className="text-[16px] font-mono font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {estatisticasDesempenho.mediasPilares.disciplinar.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5 & 6. SEÇÃO PRÓXIMOS JOGOS (3 PRÓXIMOS EM ORDEM CRONOLÓGICA) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Próximos Jogos
              </h3>
              <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                {categoriaAtiva === 'GERAL' && competicaoAtiva === 'Todas'
                  ? 'Próximas 3 partidas de qualquer categoria por ordem de data e hora'
                  : categoriaAtiva === 'GERAL'
                  ? `Próximas 3 partidas de ${competicaoAtiva} por ordem de data e hora`
                  : competicaoAtiva === 'Todas'
                  ? `Próximas 3 partidas exclusivas da categoria ${categoriaAtiva}`
                  : `Próximas 3 partidas de ${categoriaAtiva} em ${competicaoAtiva}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onNavegarJogo) {
                const cat = categoriaAtiva === 'GERAL' ? 'TODAS' : categoriaAtiva;
                const comp = competicaoAtiva === 'Todas' ? 'TODAS' : competicaoAtiva;
                onNavegarJogo(undefined, cat, comp);
              } else {
                onNovaAvaliacao();
              }
            }}
            className="text-[14px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer py-1"
          >
            <span>Ver Agenda Completa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {proximosJogos.length === 0 ? (
          <div className="p-6 text-center bg-slate-50/70 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              Nenhum próximo jogo para este filtro
            </h4>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {categoriaAtiva === 'GERAL' && competicaoAtiva === 'Todas'
                ? 'Não há partidas futuras agendadas no momento.'
                : `Não há partidas futuras para ${
                    categoriaAtiva === 'GERAL' ? 'todas as categorias' : categoriaAtiva
                  }${competicaoAtiva === 'Todas' ? '' : ` em ${competicaoAtiva}`}.`}
            </p>
            <button
              onClick={onNovaAvaliacao}
              className="mt-1 inline-flex items-center gap-2 px-4 py-2 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Novo Jogo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {proximosJogos.map((jogo, index) => {
              const dataAmigavel = formatarDataAmigavelJogo(jogo.dataJogo, jogo.hora);

              return (
                <div
                  key={jogo.id}
                  onClick={() => (onNavegarJogo ? onNavegarJogo(jogo.id, jogo.categoria, jogo.tipo) : onNovaAvaliacao())}
                  className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {jogo.categoria}
                        </span>
                        <span className="text-[13px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          {jogo.tipo}
                        </span>
                      </div>
                      <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">
                        #{index + 1} Próximo
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      Master Soccer {jogo.adversario.startsWith('vs') ? jogo.adversario : `vs ${jogo.adversario}`}
                    </h4>
                  </div>

                  <div className="space-y-1.5 text-[14px] text-slate-700 dark:text-slate-300 font-medium pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{dataAmigavel}</span>
                    </div>

                    {jogo.hora && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Horário: {jogo.hora}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{jogo.local || 'CT Master Soccer'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 7. SEÇÃO DESEMPENHO DOS JOGADORES / DESTAQUES DA TEMPORADA */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Desempenho dos Jogadores / Destaques da Temporada
              </h3>
            </div>
            <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Classificação geral dos atletas do melhor para o pior ({categoriaAtiva})
            </p>
          </div>

          <button
            onClick={() => onNavegarPlantel(categoriaAtiva === 'GERAL' ? 'TODAS' : categoriaAtiva)}
            className="text-[14px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto py-1"
          >
            <span>Ver Plantel Completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {atletasRanqueados.length === 0 ? (
          <div className="p-6 text-center text-[14px] text-slate-500 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Nenhum atleta encontrado nesta categoria.
          </div>
        ) : (
          <div className="space-y-3">
            {atletasRanqueados.map(({ atleta, totalJogos, mediaGeral, melhorPilarNome }, index) => {
              const posicaoRanking = index + 1;
              const ehOuro = posicaoRanking === 1;
              const ehPrata = posicaoRanking === 2;
              const ehBronze = posicaoRanking === 3;

              return (
                <div
                  key={atleta.id}
                  onClick={() => onSelecionarAtleta(atleta)}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-blue-400 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-[14px] shrink-0 shadow-2xs ${
                        ehOuro
                          ? 'bg-amber-400 text-slate-950 border border-amber-300'
                          : ehPrata
                          ? 'bg-slate-300 text-slate-900 border border-slate-200'
                          : ehBronze
                          ? 'bg-amber-700 text-white border border-amber-600'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-mono'
                      }`}
                    >
                      {ehOuro ? '1º' : ehPrata ? '2º' : ehBronze ? '3º' : `${posicaoRanking}º`}
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-black text-[14px] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                      {atleta.fotoUrl ? (
                        <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover" />
                      ) : (
                        obterIniciaisApelido(atleta)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/70">
                          {atleta.categoria}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 uppercase tracking-tight group-hover:underline">
                          {atleta.apelido || atleta.nome.split(' ')[0]}
                        </h4>
                      </div>
                      <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {atleta.nome}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{atleta.posicao}</span>
                        <span>·</span>
                        <span>Pé: {atleta.pernaDominante}</span>
                        <span>·</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {totalJogos} {totalJogos === 1 ? 'partida avaliada' : 'partidas avaliadas'}
                        </span>
                        {totalJogos > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-slate-700 dark:text-slate-200">Ponto forte: {melhorPilarNome}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[12px] text-slate-500 dark:text-slate-400 block font-bold uppercase tracking-wider">
                        Média Geral
                      </span>
                      <span
                        className={`text-base sm:text-lg font-mono font-black px-3 py-1 rounded-lg border tabular-nums shadow-2xs inline-block ${getCorNota(
                          mediaGeral
                        )}`}
                      >
                        {totalJogos > 0 ? mediaGeral.toFixed(1) : '--'}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-[14px] text-slate-600 dark:text-slate-300 font-medium">
          <span>Critérios técnicos padronizados de 1 a 10 pela comissão</span>
          <button
            onClick={() => storageService.exportarAvaliacoesCsv()}
            className="inline-flex items-center gap-1.5 text-[14px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer py-1"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Planilha CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PainelGeral;
