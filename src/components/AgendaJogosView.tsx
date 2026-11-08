import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Award,
  ChevronRight,
  ArrowLeft,
  Users,
  AlertCircle,
  Sliders,
  Shield,
  Activity,
  Flame,
  Info,
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
import { formatarDataExibicao, dataParaValorOrdenacao } from '../utils/dateUtils';
import { tituloNota } from '../utils/avaliacaoUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';

interface AgendaJogosViewProps {
  jogos: JogoAgenda[];
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  onNovoJogo: () => void;
  onEditarJogo: (jogo: JogoAgenda) => void;
  onExcluirJogo: (id: string, nome?: string) => void;
  onSalvarAvaliacao: (avaliacao: AvaliacaoJogo) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
  onNavegarEscalacao?: (jogoId: string) => void;
}

export const AgendaJogosView: React.FC<AgendaJogosViewProps> = ({
  jogos,
  atletas,
  avaliacoes,
  categorias,
  onNovoJogo,
  onEditarJogo,
  onExcluirJogo,
  onSalvarAvaliacao,
  onSelecionarAtleta,
  onNavegarEscalacao,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [jogoSelecionadoParaAvaliar, setJogoSelecionadoParaAvaliar] = useState<JogoAgenda | null>(null);

  // Estados para o formulário de avaliação do jogador selecionado
  const [atletaIndexAtivo, setAtletaIndexAtivo] = useState<number>(0);
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

  // Minutos divididos em 1º e 2º Tempo com opções rápidas
  const [minutos1Tempo, setMinutos1Tempo] = useState<number>(40);
  const [minutos2Tempo, setMinutos2Tempo] = useState<number>(40);
  const [opcaoRapidaTempo, setOpcaoRapidaTempo] = useState<string>('80');

  // Posição e Estatísticas
  const [posicaoJogo, setPosicaoJogo] = useState<string>('Meia (10)');
  const [gols, setGols] = useState<number>(0);
  const [assistencias, setAssistencias] = useState<number>(0);
  const [cartoesAmarelos, setCartoesAmarelos] = useState<number>(0);
  const [cartaoVermelho, setCartaoVermelho] = useState<boolean>(false);

  // Pontos de Destaque, Atenção e Caixinhas Livres
  const [pontosFortes, setPontosFortes] = useState<string[]>([]);
  const [pontosMelhoria, setPontosMelhoria] = useState<string[]>([]);
  const [pontosPositivosTexto, setPontosPositivosTexto] = useState('');
  const [pontosMelhorarTexto, setPontosMelhorarTexto] = useState('');

  // Controle da Legenda Compacta (começando fechada)
  const [legendaAberta, setLegendaAberta] = useState<boolean>(false);

  const [feedbackSalvo, setFeedbackSalvo] = useState<string | null>(null);

  // Filtra jogos por categoria
  const jogosFiltrados = jogos.filter(
    (j) => categoriaFiltro === 'TODAS' || j.categoria === categoriaFiltro
  );

  // Divide em Próximos e Realizados ordenados por data
  const proximosJogos = jogosFiltrados
    .filter((j) => !j.realizado)
    .sort((a, b) => dataParaValorOrdenacao(a.dataJogo) - dataParaValorOrdenacao(b.dataJogo));

  const jogosRealizados = jogosFiltrados
    .filter((j) => j.realizado)
    .sort((a, b) => dataParaValorOrdenacao(b.dataJogo) - dataParaValorOrdenacao(a.dataJogo));

  // =========================================================
  // LIGAÇÃO COM A ESCALAÇÃO:
  // Mostra SÓ os jogadores que foram selecionados na escalação daquele jogo,
  // todos juntos (sem separar por categoria), independentemente da categoria original.
  // =========================================================
  const atletasDoJogo = useMemo(() => {
    if (!jogoSelecionadoParaAvaliar) return [];
    const escalacao = jogoSelecionadoParaAvaliar.escalacao || {};
    const idsEscalados = Object.keys(escalacao);

    if (idsEscalados.length > 0) {
      // Filtrar apenas os escalados e ordenar titulares primeiro
      return atletas
        .filter((a) => idsEscalados.includes(a.id))
        .sort((a, b) => {
          const titA = escalacao[a.id]?.titular ? 0 : 1;
          const titB = escalacao[b.id]?.titular ? 0 : 1;
          if (titA !== titB) return titA - titB;
          return a.nome.localeCompare(b.nome);
        });
    }

    // Fallback amigável caso a escalação ainda não tenha sido montada
    return atletas.filter((a) => a.categoria === jogoSelecionadoParaAvaliar.categoria);
  }, [jogoSelecionadoParaAvaliar, atletas]);

  const atletaAtual = atletasDoJogo[atletaIndexAtivo] || null;

  // Carrega avaliação existente do atleta atual para este jogo
  const carregarAvaliacaoDoAtleta = (atletaId: string, jogo: JogoAgenda) => {
    const avExistente = avaliacoes.find(
      (av) =>
        av.atletaId === atletaId &&
        (av.jogoAgendaId === jogo.id ||
          (av.adversario.toLowerCase().includes(jogo.adversario.toLowerCase()) &&
            av.categoria === jogo.categoria))
    );

    // Obtém a posição escalada na montagem do time como padrão
    const escalacaoInfo = jogo.escalacao ? jogo.escalacao[atletaId] : null;
    const atletaObj = atletas.find((a) => a.id === atletaId);

    if (avExistente) {
      setTecnica(avExistente.notas.tecnica);
      setTatica(avExistente.notas.tatica);
      setFisica(avExistente.notas.fisica);
      setMental(avExistente.notas.mental);
      setDisciplinar(avExistente.notas.disciplinar);

      // Minutos 1º e 2º tempo
      if (avExistente.minutos1Tempo !== undefined && avExistente.minutos2Tempo !== undefined) {
        setMinutos1Tempo(avExistente.minutos1Tempo);
        setMinutos2Tempo(avExistente.minutos2Tempo);
        atualizarOpcaoRapidaPorMinutos(avExistente.minutos1Tempo, avExistente.minutos2Tempo);
      } else {
        const total = avExistente.minutosJogados || 80;
        const metade = Math.floor(total / 2);
        setMinutos1Tempo(metade);
        setMinutos2Tempo(total - metade);
        atualizarOpcaoRapidaPorMinutos(metade, total - metade);
      }

      setPosicaoJogo(avExistente.posicaoJogo || escalacaoInfo?.posicaoJogo || 'Meia (10)');
      setGols(avExistente.gols || 0);
      setAssistencias(avExistente.assistencias || 0);
      setCartoesAmarelos(avExistente.cartoesAmarelos || 0);
      setCartaoVermelho(Boolean(avExistente.cartaoVermelho));

      // Pontos fortes e melhoria (tags)
      setPontosFortes(avExistente.pontosFortes || []);
      setPontosMelhoria(avExistente.pontosMelhoria || []);

      // Caixinhas de texto livre
      if (avExistente.pontosPositivosTexto !== undefined) {
        setPontosPositivosTexto(avExistente.pontosPositivosTexto || '');
      } else {
        const matchPos = (avExistente.observacoes || '').match(/\[PONTOS POSITIVOS\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);
        setPontosPositivosTexto(matchPos ? matchPos[1].trim() : '');
      }

      if (avExistente.pontosMelhorarTexto !== undefined) {
        setPontosMelhorarTexto(avExistente.pontosMelhorarTexto || '');
      } else {
        const matchMel = (avExistente.observacoes || '').match(/\[A MELHORAR\]:\s*([\s\S]*?)(?=\n\n\[|$)/i);
        setPontosMelhorarTexto(matchMel ? matchMel[1].trim() : '');
      }

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
      setOpcaoRapidaTempo('80');
      setPosicaoJogo(escalacaoInfo?.posicaoJogo || (atletaObj ? atletaObj.posicao : 'Meia (10)'));
      setGols(0);
      setAssistencias(0);
      setCartoesAmarelos(0);
      setCartaoVermelho(false);
      setPontosFortes([]);
      setPontosMelhoria([]);
      setPontosPositivosTexto('');
      setPontosMelhorarTexto('');
      setObsFisica('');
      setObsTecnica('');
      setObsTatica('');
      setObsMental('');
      setObsDisciplinar('');
    }
  };

  const atualizarOpcaoRapidaPorMinutos = (m1: number, m2: number) => {
    if (m1 === 40 && m2 === 40) {
      setOpcaoRapidaTempo('80');
    } else if (m1 === 40 && m2 === 0) {
      setOpcaoRapidaTempo('so1t');
    } else if (m1 === 0 && m2 === 40) {
      setOpcaoRapidaTempo('so2t');
    } else if (m1 === 0 && m2 === 20) {
      setOpcaoRapidaTempo('entrou2t');
    } else if (m1 === 20 && m2 === 0) {
      setOpcaoRapidaTempo('saiu1t');
    } else {
      setOpcaoRapidaTempo('custom');
    }
  };

  const handleAplicarOpcaoRapidaTempo = (opcao: string) => {
    setOpcaoRapidaTempo(opcao);
    if (opcao === '80') {
      setMinutos1Tempo(40);
      setMinutos2Tempo(40);
    } else if (opcao === 'so1t') {
      setMinutos1Tempo(40);
      setMinutos2Tempo(0);
    } else if (opcao === 'so2t') {
      setMinutos1Tempo(0);
      setMinutos2Tempo(40);
    } else if (opcao === 'entrou2t') {
      setMinutos1Tempo(0);
      setMinutos2Tempo(20);
    } else if (opcao === 'saiu1t') {
      setMinutos1Tempo(20);
      setMinutos2Tempo(0);
    }
  };

  const handleAbrirAvaliacaoJogo = (jogo: JogoAgenda) => {
    setJogoSelecionadoParaAvaliar(jogo);
    setAtletaIndexAtivo(0);
    setFeedbackSalvo(null);
    setLegendaAberta(false);

    // Calcular atletas escalados deste jogo
    const escalacao = jogo.escalacao || {};
    const idsEscalados = Object.keys(escalacao);
    let primeiroAtletaId: string | null = null;

    if (idsEscalados.length > 0) {
      primeiroAtletaId = idsEscalados[0];
    } else {
      const atlsCat = atletas.filter((a) => a.categoria === jogo.categoria);
      if (atlsCat.length > 0) primeiroAtletaId = atlsCat[0].id;
    }

    if (primeiroAtletaId) {
      carregarAvaliacaoDoAtleta(primeiroAtletaId, jogo);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMudarAtletaNaAvaliacao = (novoIndex: number) => {
    if (!jogoSelecionadoParaAvaliar || !atletasDoJogo[novoIndex]) return;
    setAtletaIndexAtivo(novoIndex);
    setFeedbackSalvo(null);
    carregarAvaliacaoDoAtleta(atletasDoJogo[novoIndex].id, jogoSelecionadoParaAvaliar);
  };

  // Toggle de tags com limite máximo de 3
  const togglePontoDestaque = (tag: string) => {
    setPontosFortes((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  const togglePontoAtencao = (tag: string) => {
    setPontosMelhoria((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleSalvarAvaliacaoJogador = (avancarProximo = true) => {
    if (!jogoSelecionadoParaAvaliar || !atletaAtual) return;

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
    if (pontosPositivosTexto.trim()) partesObs.push(`[PONTOS POSITIVOS]: ${pontosPositivosTexto.trim()}`);
    if (pontosMelhorarTexto.trim()) partesObs.push(`[A MELHORAR]: ${pontosMelhorarTexto.trim()}`);

    const textoObservacoesFinal =
      partesObs.length > 0 ? partesObs.join('\n\n') : 'Atuação avaliada pela comissão técnica.';

    const notaGeral = Number(((tecnica + tatica + fisica + mental + disciplinar) / 5).toFixed(1));

    const avExistente = avaliacoes.find(
      (av) =>
        av.atletaId === atletaAtual.id &&
        (av.jogoAgendaId === jogoSelecionadoParaAvaliar.id ||
          (av.adversario.toLowerCase().includes(jogoSelecionadoParaAvaliar.adversario.toLowerCase()) &&
            av.categoria === jogoSelecionadoParaAvaliar.categoria))
    );

    const escaladoInfo = jogoSelecionadoParaAvaliar.escalacao
      ? jogoSelecionadoParaAvaliar.escalacao[atletaAtual.id]
      : null;

    const totalMinutos = (Number(minutos1Tempo) || 0) + (Number(minutos2Tempo) || 0);

    const novaAvaliacao: AvaliacaoJogo = {
      id: avExistente ? avExistente.id : `av-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      atletaId: atletaAtual.id,
      categoria: atletaAtual.categoria,
      dataJogo: jogoSelecionadoParaAvaliar.dataJogo,
      adversario: jogoSelecionadoParaAvaliar.adversario,
      competicao: jogoSelecionadoParaAvaliar.tipo || 'Campeonato',
      minutos1Tempo: Number(minutos1Tempo) || 0,
      minutos2Tempo: Number(minutos2Tempo) || 0,
      minutosJogados: totalMinutos,
      resultado: jogoSelecionadoParaAvaliar.placar || undefined,
      titular: escaladoInfo ? escaladoInfo.titular : true,
      posicaoJogo: posicaoJogo || 'Meia (10)',
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
      pontosPositivosTexto: pontosPositivosTexto.trim(),
      pontosMelhorarTexto: pontosMelhorarTexto.trim(),
      jogoAgendaId: jogoSelecionadoParaAvaliar.id,
      avaliador: 'Comissão Técnica',
    };

    onSalvarAvaliacao(novaAvaliacao);
    const nomePrimeiro = atletaAtual.nome.split(' ')[0];
    setFeedbackSalvo(`✓ Avaliação de ${nomePrimeiro} salva com sucesso!`);

    if (avancarProximo && atletaIndexAtivo + 1 < atletasDoJogo.length) {
      setTimeout(() => {
        handleMudarAtletaNaAvaliacao(atletaIndexAtivo + 1);
      }, 500);
    }
  };

  // Helper para renderizar resumo da escalação no card do jogo
  const renderResumoEscalacaoCard = (jogo: JogoAgenda) => {
    const escalacao = jogo.escalacao;
    if (!escalacao || Object.keys(escalacao).length === 0) {
      return (
        <span className="text-[11px] text-slate-400 font-medium">
          Escalação não definida
        </span>
      );
    }

    const items = Object.values(escalacao);
    const total = items.length;
    const titulares = items.filter((e) => e.titular).length;
    const reservas = total - titulares;

    return (
      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/50">
        {titulares} titulares + {reservas} reservas ({total} selecionados)
      </span>
    );
  };

  // ==========================================
  // RENDERIZAÇÃO 1: DENTRO DE CADA JOGO - AVALIAÇÃO
  // ==========================================
  if (jogoSelecionadoParaAvaliar) {
    const minutosTotaisSomados = (Number(minutos1Tempo) || 0) + (Number(minutos2Tempo) || 0);

    return (
      <div className="space-y-6 pb-[120px] w-full max-w-full box-border">
        {/* Barra Superior de Retorno */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setJogoSelecionadoParaAvaliar(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Agenda de Jogos</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {jogoSelecionadoParaAvaliar.categoria}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
              {jogoSelecionadoParaAvaliar.tipo}
            </span>
          </div>
        </div>

        {/* TOPO DA AVALIAÇÃO: Master Soccer vs [Adversário] */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-blue-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <MasterSoccerEscudo size={48} className="drop-shadow-sm shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold">
                  Avaliação da Partida
                </span>
                {jogoSelecionadoParaAvaliar.placar && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                    Placar: {jogoSelecionadoParaAvaliar.placar}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Master Soccer {jogoSelecionadoParaAvaliar.adversario}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatarDataExibicao(jogoSelecionadoParaAvaliar.dataJogo)}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {jogoSelecionadoParaAvaliar.hora || '09:00'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {jogoSelecionadoParaAvaliar.local || 'Campo Master Soccer'}
                </span>
                <span>·</span>
                <span className="font-bold text-amber-300">
                  {jogoSelecionadoParaAvaliar.categoria} ({jogoSelecionadoParaAvaliar.tipo})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abinhas dos Jogadores Selecionados na Escalação deste Jogo */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Jogadores Escalados ({atletasDoJogo.length} atletas):
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Jogador {atletaIndexAtivo + 1} de {atletasDoJogo.length || 1}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {atletasDoJogo.map((atl, idx) => {
              const ativo = idx === atletaIndexAtivo;
              const avFeita = avaliacoes.some(
                (av) =>
                  av.atletaId === atl.id &&
                  (av.jogoAgendaId === jogoSelecionadoParaAvaliar.id ||
                    av.adversario.toLowerCase().includes(jogoSelecionadoParaAvaliar.adversario.toLowerCase()))
              );

              const escalado = jogoSelecionadoParaAvaliar.escalacao
                ? jogoSelecionadoParaAvaliar.escalacao[atl.id]
                : null;

              return (
                <button
                  key={atl.id}
                  onClick={() => handleMudarAtletaNaAvaliacao(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    ativo
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{atl.nome.split(' ')[0]}</span>
                  {escalado?.titular ? (
                    <span className="text-[10px] opacity-80">(Tit)</span>
                  ) : (
                    <span className="text-[10px] opacity-75">(Res)</span>
                  )}
                  {avFeita && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ativo ? 'bg-amber-300' : 'bg-emerald-500'
                      }`}
                      title="Avaliação já preenchida"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário de Avaliação do Atleta Atual */}
        {atletaAtual ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
            {/* Header do Atleta Avaliado */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-sm text-blue-700 dark:text-blue-300 overflow-hidden">
                  {atletaAtual.fotoUrl ? (
                    <img src={atletaAtual.fotoUrl} alt={atletaAtual.nome} className="w-full h-full object-cover" />
                  ) : (
                    atletaAtual.nome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {atletaAtual.categoria}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {atletaAtual.nome}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Posição Original: <strong>{atletaAtual.posicao}</strong> · Pé:{' '}
                    <strong>{atletaAtual.pernaDominante}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Média Geral</span>
                  <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">
                    {((tecnica + tatica + fisica + mental + disciplinar) / 5).toFixed(1)} / 10
                  </span>
                </div>
              </div>
            </div>

            {feedbackSalvo && (
              <div className="p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{feedbackSalvo}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. TEMPO - DIVIDIR EM 1º E 2º TEMPO COM OPÇÕES PRONTAS */}
            {/* ========================================================= */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Tempo de Jogo:</span>
                </label>

                {/* Dropdown com as 5 Opções Prontas */}
                <div className="w-full sm:w-auto">
                  <select
                    value={opcaoRapidaTempo}
                    onChange={(e) => handleAplicarOpcaoRapidaTempo(e.target.value)}
                    className="w-full sm:w-72 h-9 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-blue-500/60 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
                  >
                    <option value="80">Jogou o jogo todo (80 min)</option>
                    <option value="so1t">Jogou só 1º tempo (40 min)</option>
                    <option value="so2t">Jogou só 2º tempo (40 min)</option>
                    <option value="entrou2t">Entrou no 2º tempo (20 min)</option>
                    <option value="saiu1t">Saiu no 1º tempo (20 min)</option>
                    <option value="custom">Outro (Ajuste manual abaixo)</option>
                  </select>
                </div>
              </div>

              {/* Ajuste Manual: 1º Tempo, 2º Tempo e Total Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1º Tempo: [ - 40 + ] min */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    1º Tempo:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos1Tempo((prev) => Math.max(0, prev - 5));
                        setOpcaoRapidaTempo('custom');
                      }}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={minutos1Tempo}
                      onChange={(e) => {
                        setMinutos1Tempo(Math.max(0, Number(e.target.value)));
                        setOpcaoRapidaTempo('custom');
                      }}
                      className="w-12 h-7 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos1Tempo((prev) => Math.min(60, prev + 5));
                        setOpcaoRapidaTempo('custom');
                      }}
                      className="w-7 h-7 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm flex items-center justify-center transition"
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500 font-semibold ml-0.5">min</span>
                  </div>
                </div>

                {/* 2º Tempo: [ - 40 + ] min */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    2º Tempo:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos2Tempo((prev) => Math.max(0, prev - 5));
                        setOpcaoRapidaTempo('custom');
                      }}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={minutos2Tempo}
                      onChange={(e) => {
                        setMinutos2Tempo(Math.max(0, Number(e.target.value)));
                        setOpcaoRapidaTempo('custom');
                      }}
                      className="w-12 h-7 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos2Tempo((prev) => Math.min(60, prev + 5));
                        setOpcaoRapidaTempo('custom');
                      }}
                      className="w-7 h-7 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm flex items-center justify-center transition"
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500 font-semibold ml-0.5">min</span>
                  </div>
                </div>
              </div>

              {/* Total Automático */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500 font-medium">
                  Total automático:
                </span>
                <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                  Total automático: {minutosTotaisSomados} min
                </span>
              </div>
            </div>

            {/* SELEÇÃO DE POSIÇÃO NO JOGO & ESTATÍSTICAS DA PARTIDA */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Jogou de:</span>
                </label>
                <select
                  value={posicaoJogo}
                  onChange={(e) => setPosicaoJogo(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {POSICOES_JOGO.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estatísticas da Partida: Gol, Assistência, Cartão Amarelo, Cartão Vermelho */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Gols */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ⚽ Gols
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGols((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-7 font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {gols}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGols((prev) => prev + 1)}
                      className="w-7 h-7 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Assistências */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    🎯 Assistências
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAssistencias((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-7 font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {assistencias}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAssistencias((prev) => prev + 1)}
                      className="w-7 h-7 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cartões Amarelos */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
                    🟨 Cartão Amarelo
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCartoesAmarelos((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-7 font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {cartoesAmarelos}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCartoesAmarelos((prev) => Math.min(2, prev + 1))}
                      className="w-7 h-7 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cartão Vermelho */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    🟥 Cartão Vermelho
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none">
                    <input
                      type="checkbox"
                      checked={cartaoVermelho}
                      onChange={(e) => setCartaoVermelho(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 accent-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className={cartaoVermelho ? 'text-rose-600' : 'text-slate-400'}>
                      {cartaoVermelho ? 'Expulso' : 'Não'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. LEGENDA - COMPACTA E FECHADA NO TOPO DA AVALIAÇÃO */}
            {/* [ ⓘ Legenda: 0-2 Muito Ruim • 3-4 Ruim • 5-6 Precisa Melhorar • 7 Bom • 8 Muito Bom • 9 Excelente • 10 Perfeito ] */}
            {/* ========================================================= */}
            <div className="rounded-xl border border-blue-200 dark:border-slate-800 overflow-hidden bg-blue-50/50 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setLegendaAberta(!legendaAberta)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-100/60 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-left truncate">
                  <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">ⓘ</span>
                  <span className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 truncate">
                    Legenda: 0-2 Muito Ruim • 3-4 Ruim • 5-6 Precisa Melhorar • 7 Bom • 8 Muito Bom • 9 Excelente • 10 Perfeito
                  </span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0 ml-2">
                  {legendaAberta ? 'Fechar ▲' : 'Expandir ▼'}
                </span>
              </button>

              {legendaAberta && (
                <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-blue-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-center animate-in fade-in">
                  0 a 2 = Muito Ruim • 3 a 4 = Ruim • 5 a 6 = Precisa Melhorar • 7 = Bom • 8 = Muito Bom • 9 = Excelente • 10 = Perfeito 👏
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* OS 5 QUESITOS: TÍTULO + SLIDER AZUL + NOTA: X/10 - TEXTO + CAIXINHA FIXA 120px (SEM LEGENDA REPETIDA) */}
            {/* ========================================================= */}
            <div className="space-y-4">
              {/* 1. FÍSICO */}
              <div
                style={{
                  margin: '16px 0',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                }}
                className="dark:bg-slate-800/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>⚡</span> FÍSICO
                  </span>
                  <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                    Nota: {Math.round(fisica)}/10 - {tituloNota(fisica)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={fisica}
                  onChange={(e) => setFisica(parseFloat(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  style={{ accentColor: '#2563eb' }}
                />
                <textarea
                  value={obsFisica}
                  onChange={(e) => setObsFisica(e.target.value)}
                  placeholder="Observação do Físico..."
                  style={{ height: '120px', resize: 'none' }}
                  className="w-full mt-3 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* 2. TÉCNICO */}
              <div
                style={{
                  margin: '16px 0',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                }}
                className="dark:bg-slate-800/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>⚽</span> TÉCNICO
                  </span>
                  <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                    Nota: {Math.round(tecnica)}/10 - {tituloNota(tecnica)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={tecnica}
                  onChange={(e) => setTecnica(parseFloat(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  style={{ accentColor: '#2563eb' }}
                />
                <textarea
                  value={obsTecnica}
                  onChange={(e) => setObsTecnica(e.target.value)}
                  placeholder="Observação do Técnico..."
                  style={{ height: '120px', resize: 'none' }}
                  className="w-full mt-3 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* 3. TÁTICO */}
              <div
                style={{
                  margin: '16px 0',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                }}
                className="dark:bg-slate-800/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧠</span> TÁTICO
                  </span>
                  <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                    Nota: {Math.round(tatica)}/10 - {tituloNota(tatica)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={tatica}
                  onChange={(e) => setTatica(parseFloat(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  style={{ accentColor: '#2563eb' }}
                />
                <textarea
                  value={obsTatica}
                  onChange={(e) => setObsTatica(e.target.value)}
                  placeholder="Observação do Tático..."
                  style={{ height: '120px', resize: 'none' }}
                  className="w-full mt-3 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* 4. MENTAL */}
              <div
                style={{
                  margin: '16px 0',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                }}
                className="dark:bg-slate-800/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🎯</span> MENTAL
                  </span>
                  <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                    Nota: {Math.round(mental)}/10 - {tituloNota(mental)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={mental}
                  onChange={(e) => setMental(parseFloat(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  style={{ accentColor: '#2563eb' }}
                />
                <textarea
                  value={obsMental}
                  onChange={(e) => setObsMental(e.target.value)}
                  placeholder="Observação do Mental..."
                  style={{ height: '120px', resize: 'none' }}
                  className="w-full mt-3 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* 5. DISCIPLINAR */}
              <div
                style={{
                  margin: '16px 0',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                }}
                className="dark:bg-slate-800/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🛡️</span> DISCIPLINAR
                  </span>
                  <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                    Nota: {Math.round(disciplinar)}/10 - {tituloNota(disciplinar)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={disciplinar}
                  onChange={(e) => setDisciplinar(parseFloat(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  style={{ accentColor: '#2563eb' }}
                />
                <textarea
                  value={obsDisciplinar}
                  onChange={(e) => setObsDisciplinar(e.target.value)}
                  placeholder="Observação do Disciplinar..."
                  style={{ height: '120px', resize: 'none' }}
                  className="w-full mt-3 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. VOLTAR PONTOS POSITIVOS E A MELHORAR (TAGS + CAIXINHAS) */}
            {/* No final da avaliação de cada jogador, DEPOIS das notas e ANTES de salvar */}
            {/* ========================================================= */}
            <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* TAGS DESTAQUE & ATENÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DESTAQUE */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <span>⭐</span> Pontos de Destaque
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {pontosFortes.length}/3 selecionados
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS_DESTAQUE_DISPONIVEIS.map((tag) => {
                      const ativo = pontosFortes.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => togglePontoDestaque(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            ativo
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ATENÇÃO / APRIMORAMENTO */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <span>⚠️</span> Pontos de Atenção / Aprimoramento
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {pontosMelhoria.length}/3 selecionados
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS_ATENCAO_DISPONIVEIS.map((tag) => {
                      const ativo = pontosMelhoria.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => togglePontoAtencao(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            ativo
                              ? 'bg-rose-700 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CAIXINHAS DE TEXTO LIVRE: PONTOS POSITIVOS E A MELHORAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ Pontos Positivos */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                    <span>✅</span> Pontos Positivos:
                  </label>
                  <textarea
                    value={pontosPositivosTexto}
                    onChange={(e) => setPontosPositivosTexto(e.target.value)}
                    placeholder="O que o atleta fez de bom na partida..."
                    style={{ height: '90px', resize: 'none' }}
                    className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* ⚠️ A Melhorar */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <span>⚠️</span> A Melhorar:
                  </label>
                  <textarea
                    value={pontosMelhorarTexto}
                    onChange={(e) => setPontosMelhorarTexto(e.target.value)}
                    placeholder="O que o atleta precisa melhorar ou focar nos treinos..."
                    style={{ height: '90px', resize: 'none' }}
                    className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Ações de Salvar do Jogador */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJogoSelecionadoParaAvaliar(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Concluir & Fechar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSalvarAvaliacaoJogador(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Salvar Jogador
                </button>
                <button
                  type="button"
                  onClick={() => handleSalvarAvaliacaoJogador(true)}
                  style={{ backgroundColor: '#2563eb' }}
                  className="px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>Salvar & Próximo Jogador</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs space-y-2">
            <p>Nenhum atleta escalado para este jogo ainda.</p>
            {onNavegarEscalacao && (
              <button
                onClick={() => onNavegarEscalacao(jogoSelecionadoParaAvaliar.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
              >
                Montar Escalação do Jogo
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO 2: LISTA DE JOGOS DA AGENDA
  // ==========================================
  return (
    <div className="space-y-6 pb-[120px] w-full max-w-full box-border">
      {/* Topo com Título, Categorias e Botão + NOVO JOGO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
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

        {/* Botão + NOVO JOGO */}
        <button
          onClick={onNovoJogo}
          style={{ backgroundColor: '#2563eb' }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 border border-blue-500/40"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Novo Jogo</span>
        </button>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setCategoriaFiltro('TODAS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            categoriaFiltro === 'TODAS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Todos os Jogos ({jogos.length})
        </button>
        {categorias.map((cat) => {
          const count = jogos.filter((j) => j.categoria === cat).length;
          const ativo = categoriaFiltro === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                ativo
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* SEÇÃO 1: PRÓXIMOS JOGOS (EM CIMA) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Próximos Jogos ({proximosJogos.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Ordenados por data</span>
        </div>

        {proximosJogos.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
            Nenhum próximo jogo agendado. Clique em <strong>"+ Novo Jogo"</strong> para adicionar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {proximosJogos.map((jogo) => (
              <div
                key={jogo.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {jogo.categoria}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {jogo.tipo}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {jogo.adversario}
                  </h4>

                  {/* Resumo da Escalação */}
                  <div className="mt-1.5">{renderResumoEscalacaoCard(jogo)}</div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <div className="flex items-center gap-1.5 font-mono font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{formatarDataExibicao(jogo.dataJogo)}</span>
                      {jogo.hora && <span>às {jogo.hora}</span>}
                    </div>
                    {jogo.local && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{jogo.local}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões do Jogo: EDITAR e EXCLUIR + AVALIAR */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditarJogo(jogo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition"
                      title="Editar data, hora, adversário e local"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-400" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onExcluirJogo(jogo.id, `${jogo.adversario} (${jogo.categoria})`)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition"
                      title="Excluir este jogo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Excluir</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAbrirAvaliacaoJogo(jogo)}
                    style={{ backgroundColor: '#2563eb' }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white hover:bg-blue-700 active:scale-98 transition flex items-center gap-1.5 shadow-xs"
                    title="Avaliar os jogadores desta partida"
                  >
                    <span>Avaliar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: JOGOS QUE JÁ ACONTECERAM (EMBAIXO) */}
      <div className="space-y-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Jogos que Já Aconteceram ({jogosRealizados.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Clique para ver / avaliar</span>
        </div>

        {jogosRealizados.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
            Nenhum jogo realizado ainda. Os jogos disputados aparecerão aqui com as avaliações dos atletas.
          </div>
        ) : (
          <div className="space-y-3">
            {jogosRealizados.map((jogo) => {
              const totalAvsDoJogo = avaliacoes.filter(
                (av) =>
                  av.jogoAgendaId === jogo.id ||
                  (av.adversario.toLowerCase().includes(jogo.adversario.toLowerCase()) &&
                    av.categoria === jogo.categoria)
              ).length;

              return (
                <div
                  key={jogo.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div
                    onClick={() => handleAbrirAvaliacaoJogo(jogo)}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {jogo.categoria}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {jogo.tipo}
                      </span>
                      {jogo.placar && (
                        <span className="text-xs font-mono font-bold px-2 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                          {jogo.placar}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{jogo.adversario}</span>
                    </h4>

                    {/* Resumo da Escalação */}
                    <div className="mt-1">{renderResumoEscalacaoCard(jogo)}</div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="font-mono">{formatarDataExibicao(jogo.dataJogo)}</span>
                      <span>·</span>
                      <span>{jogo.local || 'Campo Master Soccer'}</span>
                      <span>·</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {totalAvsDoJogo} {totalAvsDoJogo === 1 ? 'atleta avaliado' : 'atletas avaliados'}
                      </span>
                    </div>
                  </div>

                  {/* Ações do Jogo: EDITAR e EXCLUIR + Botão de Avaliar */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-none border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                      onClick={() => onEditarJogo(jogo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition"
                      title="Editar data, hora, adversário e local"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-400" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onExcluirJogo(jogo.id, `${jogo.adversario} (${jogo.categoria})`)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition"
                      title="Excluir este jogo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Excluir</span>
                    </button>
                    <button
                      onClick={() => handleAbrirAvaliacaoJogo(jogo)}
                      style={{ backgroundColor: '#2563eb' }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white hover:bg-blue-700 active:scale-98 transition flex items-center gap-1.5 shadow-xs"
                      title="Ver ou continuar avaliações"
                    >
                      <span>Avaliar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
