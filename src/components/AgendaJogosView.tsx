import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Clock,
  MapPin,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Users,
  AlertCircle,
  Shield,
  Search,
  FileText,
} from 'lucide-react';
import {
  Atleta,
  AvaliacaoJogo,
  JogoAgenda,
  NotasPilares,
  POSICOES_JOGO,
  TAGS_DESTAQUE_DISPONIVEIS,
  TAGS_ATENCAO_DISPONIVEIS,
} from '../types';
import {
  formatarDataExibicao,
  dataParaValorOrdenacao,
  formatarDataAmigavelJogo,
  ordenarJogosAgenda,
} from '../utils/dateUtils';
import { tituloNota } from '../utils/avaliacaoUtils';
import { obterIniciaisApelido } from '../utils/apelidoUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';
import { ModalSumulaArbitragem, ModalEstrategiaJogo } from './DocumentosJogoModals';

interface AgendaJogosViewProps {
  jogos: JogoAgenda[];
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  onNovoJogo: () => void;
  onEditarJogo: (jogo: JogoAgenda) => void;
  onExcluirJogo: (id: string, nome?: string) => void;
  onExcluirAvaliacao?: (id: string) => void;
  onSalvarAvaliacao: (avaliacao: AvaliacaoJogo) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
  onNavegarEscalacao?: (jogoId: string) => void;
  jogoFocarInfo?: { jogoId?: string; categoria?: string; competicao?: string } | null;
  onLimparJogoFocar?: () => void;
}

const getPesoPosicaoOrdenacao = (posicao?: string, posicaoJogo?: string): number => {
  const p = `${posicaoJogo || ''} ${posicao || ''}`.toUpperCase();
  if (p.includes('GOL')) return 1;
  if (p.includes('LD') || p.includes('LATERAL DIR') || p.includes('LATERAL-DIR')) return 2;
  if (p.includes('ZAG')) return 3;
  if (p.includes('LE') || p.includes('LATERAL ESQ') || p.includes('LATERAL-ESQ')) return 4;
  if (p.includes('VOL')) return 5;
  if (p.includes('MEI') || p.includes('LOSANGO') || p.includes('LINHA DE 2') || p.includes('LINHA DE 3') || p.includes('10')) return 6;
  if (p.includes('ATA') || p.includes('PONTA') || p.includes('CENTROAVANTE')) return 7;
  return 8;
};

const getNomeAmigavelPosicao = (posicao?: string, posicaoJogo?: string): string => {
  const p = `${posicaoJogo || ''} ${posicao || ''}`.toUpperCase();
  if (p.includes('GOL')) return 'Goleiro';
  if (p.includes('LD') || p.includes('LATERAL DIR')) return 'Lateral Direito';
  if (p.includes('ZAG')) return 'Zagueiro';
  if (p.includes('LE') || p.includes('LATERAL ESQ')) return 'Lateral Esquerdo';
  if (p.includes('VOL')) return 'Volante';
  if (p.includes('MEI') || p.includes('10')) return 'Meia';
  if (p.includes('ATA') || p.includes('PONTA') || p.includes('CENTROAVANTE')) return 'Atacante';
  return posicaoJogo || posicao || 'Jogador';
};

/**
 * Busca a avaliação salva de um atleta especificamente para ESTE jogo,
 * garantindo que jogos distintos nunca misturem avaliações.
 */
const encontrarAvaliacaoDoAtletaNoJogo = (
  listaAvaliacoes: AvaliacaoJogo[],
  atletaId: string,
  jogo: JogoAgenda
): AvaliacaoJogo | undefined => {
  const porJogoId = listaAvaliacoes.find(
    (av) => av.atletaId === atletaId && av.jogoAgendaId === jogo.id
  );
  if (porJogoId) return porJogoId;

  const advJogoNorm = (jogo.adversario || '').replace(/^vs\s+/i, '').trim().toLowerCase();
  const dataJogoNorm = formatarDataExibicao(jogo.dataJogo);

  return listaAvaliacoes.find((av) => {
    if (av.atletaId !== atletaId) return false;
    if (av.jogoAgendaId) return false; // Já pertence a outro jogo específico
    const advAvNorm = (av.adversario || '').replace(/^vs\s+/i, '').trim().toLowerCase();
    const dataAvNorm = formatarDataExibicao(av.dataJogo);
    return (
      advAvNorm === advJogoNorm &&
      av.categoria === jogo.categoria &&
      dataAvNorm === dataJogoNorm
    );
  });
};

export const AgendaJogosView: React.FC<AgendaJogosViewProps> = ({
  jogos,
  atletas,
  avaliacoes,
  categorias,
  onNovoJogo,
  onEditarJogo,
  onExcluirJogo,
  onExcluirAvaliacao,
  onSalvarAvaliacao,
  onSelecionarAtleta,
  onNavegarEscalacao,
  jogoFocarInfo,
  onLimparJogoFocar,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [competicaoFiltro, setCompeticaoFiltro] = useState<string>('TODAS');
  const [buscaAdversario, setBuscaAdversario] = useState<string>('');
  const [jogoSelecionadoId, setJogoSelecionadoId] = useState<string | null>(null);
  const [jogoFallbackAberto, setJogoFallbackAberto] = useState<JogoAgenda | null>(null);
  const [modoLeitura, setModoLeitura] = useState<boolean>(false);
  const [jogoParaEstrategia, setJogoParaEstrategia] = useState<JogoAgenda | null>(null);
  const [jogoParaSumula, setJogoParaSumula] = useState<JogoAgenda | null>(null);

  const jogoSelecionadoParaAvaliar = useMemo(() => {
    if (!jogoSelecionadoId) return null;
    return jogos.find((j) => j.id === jogoSelecionadoId) || jogoFallbackAberto;
  }, [jogos, jogoSelecionadoId, jogoFallbackAberto]);

  // Memória de rolagem interna da aba JOGO
  const scrollAntesAvaliacaoRef = useRef<number>(0);
  const ultimoJogoAbertoIdRef = useRef<string | null>(null);
  const scrollPorFiltroRef = useRef<Record<string, number>>({});

  // Focar em jogo específico vindo de PRÓXIMOS JOGOS no Painel
  useEffect(() => {
    if (!jogoFocarInfo) return;

    const { jogoId, categoria, competicao } = jogoFocarInfo;
    const jogoAlvo = jogoId ? jogos.find((j) => j.id === jogoId) : undefined;

    const catFinal = categoria || jogoAlvo?.categoria;
    const compFinal = competicao || jogoAlvo?.tipo?.trim();

    if (catFinal) {
      setCategoriaFiltro(catFinal);
    }
    if (compFinal) {
      setCompeticaoFiltro(compFinal);
    }
    setBuscaAdversario('');

    if (jogoId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`card-jogo-${jogoId}`);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          el.classList.add(
            'ring-4',
            'ring-blue-600',
            'border-blue-600',
            'bg-blue-50',
            'dark:bg-blue-950/70',
            'transition-all',
            'duration-300'
          );
          setTimeout(() => {
            el.classList.remove(
              'ring-4',
              'ring-blue-600',
              'border-blue-600',
              'bg-blue-50',
              'dark:bg-blue-950/70'
            );
          }, 2000);
        }
        onLimparJogoFocar?.();
      }, 250);

      return () => clearTimeout(timer);
    } else {
      onLimparJogoFocar?.();
    }
  }, [jogoFocarInfo, jogos, onLimparJogoFocar]);

  // Transições de filtro com memória de posição
  const handleTrocarCategoriaFiltro = (novaCat: string) => {
    if (novaCat === categoriaFiltro) return;

    const chaveAtual = `${categoriaFiltro}__${competicaoFiltro}`;
    const currentY = window.scrollY || document.documentElement.scrollTop || 0;
    scrollPorFiltroRef.current[chaveAtual] = currentY;

    const chaveNova = `${novaCat}__${competicaoFiltro}`;
    const targetY = scrollPorFiltroRef.current[chaveNova] ?? currentY;

    setCategoriaFiltro(novaCat);

    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      });
    });
  };

  const handleTrocarCompeticaoFiltro = (novaComp: string) => {
    if (novaComp === competicaoFiltro) return;

    const chaveAtual = `${categoriaFiltro}__${competicaoFiltro}`;
    const currentY = window.scrollY || document.documentElement.scrollTop || 0;
    scrollPorFiltroRef.current[chaveAtual] = currentY;

    const chaveNova = `${categoriaFiltro}__${novaComp}`;
    const targetY = scrollPorFiltroRef.current[chaveNova] ?? currentY;

    setCompeticaoFiltro(novaComp);

    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      });
    });
  };

  // Categorias disponíveis para o Filtro 1 (TODAS + categorias dinâmicas dos jogos e atletas)
  const categoriasFiltroLista = useMemo<string[]>(() => {
    const catsSet = new Set<string>();
    jogos.forEach((j) => {
      if (j.categoria) catsSet.add(j.categoria);
    });
    categorias.forEach((c) => {
      if (c) catsSet.add(c);
    });
    return Array.from(catsSet).sort();
  }, [jogos, categorias]);

  // Jogos da categoria selecionada (para contagem e extração de competições)
  const jogosDaCategoria = useMemo(() => {
    return categoriaFiltro === 'TODAS'
      ? jogos
      : jogos.filter((j) => j.categoria === categoriaFiltro);
  }, [jogos, categoriaFiltro]);

  const totalJogosNaCategoria = jogosDaCategoria.length;

  // Competições disponíveis para o Filtro 2 (considerando a categoria selecionada, ordenadas por mais jogos)
  const competicoesDisponiveis = useMemo<Array<{ nome: string; count: number }>>(() => {
    const contagem: Record<string, number> = {};
    jogosDaCategoria.forEach((j) => {
      const nomeComp = j.tipo?.trim() || 'Amistoso';
      contagem[nomeComp] = (contagem[nomeComp] || 0) + 1;
    });

    return Object.entries(contagem)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .map(([nome, count]) => ({ nome, count }));
  }, [jogosDaCategoria]);

  // Se a competição selecionada não existir mais após troca de categoria, volta para 'TODAS'
  useEffect(() => {
    if (competicaoFiltro !== 'TODAS') {
      const existe = competicoesDisponiveis.some((c) => c.nome === competicaoFiltro);
      if (!existe) {
        setCompeticaoFiltro('TODAS');
      }
    }
  }, [competicoesDisponiveis, competicaoFiltro]);

  // Filtra jogos por categoria, competição e busca por adversário com regra estrita de ordenação por data e hora:
  // 1º) Jogos que ainda vão acontecer (mais próximo primeiro: ex 06/11 às 14:30, 06/11 às 15:50, 14/11...)
  // 2º) Jogos que já aconteceram / realizados (mais recente primeiro: ex 05/11, 28/10...)
  const jogosFiltrados = useMemo(() => {
    const filtrados = jogosDaCategoria.filter((j) => {
      const compNome = j.tipo?.trim() || 'Amistoso';
      const matchComp = competicaoFiltro === 'TODAS' || compNome === competicaoFiltro;
      const matchBusca =
        !buscaAdversario.trim() ||
        j.adversario.toLowerCase().includes(buscaAdversario.trim().toLowerCase());
      return matchComp && matchBusca;
    });
    return ordenarJogosAgenda(filtrados);
  }, [jogosDaCategoria, competicaoFiltro, buscaAdversario]);

  // Estado do acordeão: qual atleta está expandido no momento (null = todos fechados)
  const [atletaExpandidoId, setAtletaExpandidoId] = useState<string | null>(null);
  const [tecnica, setTecnica] = useState<number>(8.0);
  const [tatica, setTatica] = useState<number>(8.0);
  const [fisica, setFisica] = useState<number>(7.5);
  const [mental, setMental] = useState<number>(8.0);
  const [disciplinar, setDisciplinar] = useState<number>(9.0);

  const [obsFisica, setObsFisica] = useState('');
  const [obsTecnica, setObsTecnica] = useState('');
  const [obsTatica, setObsTatica] = useState('');
  const [obsMental, setObsMental] = useState('');
  const [obsDisciplinar, setObsDisciplinar] = useState('');

  // Minutos divididos em 1º e 2º Tempo
  const [minutos1Tempo, setMinutos1Tempo] = useState<number>(40);
  const [minutos2Tempo, setMinutos2Tempo] = useState<number>(40);

  // Posição e Estatísticas
  const [posicaoJogo, setPosicaoJogo] = useState<string>('Meia (10)');
  const [gols, setGols] = useState<number>(0);
  const [assistencias, setAssistencias] = useState<number>(0);
  const [cartoesAmarelos, setCartoesAmarelos] = useState<number>(0);
  const [cartaoVermelho, setCartaoVermelho] = useState<boolean>(false);

  // Pontos de Destaque e Atenção (seleção por toque)
  const [pontosFortes, setPontosFortes] = useState<string[]>([]);
  const [pontosMelhoria, setPontosMelhoria] = useState<string[]>([]);

  // Feedback de salvamento associado ao atleta específico
  const [feedbackSalvoAtletaId, setFeedbackSalvoAtletaId] = useState<string | null>(null);

  // =========================================================
  // LIGAÇÃO COM A ESCALAÇÃO:
  // Mostra SÓ os jogadores que foram selecionados na escalação daquele jogo,
  // ordenando titulares primeiro e reservas depois.
  // =========================================================
  const atletasDoJogo = useMemo(() => {
    if (!jogoSelecionadoParaAvaliar) return [];
    const escalacao = jogoSelecionadoParaAvaliar.escalacao || {};
    const idsEscalados = Object.keys(escalacao);

    if (idsEscalados.length > 0) {
      return atletas
        .filter((a) => idsEscalados.includes(a.id))
        .sort((a, b) => {
          const titA = escalacao[a.id]?.titular ? 0 : 1;
          const titB = escalacao[b.id]?.titular ? 0 : 1;
          if (titA !== titB) return titA - titB;
          const nomeA = (a.apelido || a.nome || '').trim();
          const nomeB = (b.apelido || b.nome || '').trim();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        });
    }

    // Fallback caso a escalação ainda não tenha sido montada
    return atletas
      .filter((a) => a.categoria === jogoSelecionadoParaAvaliar.categoria)
      .sort((a, b) => (a.apelido || a.nome).localeCompare(b.apelido || b.nome, 'pt-BR'));
  }, [jogoSelecionadoParaAvaliar, atletas]);

  // Carrega avaliação existente do atleta selecionado para este jogo específico
  const carregarAvaliacaoDoAtleta = (atletaId: string, jogo: JogoAgenda) => {
    const avExistente = encontrarAvaliacaoDoAtletaNoJogo(avaliacoes, atletaId, jogo);

    const escalacaoInfo = jogo.escalacao ? jogo.escalacao[atletaId] : null;
    const atletaObj = atletas.find((a) => a.id === atletaId);

    if (avExistente) {
      setTecnica(avExistente.notas.tecnica);
      setTatica(avExistente.notas.tatica);
      setFisica(avExistente.notas.fisica);
      setMental(avExistente.notas.mental);
      setDisciplinar(avExistente.notas.disciplinar);

      if (avExistente.minutos1Tempo !== undefined && avExistente.minutos2Tempo !== undefined) {
        setMinutos1Tempo(avExistente.minutos1Tempo);
        setMinutos2Tempo(avExistente.minutos2Tempo);
      } else {
        const total = avExistente.minutosJogados || 80;
        const metade = Math.floor(total / 2);
        setMinutos1Tempo(metade);
        setMinutos2Tempo(total - metade);
      }

      setPosicaoJogo(
        avExistente.posicaoJogo ||
          escalacaoInfo?.posicaoJogo ||
          (atletaObj ? atletaObj.posicao : 'Meia (10)')
      );
      setGols(avExistente.gols || 0);
      setAssistencias(avExistente.assistencias || 0);
      setCartoesAmarelos(avExistente.cartoesAmarelos || 0);
      setCartaoVermelho(Boolean(avExistente.cartaoVermelho));

      setPontosFortes(avExistente.pontosFortes || []);
      setPontosMelhoria(avExistente.pontosMelhoria || []);

      if (avExistente.observacoesPorPilar) {
        setObsFisica(avExistente.observacoesPorPilar.fisica || '');
        setObsTecnica(avExistente.observacoesPorPilar.tecnica || '');
        setObsTatica(avExistente.observacoesPorPilar.tatica || '');
        setObsMental(avExistente.observacoesPorPilar.mental || '');
        setObsDisciplinar(avExistente.observacoesPorPilar.disciplinar || '');
      } else {
        const obsTexto = avExistente.observacoes || '';
        const matchFis = obsTexto.match(/\[FÍSICO\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);
        const matchTec = obsTexto.match(/\[TÉCNICO\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);
        const matchTat = obsTexto.match(/\[TÁTICO\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);
        const matchMen = obsTexto.match(/\[MENTAL\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);
        const matchDis = obsTexto.match(/\[DISCIPLINAR\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);

        setObsFisica(matchFis ? matchFis[1].trim() : '');
        setObsTecnica(matchTec ? matchTec[1].trim() : obsTexto);
        setObsTatica(matchTat ? matchTat[1].trim() : '');
        setObsMental(matchMen ? matchMen[1].trim() : '');
        setObsDisciplinar(matchDis ? matchDis[1].trim() : '');
      }
    } else {
      setTecnica(8.0);
      setTatica(8.0);
      setFisica(7.5);
      setMental(8.0);
      setDisciplinar(9.0);
      setMinutos1Tempo(40);
      setMinutos2Tempo(40);
      setPosicaoJogo(escalacaoInfo?.posicaoJogo || (atletaObj ? atletaObj.posicao : 'Meia (10)'));
      setGols(0);
      setAssistencias(0);
      setCartoesAmarelos(0);
      setCartaoVermelho(false);
      setPontosFortes([]);
      setPontosMelhoria([]);
      setObsFisica('');
      setObsTecnica('');
      setObsTatica('');
      setObsMental('');
      setObsDisciplinar('');
    }
  };

  const handleAbrirAvaliacaoJogo = (jogo: JogoAgenda, abrirEmModoLeitura = false) => {
    scrollAntesAvaliacaoRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    ultimoJogoAbertoIdRef.current = jogo.id;

    setJogoSelecionadoId(jogo.id);
    setJogoFallbackAberto(jogo);
    setModoLeitura(abrirEmModoLeitura || Boolean(jogo.realizado));
    // Começa com todos os cartões fechados (null)
    setAtletaExpandidoId(null);
    setFeedbackSalvoAtletaId(null);

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    });
  };

  const handleFecharAvaliacao = () => {
    const jogoId = ultimoJogoAbertoIdRef.current;
    const savedY = scrollAntesAvaliacaoRef.current;
    setJogoSelecionadoId(null);
    setJogoFallbackAberto(null);
    setAtletaExpandidoId(null);
    setFeedbackSalvoAtletaId(null);
    setModoLeitura(false);

    requestAnimationFrame(() => {
      if (jogoId) {
        const card = document.getElementById(`card-jogo-${jogoId}`);
        if (card) {
          card.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
          return;
        }
      }
      if (savedY !== undefined) {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    });
  };

  // Regra do acordeão:
  // - Só 1 atleta aberto por vez; clicar em outro fecha o atual e abre o novo
  // - Clicar no mesmo atleta que já está aberto fecha ele
  const handleToggleAtletaCard = (atletaId: string) => {
    if (!jogoSelecionadoParaAvaliar) return;
    if (atletaExpandidoId === atletaId) {
      setAtletaExpandidoId(null);
      setFeedbackSalvoAtletaId(null);
      return;
    }
    carregarAvaliacaoDoAtleta(atletaId, jogoSelecionadoParaAvaliar);
    setAtletaExpandidoId(atletaId);
    setFeedbackSalvoAtletaId(null);
  };

  // Toggle de tags sem limite máximo (selecionar quantos quiser)
  const togglePontoDestaque = (tag: string) => {
    if (modoLeitura) return;
    setPontosFortes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const togglePontoAtencao = (tag: string) => {
    if (modoLeitura) return;
    setPontosMelhoria((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSalvarAvaliacaoJogador = (atletaAlvo: Atleta) => {
    if (modoLeitura) return;
    if (!jogoSelecionadoParaAvaliar || !atletaAlvo) return;

    const notasObj: NotasPilares = {
      tecnica: Number(tecnica),
      tatica: Number(tatica),
      fisica: Number(fisica),
      mental: Number(mental),
      disciplinar: Number(disciplinar),
    };

    const partesObs: string[] = [];
    if (obsFisica.trim()) partesObs.push(`[FÍSICO]: ${obsFisica.trim()}`);
    if (obsTecnica.trim()) partesObs.push(`[TÉCNICO]: ${obsTecnica.trim()}`);
    if (obsTatica.trim()) partesObs.push(`[TÁTICO]: ${obsTatica.trim()}`);
    if (obsMental.trim()) partesObs.push(`[MENTAL]: ${obsMental.trim()}`);
    if (obsDisciplinar.trim()) partesObs.push(`[DISCIPLINAR]: ${obsDisciplinar.trim()}`);

    const textoObservacoesFinal =
      partesObs.length > 0 ? partesObs.join('\n\n') : 'Atuação avaliada pela comissão técnica.';

    const notaGeral = Number(((tecnica + tatica + fisica + mental + disciplinar) / 5).toFixed(1));

    const avExistente = encontrarAvaliacaoDoAtletaNoJogo(
      avaliacoes,
      atletaAlvo.id,
      jogoSelecionadoParaAvaliar
    );

    const escaladoInfo = jogoSelecionadoParaAvaliar.escalacao
      ? jogoSelecionadoParaAvaliar.escalacao[atletaAlvo.id]
      : null;

    const totalMinutos = (Number(minutos1Tempo) || 0) + (Number(minutos2Tempo) || 0);
    const idDeterministico = `av-${jogoSelecionadoParaAvaliar.id}-${atletaAlvo.id}`.replace(
      /[^a-zA-Z0-9_-]/g,
      '-'
    );

    const novaAvaliacao: AvaliacaoJogo = {
      id: avExistente ? avExistente.id : idDeterministico,
      atletaId: atletaAlvo.id,
      categoria: atletaAlvo.categoria,
      dataJogo: jogoSelecionadoParaAvaliar.dataJogo,
      adversario: jogoSelecionadoParaAvaliar.adversario,
      competicao: jogoSelecionadoParaAvaliar.tipo || 'Campeonato',
      minutos1Tempo: Number(minutos1Tempo) || 0,
      minutos2Tempo: Number(minutos2Tempo) || 0,
      minutosJogados: totalMinutos,
      resultado: jogoSelecionadoParaAvaliar.placar || undefined,
      titular: escaladoInfo ? escaladoInfo.titular : true,
      posicaoJogo: posicaoJogo || atletaAlvo.posicao || 'Meia (10)',
      gols: Number(gols) || 0,
      assistencias: Number(assistencias) || 0,
      cartoesAmarelos: Number(cartoesAmarelos) || 0,
      cartaoVermelho: Boolean(cartaoVermelho),
      notas: notasObj,
      notaGeral,
      observacoes: textoObservacoesFinal,
      observacoesPorPilar: {
        fisica: obsFisica.trim(),
        tecnica: obsTecnica.trim(),
        tatica: obsTatica.trim(),
        mental: obsMental.trim(),
        disciplinar: obsDisciplinar.trim(),
      },
      pontosFortes,
      pontosMelhoria,
      jogoAgendaId: jogoSelecionadoParaAvaliar.id,
      avaliador: 'Comissão Técnica',
    };

    onSalvarAvaliacao(novaAvaliacao);
    setFeedbackSalvoAtletaId(atletaAlvo.id);
  };

  // Selo de status de escalação no card do jogo
  const renderStatusEscalacao = (jogo: JogoAgenda) => {
    const escalacao = jogo.escalacao || {};
    const items = Object.values(escalacao);
    const titulares = items.filter((e) => e.titular).length;
    const reservas = items.length - titulares;
    const pronta = titulares === 11;

    return (
      <div className="space-y-1">
        {pronta ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Escalação pronta</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Escalação pendente</span>
          </span>
        )}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {titulares === 0 && reservas === 0
            ? '0 titulares • 0 reservas'
            : `${titulares} titulares definidos • ${reservas} reservas`}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDERIZAÇÃO 1: DENTRO DE CADA JOGO - AVALIAÇÃO DA PARTIDA (LISTA VERTICAL EXPANSÍVEL)
  // ==========================================
  if (jogoSelecionadoParaAvaliar) {
    const minutosTotaisSomados = (Number(minutos1Tempo) || 0) + (Number(minutos2Tempo) || 0);
    const adversarioLimpo =
      (jogoSelecionadoParaAvaliar.adversario || '').replace(/^vs\s+/i, '').trim() || 'Adversário';
    const mediaGeralAtual = ((tecnica + tatica + fisica + mental + disciplinar) / 5).toFixed(1);
    const totalEscaladosJogo = Object.keys(jogoSelecionadoParaAvaliar.escalacao || {}).length;
    const qtdAvaliadosNesteJogo = atletasDoJogo.filter((atl) =>
      Boolean(encontrarAvaliacaoDoAtletaNoJogo(avaliacoes, atl.id, jogoSelecionadoParaAvaliar))
    ).length;

    const opcoesPosicao = Array.from(
      new Set<string>([...POSICOES_JOGO, ...(posicaoJogo ? [posicaoJogo] : [])])
    );

    return (
      <div className="space-y-4 pb-[120px] w-full max-w-full overflow-x-hidden box-border">
        {/* Barra Superior de Retorno */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFecharAvaliacao}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Jogos</span>
            </button>

            <button
              type="button"
              onClick={() => setJogoParaEstrategia(jogoSelecionadoParaAvaliar)}
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-white rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer"
              title="Visualizar Estratégia de Jogo e Campinho"
            >
              <Shield className="w-3.5 h-3.5 text-white" />
              <span>Estratégia de Jogo</span>
            </button>

            <button
              type="button"
              onClick={() => setJogoParaSumula(jogoSelecionadoParaAvaliar)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-slate-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 rounded-xl shadow-xs transition cursor-pointer"
              title="Visualizar e Imprimir Súmula para Arbitragem"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>Súmula</span>
            </button>

            {modoLeitura ? (
              <button
                type="button"
                onClick={() => setModoLeitura(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer"
                title="Habilitar edição desta avaliação"
              >
                <Edit className="w-4 h-4 text-amber-300" />
                <span>Editar avaliação</span>
              </button>
            ) : (
              jogoSelecionadoParaAvaliar.realizado && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Modo de edição ativo</span>
                </span>
              )
            )}
          </div>

          <ModalEstrategiaJogo
            isOpen={Boolean(jogoParaEstrategia)}
            onClose={() => setJogoParaEstrategia(null)}
            jogo={jogoParaEstrategia}
            atletas={atletas}
            escalacaoMap={jogoParaEstrategia?.escalacao || {}}
            formacao={jogoParaEstrategia?.formacao}
          />
          <ModalSumulaArbitragem
            isOpen={Boolean(jogoParaSumula)}
            onClose={() => setJogoParaSumula(null)}
            jogo={jogoParaSumula}
            atletas={atletas}
            escalacaoMap={jogoParaSumula?.escalacao || {}}
          />

          <div className="flex items-center gap-2">
            {modoLeitura && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                <span>🔒 Modo Leitura</span>
              </span>
            )}
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {jogoSelecionadoParaAvaliar.categoria}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
              <span>🏟️</span>
              <span>{jogoSelecionadoParaAvaliar.tipo}</span>
            </span>
          </div>
        </div>

        {/* CABEÇALHO NO TOPO PUXANDO OS DADOS DO JOGO ABERTO */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-blue-700">
          <div className="flex items-center gap-3.5">
            <MasterSoccerEscudo size={46} className="drop-shadow-sm shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-blue-200 font-extrabold">
                  AVALIAÇÃO DA PARTIDA
                </span>
                {jogoSelecionadoParaAvaliar.placar && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                    Placar: {jogoSelecionadoParaAvaliar.placar}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white mt-0.5 break-words">
                Master Soccer vs {adversarioLimpo}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-blue-100 mt-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <span>{jogoSelecionadoParaAvaliar.realizado ? '✅' : '🗓️'}</span>
                  {formatarDataExibicao(jogoSelecionadoParaAvaliar.dataJogo)}
                  {jogoSelecionadoParaAvaliar.hora ? ` às ${jogoSelecionadoParaAvaliar.hora}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  {jogoSelecionadoParaAvaliar.local || 'Local a definir'}
                </span>
                <span className="font-bold text-amber-300 inline-flex items-center gap-1">
                  <span>{jogoSelecionadoParaAvaliar.categoria} ·</span>
                  <span>🏟️</span>
                  <span>{jogoSelecionadoParaAvaliar.tipo || 'Competição'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TÍTULO DA LISTA DE ATLETAS ESCALADOS */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              AVALIAÇÃO DA PARTIDA - JOGADORES ESCALADOS ({atletasDoJogo.length} ATLETAS)
            </span>
          </h3>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
            {qtdAvaliadosNesteJogo} / {atletasDoJogo.length} salvos
          </span>
        </div>

        {totalEscaladosJogo === 0 && atletasDoJogo.length > 0 && (
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <span>
              Este jogo ainda não possui escalação salva — exibindo atletas da categoria{' '}
              <strong>{jogoSelecionadoParaAvaliar.categoria}</strong>.
            </span>
            {onNavegarEscalacao && (
              <button
                type="button"
                onClick={() => onNavegarEscalacao(jogoSelecionadoParaAvaliar.id)}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] cursor-pointer"
              >
                Montar Escalação
              </button>
            )}
          </div>
        )}

        {/* LISTA VERTICAL EXPANSÍVEL (UM EMBAIXO DO OUTRO, SEM ABINHAS HORIZONTAIS) */}
        {atletasDoJogo.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs space-y-3">
            <p>Nenhum atleta escalado para este jogo ainda.</p>
            {onNavegarEscalacao && (
              <button
                type="button"
                onClick={() => onNavegarEscalacao(jogoSelecionadoParaAvaliar.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Montar Escalação do Jogo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {atletasDoJogo.map((atl) => {
              const aberto = atletaExpandidoId === atl.id;
              const avSalva = encontrarAvaliacaoDoAtletaNoJogo(
                avaliacoes,
                atl.id,
                jogoSelecionadoParaAvaliar
              );
              const jaSalvo = Boolean(avSalva);
              const escaladoInfo = jogoSelecionadoParaAvaliar.escalacao
                ? jogoSelecionadoParaAvaliar.escalacao[atl.id]
                : undefined;
              const apelidoExibicao = atl.apelido?.trim() || atl.nome.split(' ')[0];
              const funcaoBadge = escaladoInfo
                ? escaladoInfo.titular
                  ? '(Tit)'
                  : '(Res)'
                : '';

              return (
                <div
                  key={atl.id}
                  className={`w-full rounded-2xl border transition-all overflow-hidden ${
                    aberto
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400'
                  }`}
                >
                  {/* CABEÇALHO DO CARTÃO DO ATLETA (FECHADO NO INÍCIO) */}
                  <button
                    type="button"
                    onClick={() => handleToggleAtletaCard(atl.id)}
                    className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      aberto
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {apelidoExibicao}
                      </span>
                      {funcaoBadge && (
                        <span
                          className={`text-xs font-bold ${
                            escaladoInfo?.titular
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {funcaoBadge}
                        </span>
                      )}
                      {jaSalvo && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                          ✓ Salvo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {jaSalvo && !aberto && avSalva && (
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {avSalva.notaGeral.toFixed(1)}
                        </span>
                      )}
                      {aberto ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* CONTEÚDO EXPANDIDO DO ATLETA (ABRE ALI MESMO NA MESMA TELA) */}
                  {aberto && (
                    <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-150">
                      {/* Nome completo, Posição Original, Média Geral */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-sm text-blue-700 dark:text-blue-300 overflow-hidden shrink-0">
                            {atl.fotoUrl ? (
                              <img
                                src={atl.fotoUrl}
                                alt={atl.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              obterIniciaisApelido(atl)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white break-words">
                              {atl.nomeCompleto || atl.nome}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Posição Original:{' '}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {atl.posicao}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-right shrink-0">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                            Média Geral
                          </span>
                          <span className="text-base font-mono font-black text-blue-700 dark:text-blue-300">
                            {mediaGeralAtual} / 10
                          </span>
                        </div>
                      </div>

                      {feedbackSalvoAtletaId === atl.id && (
                        <div className="p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            ✓ Avaliação de {apelidoExibicao} salva para este jogo!
                          </span>
                        </div>
                      )}

                      {/* Tempo de Jogo: 1º Tempo (- / + min), 2º Tempo (- / + min), Total Automático */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>Tempo de Jogo:</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* 1º Tempo */}
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              1º Tempo:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setMinutos1Tempo((prev) => Math.max(0, prev - 5))}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base text-slate-700 dark:text-slate-200 flex items-center justify-center transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="60"
                                disabled={modoLeitura}
                                value={minutos1Tempo}
                                onChange={(e) =>
                                  setMinutos1Tempo(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                                }
                                className="w-12 h-8 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none disabled:opacity-60"
                              />
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setMinutos1Tempo((prev) => Math.min(60, prev + 5))}
                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-base flex items-center justify-center transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                              <span className="text-xs text-slate-500 font-semibold ml-0.5">min</span>
                            </div>
                          </div>

                          {/* 2º Tempo */}
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              2º Tempo:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setMinutos2Tempo((prev) => Math.max(0, prev - 5))}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base text-slate-700 dark:text-slate-200 flex items-center justify-center transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="60"
                                disabled={modoLeitura}
                                value={minutos2Tempo}
                                onChange={(e) =>
                                  setMinutos2Tempo(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                                }
                                className="w-12 h-8 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none disabled:opacity-60"
                              />
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setMinutos2Tempo((prev) => Math.min(60, prev + 5))}
                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-base flex items-center justify-center transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                              <span className="text-xs text-slate-500 font-semibold ml-0.5">min</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500 font-medium">
                            Total automático:
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                            {minutosTotaisSomados} min
                          </span>
                        </div>
                      </div>

                      {/* Jogou de + Gols / Assistências / Cartões */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            <span>Jogou de:</span>
                          </label>
                          <select
                            value={posicaoJogo}
                            disabled={modoLeitura}
                            onChange={(e) => setPosicaoJogo(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
                          >
                            {opcoesPosicao.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Gols */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                              ⚽ Gols
                            </span>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setGols((prev) => Math.max(0, prev - 1))}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="w-7 font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {gols}
                              </span>
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setGols((prev) => prev + 1)}
                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Assistências */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                              🎯 Assistências
                            </span>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setAssistencias((prev) => Math.max(0, prev - 1))}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="w-7 font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {assistencias}
                              </span>
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setAssistencias((prev) => prev + 1)}
                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Cartões Amarelos */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1.5">
                              🟨 Amarelo
                            </span>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setCartoesAmarelos((prev) => Math.max(0, prev - 1))}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="w-7 font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {cartoesAmarelos}
                              </span>
                              <button
                                type="button"
                                disabled={modoLeitura}
                                onClick={() => setCartoesAmarelos((prev) => Math.min(2, prev + 1))}
                                className="w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Cartão Vermelho */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1.5">
                              🟥 Vermelho
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none">
                              <input
                                type="checkbox"
                                disabled={modoLeitura}
                                checked={cartaoVermelho}
                                onChange={(e) => setCartaoVermelho(e.target.checked)}
                                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer disabled:opacity-40"
                              />
                              <span className={cartaoVermelho ? 'text-rose-600' : 'text-slate-400'}>
                                {cartaoVermelho ? 'Expulso' : 'Não'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Os 5 Quesitos de Avaliação */}
                      <div className="space-y-3">
                        {[
                          {
                            id: 'fisica',
                            icone: '⚡',
                            titulo: 'FÍSICO',
                            valor: fisica,
                            setter: setFisica,
                            obs: obsFisica,
                            obsSetter: setObsFisica,
                            placeholder: 'Observação do Físico...',
                          },
                          {
                            id: 'tecnica',
                            icone: '⚽',
                            titulo: 'TÉCNICO',
                            valor: tecnica,
                            setter: setTecnica,
                            obs: obsTecnica,
                            obsSetter: setObsTecnica,
                            placeholder: 'Observação do Técnico...',
                          },
                          {
                            id: 'tatica',
                            icone: '🧠',
                            titulo: 'TÁTICO',
                            valor: tatica,
                            setter: setTatica,
                            obs: obsTatica,
                            obsSetter: setObsTatica,
                            placeholder: 'Observação do Tático...',
                          },
                          {
                            id: 'mental',
                            icone: '🎯',
                            titulo: 'MENTAL',
                            valor: mental,
                            setter: setMental,
                            obs: obsMental,
                            obsSetter: setObsMental,
                            placeholder: 'Observação do Mental...',
                          },
                          {
                            id: 'disciplinar',
                            icone: '🛡️',
                            titulo: 'DISCIPLINAR',
                            valor: disciplinar,
                            setter: setDisciplinar,
                            obs: obsDisciplinar,
                            obsSetter: setObsDisciplinar,
                            placeholder: 'Observação do Disciplinar...',
                          },
                        ].map((q) => (
                          <div
                            key={q.id}
                            style={{
                              padding: 14,
                              borderRadius: 12,
                              border: '1px solid #e5e7eb',
                              background: modoLeitura ? '#f1f5f9' : '#f9fafb',
                            }}
                            className="dark:bg-slate-800/60 dark:border-slate-800"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{q.icone}</span> {q.titulo}
                              </span>
                              <span
                                style={{ color: modoLeitura ? '#64748b' : '#2563eb' }}
                                className="text-sm font-bold"
                              >
                                Nota: {Math.round(q.valor)}/10 - {tituloNota(q.valor)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              step="0.5"
                              value={q.valor}
                              disabled={modoLeitura}
                              onChange={(e) => q.setter(parseFloat(e.target.value))}
                              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                              style={{
                                accentColor: modoLeitura ? '#94a3b8' : '#2563eb',
                                opacity: modoLeitura ? 0.45 : 1,
                                cursor: modoLeitura ? 'not-allowed' : 'pointer',
                              }}
                            />
                            <textarea
                              readOnly={modoLeitura}
                              disabled={modoLeitura}
                              value={q.obs}
                              onChange={(e) => q.obsSetter(e.target.value)}
                              placeholder={q.placeholder}
                              style={{
                                height: '100px',
                                resize: 'none',
                                fontSize: '15px',
                                background: modoLeitura ? '#e2e8f0' : undefined,
                                color: modoLeitura ? '#475569' : undefined,
                                cursor: modoLeitura ? 'not-allowed' : undefined,
                              }}
                              className="w-full mt-2.5 p-3 leading-relaxed font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Pontos Positivos e Pontos de Atenção */}
                      <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="p-3.5 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#15803D] dark:text-emerald-300 flex items-center gap-1.5">
                              <span>✅</span> PONTOS POSITIVOS
                            </label>
                            {pontosFortes.length > 0 && (
                              <span className="text-[11px] font-bold text-[#15803D] dark:text-emerald-400">
                                {pontosFortes.length} selecionados
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {TAGS_DESTAQUE_DISPONIVEIS.map((tag) => {
                              const ativo = pontosFortes.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  disabled={modoLeitura}
                                  onClick={() => togglePontoDestaque(tag)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    ativo
                                      ? 'shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                                  } ${modoLeitura ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                  style={
                                    ativo
                                      ? {
                                          backgroundColor: '#16A34A',
                                          color: '#ffffff',
                                          border: '1px solid #15803D',
                                          fontWeight: 700,
                                        }
                                      : {}
                                  }
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FEFCE8] dark:bg-amber-950/30 border border-[#FEF08A] dark:border-amber-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#713F12] dark:text-amber-200 flex items-center gap-1.5">
                              <span>⚠️</span> PONTOS DE ATENÇÃO / APRIMORAMENTO
                            </label>
                            {pontosMelhoria.length > 0 && (
                              <span className="text-[11px] font-bold text-[#713F12] dark:text-amber-300">
                                {pontosMelhoria.length} selecionados
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {TAGS_ATENCAO_DISPONIVEIS.map((tag) => {
                              const ativo = pontosMelhoria.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  disabled={modoLeitura}
                                  onClick={() => togglePontoAtencao(tag)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    ativo
                                      ? 'shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                                  } ${modoLeitura ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                  style={
                                    ativo
                                      ? {
                                          backgroundColor: '#FACC15',
                                          color: '#713F12',
                                          border: '1px solid #EAB308',
                                          fontWeight: 700,
                                        }
                                      : {}
                                  }
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Botão Verde no Final: [ Salvar Avaliação deste Atleta ] */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={modoLeitura}
                          onClick={() => handleSalvarAvaliacaoJogador(atl)}
                          style={{
                            backgroundColor: modoLeitura ? '#94a3b8' : '#059669',
                            color: '#ffffff',
                          }}
                          className="w-full py-3.5 px-5 rounded-xl text-sm font-black text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                          <span>
                            {modoLeitura
                              ? 'Modo Leitura (Toque em Editar avaliação no topo)'
                              : 'Salvar Avaliação deste Atleta'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO DO CARD DE JOGO (PADRÃO UNIFICADO)
  // ==========================================
  const renderCardJogo = (jogo: JogoAgenda) => {
    // 1. Jogo Finalizado (Card cinza com placar grande + botão vermelho [Excluir] e [Ver avaliação >])
    if (jogo.realizado) {
      const nomeAdv = jogo.adversario.replace(/^vs\s*/i, '').trim();
      const placarExibicao = jogo.placar
        ? `Master ${jogo.placar} ${nomeAdv}`
        : `Master Soccer vs ${nomeAdv}`;
      const dataAmigavel = formatarDataAmigavelJogo(jogo.dataJogo, jogo.hora);

      const idsAtletas = Array.from(
        new Set(
          avaliacoes
            .filter((av) => Boolean(encontrarAvaliacaoDoAtletaNoJogo([av], av.atletaId, jogo)))
            .map((av) => av.atletaId)
        )
      );
      const totalAvsDoJogo = idsAtletas.length;

      return (
        <div
          id={`card-jogo-${jogo.id}`}
          key={jogo.id}
          className="bg-gray-50 dark:bg-slate-850 rounded-2xl border border-slate-300 dark:border-slate-700 p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between gap-3 group"
        >
          <div className="space-y-2">
            {/* Topo do card: Categoria à esquerda + selo verde ✅ Jogo Realizado ao lado, e competição com estádio 🏟️ à direita */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {jogo.categoria}
                </span>
                <span className="bg-green-100 text-green-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                  <span>✅</span>
                  <span>Jogo Realizado</span>
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
                <span>🏟️</span>
                <span>{jogo.tipo}</span>
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {placarExibicao}
            </h4>

            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5 font-mono font-semibold">
                <span className="shrink-0">✅</span>
                <span>{dataAmigavel}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Resultado final</span>
              </div>
              {jogo.local && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{jogo.local}</span>
                </div>
              )}
              <div className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] pt-0.5">
                {totalAvsDoJogo} {totalAvsDoJogo === 1 ? 'atleta avaliado' : 'atletas avaliados'}
              </div>
            </div>

            <div className="pt-1">{renderStatusEscalacao(jogo)}</div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onExcluirJogo(jogo.id, placarExibicao)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition active:scale-98 cursor-pointer"
              title="Excluir este jogo, escalação e avaliações"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>

            <button
              type="button"
              onClick={() => handleAbrirAvaliacaoJogo(jogo, true)}
              style={{ backgroundColor: '#2563eb' }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white hover:bg-blue-700 active:scale-98 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Ver avaliação &gt;</span>
            </button>
          </div>
        </div>
      );
    }

    // 2. Jogo Não Realizado / Próximo Jogo (agendinha 🗓️ só aqui + selo competição com estádio 🏟️)
    const dataAmigavel = formatarDataAmigavelJogo(jogo.dataJogo, jogo.hora);

    return (
      <div
        id={`card-jogo-${jogo.id}`}
        key={jogo.id}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3 group"
      >
        <div>
          {/* Linha 1: selo azul categoria + agendinha 🗓️ Próximo Jogo à esquerda, selo competição com estádio 🏟️ à direita */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {jogo.categoria}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                <span>🗓️</span>
                <span>Próximo Jogo</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
              <span>🏟️</span>
              <span>{jogo.tipo}</span>
            </span>
          </div>

          {/* Linha 2: vs Magé em negrito */}
          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {jogo.adversario}
          </h4>

          {/* Linha 3 & 4: selo Escalação pendente em laranja, ou Escalação pronta em verde + 0 titulares • 0 reservas */}
          <div className="mt-2.5 space-y-1">{renderStatusEscalacao(jogo)}</div>

          {/* Linha 5: data com agendinha 🗓️ + local */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2.5">
            <div className="flex items-center gap-1.5 font-mono font-semibold">
              <span className="shrink-0">🗓️</span>
              <span>{dataAmigavel}</span>
            </div>
            {jogo.local && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{jogo.local}</span>
              </div>
            )}
          </div>
        </div>

        {/* Linha 6: botões [Editar] [Escalação] [Estratégia de Jogo] [Súmula] [Avaliar >] (+ Excluir) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                ultimoJogoAbertoIdRef.current = jogo.id;
                onEditarJogo(jogo);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition cursor-pointer"
              title="Editar data, hora, adversário e local"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar</span>
            </button>

            {onNavegarEscalacao && (
              <button
                type="button"
                onClick={() => {
                  ultimoJogoAbertoIdRef.current = jogo.id;
                  onNavegarEscalacao(jogo.id);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800 flex items-center gap-1 transition cursor-pointer"
                title="Montar escalação do jogo"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Escalação</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setJogoParaEstrategia(jogo)}
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-95 flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Visualizar Estratégia de Jogo (Formação, Titulares, Reservas e Campinho)"
            >
              <Shield className="w-3.5 h-3.5 text-white" />
              <span>Estratégia de Jogo</span>
            </button>

            <button
              type="button"
              onClick={() => setJogoParaSumula(jogo)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Visualizar e Imprimir Súmula Oficial para Arbitragem"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>Súmula</span>
            </button>

            <button
              type="button"
              onClick={() => onExcluirJogo(jogo.id, `${jogo.adversario} (${jogo.categoria})`)}
              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Excluir este jogo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleAbrirAvaliacaoJogo(jogo, false)}
            style={{ backgroundColor: '#2563eb' }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white hover:bg-blue-700 active:scale-98 transition flex items-center gap-1 shadow-xs cursor-pointer"
            title="Avaliar os jogadores desta partida"
          >
            <span>Avaliar &gt;</span>
          </button>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDERIZAÇÃO 2: LISTA DE JOGOS DA AGENDA
  // ==========================================
  return (
    <div className="space-y-6 pb-[120px] w-full max-w-full box-border">
      {/* 1) TOPO DA PÁGINA: Título Agenda de Jogos, subtítulo e botão azul [+ Novo Jogo] em largura total */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Agenda de Jogos
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {jogos.length} no calendário
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastre os jogos na agenda, monte a escalação e avalie os atletas diretamente dentro de cada partida
          </p>
        </div>

        {/* Botão azul [+ Novo Jogo] em largura total */}
        <button
          onClick={onNovoJogo}
          style={{ backgroundColor: '#2563eb' }}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer border border-blue-500/40"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Novo Jogo</span>
        </button>
      </div>

      {/* 2) FILTRO 1 - POR CATEGORIA - EM BOTÕES QUE QUEBRAM DE LINHA (GRID 2 COLUNAS) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleTrocarCategoriaFiltro('TODAS')}
          className={`w-full py-2.5 px-3 rounded-xl text-[13px] font-semibold text-center transition-all cursor-pointer shadow-xs ${
            categoriaFiltro === 'TODAS'
              ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Todos os Jogos ({jogos.length})
        </button>
        {categoriasFiltroLista.map((cat) => {
          const count = jogos.filter((j) => j.categoria === cat).length;
          const ativo = categoriaFiltro === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleTrocarCategoriaFiltro(cat)}
              className={`w-full py-2.5 px-3 rounded-xl text-[13px] font-semibold text-center transition-all cursor-pointer shadow-xs ${
                ativo
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 3) FILTRO 2 - POR COMPETIÇÃO - EM BOTÕES QUE QUEBRAM DE LINHA (GRID 2 COLUNAS) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-0.5">
          <span>🏟️</span>
          <span>Competição</span>
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Botão [Todas] */}
          <button
            type="button"
            onClick={() => handleTrocarCompeticaoFiltro('TODAS')}
            className={`w-full py-2.5 px-3 rounded-xl text-[13px] font-semibold text-center transition-all cursor-pointer shadow-xs flex items-center justify-center break-words leading-tight whitespace-normal min-h-[46px] ${
              competicaoFiltro === 'TODAS'
                ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Todas ({totalJogosNaCategoria})
          </button>

          {/* Botões de cada competição ordenada por quantidade, da maior para a menor */}
          {competicoesDisponiveis.map((comp) => {
            const ativo = competicaoFiltro === comp.nome;
            return (
              <button
                key={comp.nome}
                type="button"
                onClick={() => handleTrocarCompeticaoFiltro(comp.nome)}
                className={`w-full py-2.5 px-3 rounded-xl text-[13px] font-semibold text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 break-words leading-tight whitespace-normal min-h-[46px] ${
                  ativo
                    ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>🏟️ {comp.nome} ({comp.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4) CAMPO DE BUSCA DE ADVERSÁRIO EM LARGURA TOTAL */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={buscaAdversario}
          onChange={(e) => setBuscaAdversario(e.target.value)}
          placeholder="Buscar adversário..."
          className="w-full h-11 pl-10 pr-16 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
        />
        {buscaAdversario && (
          <button
            type="button"
            onClick={() => setBuscaAdversario('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* 5) LISTA DE JOGOS SEPARADA EM PRÓXIMOS JOGOS (🗓️) E JOGOS QUE JÁ ACONTECERAM (✅) */}
      {(() => {
        const proximosJogosFiltrados = jogosFiltrados.filter((j) => !j.realizado);
        const jogosRealizadosFiltrados = jogosFiltrados.filter((j) => Boolean(j.realizado));

        const cabecalhoCompeticao =
          competicaoFiltro !== 'TODAS' ? (
            (() => {
              const pendentes = proximosJogosFiltrados.filter((j) => {
                const escalacao = j.escalacao || {};
                const titulares = Object.values(escalacao).filter((e) => e.titular).length;
                return titulares < 11;
              }).length;

              return (
                <div className="flex flex-wrap items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none shrink-0">🏟️</span>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {competicaoFiltro} ({jogosFiltrados.length})
                    </h3>
                  </div>
                  <div className="text-xs font-bold">
                    {pendentes === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        • Tudo pronto
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                        • {pendentes} com escalação pendente
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : null;

        if (jogosFiltrados.length === 0) {
          return (
            <div className="space-y-3">
              {cabecalhoCompeticao}
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
                {buscaAdversario
                  ? `Nenhum jogo encontrado para "${buscaAdversario}"${
                      competicaoFiltro !== 'TODAS' ? ` em ${competicaoFiltro}` : ''
                    }.`
                  : competicaoFiltro !== 'TODAS'
                  ? `Nenhum jogo cadastrado na competição ${competicaoFiltro}.`
                  : 'Nenhum jogo cadastrado neste filtro. Clique em "+ Novo Jogo" para adicionar.'}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {cabecalhoCompeticao}

            {/* Seção 1: PRÓXIMOS JOGOS — ícone agendinha 🗓️ */}
            {proximosJogosFiltrados.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-base leading-none">🗓️</span>
                    <span>PRÓXIMOS JOGOS ({proximosJogosFiltrados.length})</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {proximosJogosFiltrados.map((jogo) => renderCardJogo(jogo))}
                </div>
              </div>
            )}

            {/* Seção 2: JOGOS QUE JÁ ACONTECERAM — selo check ✅ */}
            {jogosRealizadosFiltrados.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-base leading-none">✅</span>
                    <span>JOGOS QUE JÁ ACONTECERAM ({jogosRealizadosFiltrados.length})</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {jogosRealizadosFiltrados.map((jogo) => renderCardJogo(jogo))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modais Somente Leitura de Estratégia de Jogo e Súmula para Arbitragem */}
      <ModalEstrategiaJogo
        isOpen={Boolean(jogoParaEstrategia)}
        onClose={() => setJogoParaEstrategia(null)}
        jogo={jogoParaEstrategia}
        atletas={atletas}
        escalacaoMap={jogoParaEstrategia?.escalacao || {}}
        formacao={jogoParaEstrategia?.formacao}
      />
      <ModalSumulaArbitragem
        isOpen={Boolean(jogoParaSumula)}
        onClose={() => setJogoParaSumula(null)}
        jogo={jogoParaSumula}
        atletas={atletas}
        escalacaoMap={jogoParaSumula?.escalacao || {}}
      />
    </div>
  );
};
