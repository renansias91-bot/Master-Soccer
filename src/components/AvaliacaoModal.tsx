import React, { useState, useEffect, useRef } from 'react';
import { X, Award, CheckCircle2, Info, Plus, Clock, Users, ArrowRight, Calendar } from 'lucide-react';
import { Atleta, AvaliacaoJogo, NotasPilares } from '../types';
import { getDataAtualBrasil, formatarDataExibicao } from '../utils/dateUtils';

interface AvaliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avaliacao: AvaliacaoJogo) => void;
  avaliacaoEditando?: AvaliacaoJogo | null;
  atletas: Atleta[];
  atletaPreSelecionadoId?: string;
  categoriaAtiva?: string;
  categoriasDisponiveis?: string[];
}

const SUGESTOES_PONTOS_FORTES = [
  'Visão de jogo',
  'Passe vertical',
  'Drible no 1x1',
  'Finalização precisa',
  'Velocidade e arranque',
  'Força nos duelos',
  'Liderança em campo',
  'Bolas paradas',
  'Recomposição defensiva rápida',
  'Inteligência tática',
];

const SUGESTOES_PONTOS_MELHORIA = [
  'Uso do pé não dominante',
  'Paciência na linha de impedimento',
  'Intensidade no segundo tempo',
  'Controle emocional sob pressão',
  'Comunicação em campo',
  'Jogo aéreo / Cabeceio',
  'Tomada de decisão em transição',
  'Proteção de bola de costas',
];

export const AvaliacaoModal: React.FC<AvaliacaoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  avaliacaoEditando,
  atletas,
  atletaPreSelecionadoId,
  categoriaAtiva,
  categoriasDisponiveis,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Lista de categorias disponíveis
  const listaCategorias =
    categoriasDisponiveis && categoriasDisponiveis.length > 0
      ? categoriasDisponiveis
      : ['SUB-15', 'SUB-16', 'SUB-17'];

  // Categoria selecionada primeiro
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('SUB-15');
  const [atletaId, setAtletaId] = useState('');

  // Dados da Partida
  const [dataJogo, setDataJogo] = useState(() => getDataAtualBrasil());
  const [adversario, setAdversario] = useState('');
  const [competicao, setCompeticao] = useState('Campeonato Estadual');
  const [resultado, setResultado] = useState('');
  const [titular, setTitular] = useState(true);

  // Minutos divididos em 1º Tempo e 2º Tempo
  const [minutos1Tempo, setMinutos1Tempo] = useState<number>(40);
  const [minutos2Tempo, setMinutos2Tempo] = useState<number>(40);

  // Notas dos 5 pilares (1.0 a 10.0)
  const [tecnica, setTecnica] = useState<number>(8.0);
  const [tatica, setTatica] = useState<number>(8.0);
  const [fisica, setFisica] = useState<number>(7.5);
  const [mental, setMental] = useState<number>(8.0);
  const [disciplinar, setDisciplinar] = useState<number>(9.0);

  // Observações adicionais sobre o progresso e desenvolvimento
  const [observacoes, setObservacoes] = useState('');
  const [pontosFortes, setPontosFortes] = useState<string[]>([]);
  const [pontosMelhoria, setPontosMelhoria] = useState<string[]>([]);
  const [avaliador, setAvaliador] = useState('Comissão Técnica');

  // Feedbacks
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [sessaoContador, setSessaoContador] = useState<number>(0);

  // Atletas da categoria atualmente selecionada
  const atletasFiltrados = atletas.filter((a) => a.categoria === categoriaSelecionada);
  const atletaSelecionado = atletas.find((a) => a.id === atletaId);

  // Soma automática dos minutos em campo
  const minutosTotais = (Number(minutos1Tempo) || 0) + (Number(minutos2Tempo) || 0);

  // Média Geral em tempo real
  const notaGeral = Number(((tecnica + tatica + fisica + mental + disciplinar) / 5).toFixed(1));

  // Inicialização do formulário
  useEffect(() => {
    if (!isOpen) {
      setMensagemSucesso(null);
      setSessaoContador(0);
      return;
    }

    if (avaliacaoEditando) {
      setCategoriaSelecionada(avaliacaoEditando.categoria);
      setAtletaId(avaliacaoEditando.atletaId);
      setDataJogo(formatarDataExibicao(avaliacaoEditando.dataJogo));
      setAdversario(avaliacaoEditando.adversario);
      setCompeticao(avaliacaoEditando.competicao);

      if (
        avaliacaoEditando.minutos1Tempo !== undefined &&
        avaliacaoEditando.minutos2Tempo !== undefined
      ) {
        setMinutos1Tempo(avaliacaoEditando.minutos1Tempo);
        setMinutos2Tempo(avaliacaoEditando.minutos2Tempo);
      } else {
        const total = avaliacaoEditando.minutosJogados || 80;
        const metade = Math.floor(total / 2);
        setMinutos1Tempo(metade);
        setMinutos2Tempo(total - metade);
      }

      setResultado(avaliacaoEditando.resultado || '');
      setTitular(avaliacaoEditando.titular);
      setTecnica(avaliacaoEditando.notas.tecnica);
      setTatica(avaliacaoEditando.notas.tatica);
      setFisica(avaliacaoEditando.notas.fisica);
      setMental(avaliacaoEditando.notas.mental);
      setDisciplinar(avaliacaoEditando.notas.disciplinar);
      setObservacoes(avaliacaoEditando.observacoes);
      setPontosFortes(avaliacaoEditando.pontosFortes || []);
      setPontosMelhoria(avaliacaoEditando.pontosMelhoria || []);
      setAvaliador(avaliacaoEditando.avaliador || 'Comissão Técnica');
    } else {
      // Determina a categoria inicial
      let catInicial = listaCategorias[0] || 'SUB-15';
      let idInicial = '';

      if (atletaPreSelecionadoId) {
        const pre = atletas.find((a) => a.id === atletaPreSelecionadoId);
        if (pre) {
          catInicial = pre.categoria;
          idInicial = pre.id;
        }
      } else if (categoriaAtiva && categoriaAtiva !== 'TODAS' && listaCategorias.includes(categoriaAtiva)) {
        catInicial = categoriaAtiva;
        const atlsDaCat = atletas.filter((a) => a.categoria === catInicial);
        idInicial = atlsDaCat[0]?.id || '';
      } else {
        const atlsDaCat = atletas.filter((a) => a.categoria === catInicial);
        idInicial = atlsDaCat[0]?.id || '';
      }

      setCategoriaSelecionada(catInicial);
      setAtletaId(idInicial);
      setDataJogo(getDataAtualBrasil());
      setAdversario('');
      setCompeticao('Campeonato Estadual');
      setMinutos1Tempo(40);
      setMinutos2Tempo(40);
      setResultado('');
      setTitular(true);
      setTecnica(8.0);
      setTatica(8.0);
      setFisica(7.5);
      setMental(8.0);
      setDisciplinar(9.0);
      setObservacoes('');
      setPontosFortes([]);
      setPontosMelhoria([]);
      setAvaliador('Comissão Técnica');
    }
    setErro('');
  }, [avaliacaoEditando, isOpen, atletaPreSelecionadoId, categoriaAtiva]);

  if (!isOpen) return null;

  // Troca de categoria com auto-seleção do primeiro atleta do elenco
  const handleTrocarCategoria = (novaCat: string) => {
    setCategoriaSelecionada(novaCat);
    const atls = atletas.filter((a) => a.categoria === novaCat);
    setAtletaId(atls[0]?.id || '');
    setMensagemSucesso(null);
    setErro('');
  };

  const getCorNota = (nota: number) => {
    if (nota >= 8.5) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800';
    if (nota >= 7.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800';
    if (nota >= 5.0) return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800';
  };

  const togglePontoForte = (tag: string) => {
    setPontosFortes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const togglePontoMelhoria = (tag: string) => {
    setPontosMelhoria((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Salvar avaliação (normal ou sequencial)
  const handleSalvar = (fecharAoConcluir: boolean) => {
    if (!atletaId) {
      setErro(`Por favor, selecione um atleta da categoria ${categoriaSelecionada}.`);
      return;
    }
    if (!adversario.trim()) {
      setErro('Por favor, informe a equipe adversária.');
      return;
    }
    if (!observacoes.trim()) {
      setErro('Por favor, preencha o parecer de observações sobre o desenvolvimento do atleta.');
      return;
    }

    const atletaObj = atletas.find((a) => a.id === atletaId);

    const notasObj: NotasPilares = {
      tecnica: Number(tecnica),
      tatica: Number(tatica),
      fisica: Number(fisica),
      mental: Number(mental),
      disciplinar: Number(disciplinar),
    };

    // A data é criada NA HORA em que clica em SALVAR, com fuso horário America/Sao_Paulo no formato DD/MM/AAAA
    const dataJogoSalva = avaliacaoEditando?.dataJogo
      ? (formatarDataExibicao(dataJogo) || formatarDataExibicao(avaliacaoEditando.dataJogo) || getDataAtualBrasil())
      : getDataAtualBrasil();

    const novaAvaliacao: AvaliacaoJogo = {
      id: avaliacaoEditando ? avaliacaoEditando.id : `av-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      atletaId,
      categoria: categoriaSelecionada,
      dataJogo: dataJogoSalva,
      adversario: adversario.trim(),
      competicao: competicao.trim(),
      minutos1Tempo: Number(minutos1Tempo) || 0,
      minutos2Tempo: Number(minutos2Tempo) || 0,
      minutosJogados: minutosTotais,
      resultado: resultado.trim() || undefined,
      titular,
      notas: notasObj,
      notaGeral,
      observacoes: observacoes.trim(),
      pontosFortes,
      pontosMelhoria,
      avaliador: avaliador.trim() || 'Comissão Técnica',
    };

    onSave(novaAvaliacao);

    if (fecharAoConcluir) {
      onClose();
    } else {
      // Modo Sequencial: Mantém jogo, adversário e minutagem, e seleciona o próximo atleta da categoria
      const nomeSalvo = atletaObj ? atletaObj.nome.split(' ')[0] : 'Atleta';
      setSessaoContador((prev) => prev + 1);

      // Localiza próximo atleta no elenco
      const currentIndex = atletasFiltrados.findIndex((a) => a.id === atletaId);
      if (currentIndex >= 0 && currentIndex + 1 < atletasFiltrados.length) {
        const proximo = atletasFiltrados[currentIndex + 1];
        setAtletaId(proximo.id);
        setMensagemSucesso(`✓ Avaliação de ${nomeSalvo} salva! Agora avaliando ${proximo.nome.split(' ')[0]}.`);
      } else if (atletasFiltrados.length > 0) {
        setAtletaId(atletasFiltrados[0].id);
        setMensagemSucesso(`✓ Avaliação de ${nomeSalvo} salva! Você percorreu todos os atletas do ${categoriaSelecionada}.`);
      }

      // Limpa dados de desempenho individual para o próximo
      setObservacoes('');
      setPontosFortes([]);
      setPontosMelhoria([]);
      setTecnica(8.0);
      setTatica(8.0);
      setFisica(7.5);
      setMental(8.0);
      setDisciplinar(9.0);
      setErro('');

      // Scroll para o topo para facilitar a visualização do novo atleta selecionado
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {avaliacaoEditando ? 'Editar Avaliação de Jogo' : 'Registrar Avaliação Pós-Jogo'}
                </h3>
                {sessaoContador > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/50">
                    {sessaoContador} {sessaoContador === 1 ? 'salva' : 'salvas'} em sequência
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione a categoria, escolha o atleta e avalie os 5 pilares com minutos somados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll suave */}
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSalvar(true);
          }}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {/* Alerta de Sucesso Sequencial */}
          {mensagemSucesso && (
            <div className="flex items-center justify-between p-3 text-xs text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in duration-200 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{mensagemSucesso}</span>
              </div>
              <button
                type="button"
                onClick={() => setMensagemSucesso(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Alerta de Erro */}
          {erro && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              <Info className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* SEÇÃO 1: SELEÇÃO DA CATEGORIA PRIMEIRO + ATLETA (Fluxo Otimizado para Avaliações em Sequência) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            {/* 1º Passo: Categorias */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px]">1</span>
                  Selecione a Categoria da Base *
                </label>
                <span className="text-[11px] text-slate-500">
                  Filtra o elenco da categoria
                </span>
              </div>

              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 pt-0.5">
                {listaCategorias.map((cat) => {
                  const isSelected = categoriaSelecionada === cat;
                  const totalCat = atletas.filter((a) => a.categoria === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleTrocarCategoria(cat)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                          isSelected
                            ? 'bg-blue-800 text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {totalCat} {totalCat === 1 ? 'atleta' : 'atletas'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2º Passo: Atleta dentro da categoria selecionada */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px]">2</span>
                  Atleta Avaliado ({categoriaSelecionada}) *
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  {atletasFiltrados.length} no plantel
                </span>
              </div>

              <select
                value={atletaId}
                onChange={(e) => setAtletaId(e.target.value)}
                disabled={Boolean(atletaPreSelecionadoId && !avaliacaoEditando)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              >
                <option value="">Selecione um atleta do {categoriaSelecionada}...</option>
                {atletasFiltrados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — {a.posicao} (Pé: {a.pernaDominante})
                  </option>
                ))}
              </select>

              {atletaSelecionado && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {atletaSelecionado.nome}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded font-semibold text-[10px]">
                    {atletaSelecionado.posicao}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Pé: <strong>{atletaSelecionado.pernaDominante}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Status: {atletaSelecionado.status}</span>
                </div>
              )}

              {atletasFiltrados.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Nenhum atleta cadastrado nesta categoria ({categoriaSelecionada}). Cadastre atletas no Plantel para avaliar.
                </p>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DO JOGO & MINUTAGEM SEPARADA POR TEMPOS (1ºT + 2ºT COM SOMA AUTOMÁTICA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {/* Adversário */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adversário *
              </label>
              <input
                type="text"
                value={adversario}
                onChange={(e) => setAdversario(e.target.value)}
                placeholder="Ex: Santos FC Sub-15"
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Data do Jogo / Avaliação */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Registro (Horário de Brasília)
              </label>
              <div className="flex items-center justify-between h-10 px-3.5 py-2 text-sm font-mono leading-normal bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-bold">
                    {avaliacaoEditando ? formatarDataExibicao(dataJogo) : getDataAtualBrasil()}
                  </span>
                </div>
                <span className="text-[11px] font-sans text-slate-500 font-medium">
                  {avaliacaoEditando ? 'Data gravada' : 'Automática (Hoje)'}
                </span>
              </div>
            </div>

            {/* Competição */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Competição / Tipo de Jogo
              </label>
              <input
                type="text"
                value={competicao}
                onChange={(e) => setCompeticao(e.target.value)}
                placeholder="Ex: Campeonato Estadual"
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Placar Final */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Placar Final (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: V 2x1 ou E 0x0"
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Minutagem Dividida em 1º Tempo e 2º Tempo com Soma Automática */}
            <div className="sm:col-span-2 bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Minutos em Campo (1º e 2º Tempo)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Defina os minutos de cada tempo e o sistema calcula a minutagem total da partida
                  </p>
                </div>

                {/* Badge da Soma Total */}
                <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Total Somado:</span>
                  <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {minutosTotais}'
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
                {/* 1º Tempo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1º Tempo (minutos)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={minutos1Tempo}
                      onChange={(e) => setMinutos1Tempo(Math.max(0, Number(e.target.value)))}
                      className="w-full h-10 px-3 py-2 text-sm font-mono font-bold tabular-nums leading-normal bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      min
                    </span>
                  </div>
                </div>

                {/* 2º Tempo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2º Tempo (minutos)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={minutos2Tempo}
                      onChange={(e) => setMinutos2Tempo(Math.max(0, Number(e.target.value)))}
                      className="w-full h-10 px-3 py-2 text-sm font-mono font-bold tabular-nums leading-normal bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      min
                    </span>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Atalhos Rápidos
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos1Tempo(40);
                        setMinutos2Tempo(40);
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="40' no 1ºT e 40' no 2ºT (80' total)"
                    >
                      40'+40'
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos1Tempo(35);
                        setMinutos2Tempo(35);
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="35' no 1ºT e 35' no 2ºT (70' total)"
                    >
                      35'+35'
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos1Tempo(40);
                        setMinutos2Tempo(0);
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Jogou apenas o 1º Tempo"
                    >
                      Só 1ºT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinutos1Tempo(0);
                        setMinutos2Tempo(40);
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Entrou no 2º Tempo"
                    >
                      Só 2ºT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: AVALIAÇÃO DOS 5 PILARES (NOTAS DE 1 A 10) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Avaliação das 5 Dimensões (Notas de 1 a 10)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ajuste as notas correspondentes à atuação do atleta na partida
                </p>
              </div>

              {/* Média em destaque */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Média Geral:</span>
                <span
                  className={`text-sm font-mono font-bold px-2.5 py-1 rounded-lg border tabular-nums ${getCorNota(
                    notaGeral
                  )}`}
                >
                  {notaGeral.toFixed(1)} / 10
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* 1. TÉCNICA */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      1. Parte Técnica
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      (Passe, controle, drible, condução e finalização)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {tecnica.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={tecnica}
                  onChange={(e) => setTecnica(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* 2. TÁTICA */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. Parte Tática
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      (Posicionamento, leitura de jogo, ocupação de espaço e recomposição)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {tatica.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={tatica}
                  onChange={(e) => setTatica(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* 3. FÍSICA */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      3. Parte Física
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      (Velocidade, vigor nos duelos, resistência aeróbica e intensidade)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {fisica.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={fisica}
                  onChange={(e) => setFisica(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* 4. MENTAL */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      4. Parte Mental
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      (Concentração, atitude sob pressão, inteligência emocional e liderança)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {mental.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={mental}
                  onChange={(e) => setMental(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* 5. DISCIPLINAR */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      5. Parte Disciplinar
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      (Cumprimento de ordens da comissão, respeito ao árbitro e espírito de grupo)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {disciplinar.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={disciplinar}
                  onChange={(e) => setDisciplinar(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: CAMPO DE OBSERVAÇÕES DE PROGRESSO & DESENVOLVIMENTO */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações sobre o Progresso e Desenvolvimento do Jogador *
            </label>
            <textarea
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva detalhes específicos da atuação: tomadas de decisão, evolução tática em relação aos treinos, postura diante de adversidades e orientações para os próximos ciclos..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Pontos Fortes e Pontos de Melhoria (Atalhos rápidos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">
                Pontos de Destaque no Jogo
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES_PONTOS_FORTES.map((tag) => {
                  const ativo = pontosFortes.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => togglePontoForte(tag)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                        ativo
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {ativo ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                Pontos de Atenção / Aprimoramento
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES_PONTOS_MELHORIA.map((tag) => {
                  const ativo = pontosMelhoria.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => togglePontoMelhoria(tag)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                        ativo
                          ? 'bg-amber-600 text-white font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {ativo ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nome do Avaliador */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Responsável pela Avaliação
            </label>
            <input
              type="text"
              value={avaliador}
              onChange={(e) => setAvaliador(e.target.value)}
              placeholder="Ex: Prof. Carlos (Técnico Sub-15)"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botões do Rodapé: Com Opção "Salvar e Avaliar Próximo Atleta" */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-center order-3 sm:order-1"
            >
              Fechar
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 order-1 sm:order-2">
              {!avaliacaoEditando && (
                <button
                  type="button"
                  onClick={() => handleSalvar(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 border border-amber-300"
                  title="Salva a avaliação deste atleta e mantém os dados da partida para avaliar o próximo jogador da categoria"
                >
                  <Plus className="w-4 h-4 text-slate-900" />
                  <span>Salvar & Avaliar Próximo</span>
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{avaliacaoEditando ? 'Atualizar Avaliação' : 'Salvar & Concluir'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
