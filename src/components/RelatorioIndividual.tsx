import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Award,
  ArrowLeft,
  Plus,
  Printer,
  ChevronRight,
  Users,
  Search,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo } from '../types';
import { formatarDataExibicao, dataParaValorOrdenacao } from '../utils/dateUtils';
import { tituloNota } from '../utils/avaliacaoUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';

interface RelatorioIndividualProps {
  atletas: Atleta[];
  atletaSelecionadoInicial?: Atleta | null;
  avaliacoes: AvaliacaoJogo[];
  onVoltar: () => void;
  onNovaAvaliacao: (atletaId?: string) => void;
  onEditarAtleta: (atleta: Atleta) => void;
}

export const RelatorioIndividual: React.FC<RelatorioIndividualProps> = ({
  atletas,
  atletaSelecionadoInicial,
  avaliacoes,
  onVoltar,
  onNovaAvaliacao,
  onEditarAtleta,
}) => {
  // Atleta ativo na tela de Histórico / Relatório (padrão o primeiro ou o passado via prop)
  const [atletaAtivoId, setAtletaAtivoId] = useState<string>(
    atletaSelecionadoInicial?.id || atletas[0]?.id || ''
  );
  const [buscaJogador, setBuscaJogador] = useState('');
  const [jogoIndexAtivo, setJogoIndexAtivo] = useState<number>(0);

  const atletaAtivo = atletas.find((a) => a.id === atletaAtivoId) || atletas[0];

  // Avaliações do atleta ativo ordenadas por data
  const avaliacoesDoAtleta = atletaAtivo
    ? avaliacoes
        .filter((av) => av.atletaId === atletaAtivo.id)
        .sort((a, b) => dataParaValorOrdenacao(b.dataJogo) - dataParaValorOrdenacao(a.dataJogo))
    : [];

  const avaliacaoSelecionada = avaliacoesDoAtleta[jogoIndexAtivo] || avaliacoesDoAtleta[0] || null;

  // Filtro de jogadores na lista de seleção rápida
  const atletasFiltrados = atletas.filter((a) =>
    a.nome.toLowerCase().includes(buscaJogador.toLowerCase()) ||
    a.categoria.toLowerCase().includes(buscaJogador.toLowerCase())
  );

  const handleSelecionarAtleta = (id: string) => {
    setAtletaAtivoId(id);
    setJogoIndexAtivo(0);
  };

  const handlePrint = () => {
    window.print();
  };

  const getCorNota = (nota: number) => {
    if (nota >= 8.5) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800';
    if (nota >= 7.0) return 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800';
    if (nota >= 5.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  // Extrai ou retorna as observações individuais por quesito
  const getObsPilar = (av: AvaliacaoJogo, pilar: 'fisica' | 'tecnica' | 'tatica' | 'mental' | 'disciplinar') => {
    if (av.observacoesPorPilar && av.observacoesPorPilar[pilar]) {
      return av.observacoesPorPilar[pilar] || '';
    }
    const texto = av.observacoes || '';
    const mapaTag: Record<string, RegExp> = {
      fisica: /\[FÍSICO\]:\s*([\s\S]*?)(?=\n\n\[|$)/i,
      tecnica: /\[TÉCNICO\]:\s*([\s\S]*?)(?=\n\n\[|$)/i,
      tatica: /\[TÁTICO\]:\s*([\s\S]*?)(?=\n\n\[|$)/i,
      mental: /\[MENTAL\]:\s*([\s\S]*?)(?=\n\n\[|$)/i,
      disciplinar: /\[DISCIPLINAR\]:\s*([\s\S]*?)(?=\n\n\[|$)/i,
    };
    const match = texto.match(mapaTag[pilar]);
    if (match) return match[1].trim();
    if (pilar === 'tecnica' && !match) return texto;
    return '';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-[120px]">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={onVoltar}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-2">
          {atletaAtivo && (
            <button
              onClick={() => onEditarAtleta(atletaAtivo)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Editar Dados
            </button>
          )}
          <button
            onClick={() => onNovaAvaliacao(atletaAtivo?.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Avaliar Jogo</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl border border-amber-300 transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Seletor Rápido de Jogadores (Cards / Carrossel Horizontal) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 no-print">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            Escolher Atleta / Ficha:
          </label>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
            {atletas.length} atletas cadastrados
          </span>
        </div>

        {/* Abinhas / Botões dos Atletas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {atletasFiltrados.map((a) => {
            const isAtivo = a.id === atletaAtivo?.id;
            return (
              <button
                key={a.id}
                onClick={() => handleSelecionarAtleta(a.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isAtivo
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{a.nome}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isAtivo
                      ? 'bg-blue-800 text-amber-300'
                      : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {a.categoria}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ficha do Jogador Selecionado (ex: Lucas Silva) */}
      {atletaAtivo ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header do Jogador com Foto e Escudo Master Soccer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-blue-600/40 shrink-0 flex items-center justify-center font-bold text-2xl text-blue-600">
                {atletaAtivo.fotoUrl ? (
                  <img src={atletaAtivo.fotoUrl} alt={atletaAtivo.nome} className="w-full h-full object-cover" />
                ) : (
                  atletaAtivo.nome.substring(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded border border-blue-200">
                    {atletaAtivo.categoria}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Status: {atletaAtivo.status}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {atletaAtivo.nome}
                  {atletaAtivo.apelido && (
                    <span className="text-slate-400 font-normal text-base ml-2">
                      "{atletaAtivo.apelido}"
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {atletaAtivo.posicao}
                  </span>
                  <span>·</span>
                  <span>Pé Dominante: <strong>{atletaAtivo.pernaDominante}</strong></span>
                  {atletaAtivo.altura && (
                    <>
                      <span>·</span>
                      <span>{atletaAtivo.altura} cm</span>
                    </>
                  )}
                  {atletaAtivo.peso && (
                    <>
                      <span>·</span>
                      <span>{atletaAtivo.peso} kg</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Jogos Avaliados
                </span>
                <span className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400">
                  {avaliacoesDoAtleta.length}
                </span>
              </div>
              <MasterSoccerEscudo size={52} className="shrink-0 drop-shadow-xs" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEÇÃO PRINCIPAL SOLICITADA: JOGOS DO JOGADOR EM ABINHAS */}
          {/* vs Brescia - vs Tigres - vs Atlético Vila */}
          {/* Abinha selecionada fica azul #2563eb */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Histórico de Jogos do Atleta ({avaliacoesDoAtleta.length}):
              </h3>
              <span className="text-xs text-slate-500">
                Selecione o jogo para ver a nota e observações
              </span>
            </div>

            {avaliacoesDoAtleta.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 text-xs space-y-2">
                <p>Nenhum jogo avaliado para {atletaAtivo.nome} ainda.</p>
                <button
                  onClick={() => onNovaAvaliacao(atletaAtivo.id)}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Avaliar Primeiro Jogo deste Atleta</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Abinhas dos Jogos (vs Brescia - vs Tigres - vs Atlético Vila) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {avaliacoesDoAtleta.map((av, index) => {
                    const isAbaAtiva = index === jogoIndexAtivo;
                    return (
                      <button
                        key={av.id}
                        onClick={() => setJogoIndexAtivo(index)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          isAbaAtiva
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        style={isAbaAtiva ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                      >
                        <span>{av.adversario}</span>
                        {av.resultado && (
                          <span
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                              isAbaAtiva
                                ? 'bg-blue-800 text-amber-300'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {av.resultado}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono ${
                            isAbaAtiva ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {formatarDataExibicao(av.dataJogo)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* DETALHES DO JOGO SELECIONADO: NOTA, LEGENDA E CAIXINHA DE OBSERVAÇÃO */}
                {avaliacaoSelecionada && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in duration-150">
                    {/* Topo do Jogo */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {avaliacaoSelecionada.adversario}
                          </span>
                          {avaliacaoSelecionada.resultado && (
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {avaliacaoSelecionada.resultado}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-0.5">
                          <span>{avaliacaoSelecionada.competicao}</span>
                          <span>·</span>
                          <span className="font-mono">{formatarDataExibicao(avaliacaoSelecionada.dataJogo)}</span>
                          <span>·</span>
                          <span className="font-mono">{avaliacaoSelecionada.minutosJogados}' em campo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Nota Geral da Partida:</span>
                        <span
                          className={`text-base font-mono font-bold px-3 py-1 rounded-lg border tabular-nums ${getCorNota(
                            avaliacaoSelecionada.notaGeral
                          )}`}
                        >
                          {avaliacaoSelecionada.notaGeral.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>

                    {/* OS 5 QUESITOS: NOTA + LEGENDA EMBAIXO + CAIXINHA FIXA DE OBSERVAÇÃO */}
                    <div className="space-y-4">
                      {/* 1. FÍSICO */}
                      <div
                        style={{
                          margin: '16px 0',
                          padding: 16,
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                        }}
                        className="dark:bg-slate-850 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>⚡</span> FÍSICO
                          </span>
                          <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                            Nota: {Math.round(avaliacaoSelecionada.notas.fisica)}/10 -{' '}
                            {tituloNota(avaliacaoSelecionada.notas.fisica)}
                          </span>
                        </div>

                        {/* Barra de Progresso Visual Azul #2563eb */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg"
                            style={{
                              width: `${(avaliacaoSelecionada.notas.fisica / 10) * 100}%`,
                              backgroundColor: '#2563eb',
                            }}
                          />
                        </div>

                        {/* LEGENDA EMBAIXO DE CADA ITEM */}
                        <div
                          style={{
                            marginTop: 10,
                            padding: 10,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#555',
                            lineHeight: 1.6,
                            textAlign: 'center',
                          }}
                          className="dark:bg-slate-900 dark:text-slate-300"
                        >
                          <b>Legenda:</b>
                          <br />
                          0 a 2 = Muito Ruim • 3 a 4 = Ruim • 5 a 6 = Precisa Melhorar •<br />
                          7 = Bom • 8 = Muito Bom • 9 = Excelente • 10 = Perfeito 👏
                        </div>

                        {/* Caixinha Fixa de Observação (120px, resize: none) */}
                        <textarea
                          readOnly
                          value={getObsPilar(avaliacaoSelecionada, 'fisica')}
                          placeholder="Observação do Físico..."
                          style={{ height: '120px', resize: 'none' }}
                          className="w-full mt-2.5 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      {/* 2. TÉCNICO */}
                      <div
                        style={{
                          margin: '16px 0',
                          padding: 16,
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                        }}
                        className="dark:bg-slate-850 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>⚽</span> TÉCNICO
                          </span>
                          <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                            Nota: {Math.round(avaliacaoSelecionada.notas.tecnica)}/10 -{' '}
                            {tituloNota(avaliacaoSelecionada.notas.tecnica)}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg"
                            style={{
                              width: `${(avaliacaoSelecionada.notas.tecnica / 10) * 100}%`,
                              backgroundColor: '#2563eb',
                            }}
                          />
                        </div>

                        {/* LEGENDA EMBAIXO DE CADA ITEM */}
                        <div
                          style={{
                            marginTop: 10,
                            padding: 10,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#555',
                            lineHeight: 1.6,
                            textAlign: 'center',
                          }}
                          className="dark:bg-slate-900 dark:text-slate-300"
                        >
                          <b>Legenda:</b>
                          <br />
                          0 a 2 = Muito Ruim • 3 a 4 = Ruim • 5 a 6 = Precisa Melhorar •<br />
                          7 = Bom • 8 = Muito Bom • 9 = Excelente • 10 = Perfeito 👏
                        </div>

                        <textarea
                          readOnly
                          value={getObsPilar(avaliacaoSelecionada, 'tecnica')}
                          placeholder="Observação do Técnico..."
                          style={{ height: '120px', resize: 'none' }}
                          className="w-full mt-2.5 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      {/* 3. TÁTICO */}
                      <div
                        style={{
                          margin: '16px 0',
                          padding: 16,
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                        }}
                        className="dark:bg-slate-850 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>🧠</span> TÁTICO
                          </span>
                          <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                            Nota: {Math.round(avaliacaoSelecionada.notas.tatica)}/10 -{' '}
                            {tituloNota(avaliacaoSelecionada.notas.tatica)}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg"
                            style={{
                              width: `${(avaliacaoSelecionada.notas.tatica / 10) * 100}%`,
                              backgroundColor: '#2563eb',
                            }}
                          />
                        </div>

                        {/* LEGENDA EMBAIXO DE CADA ITEM */}
                        <div
                          style={{
                            marginTop: 10,
                            padding: 10,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#555',
                            lineHeight: 1.6,
                            textAlign: 'center',
                          }}
                          className="dark:bg-slate-900 dark:text-slate-300"
                        >
                          <b>Legenda:</b>
                          <br />
                          0 a 2 = Muito Ruim • 3 a 4 = Ruim • 5 a 6 = Precisa Melhorar •<br />
                          7 = Bom • 8 = Muito Bom • 9 = Excelente • 10 = Perfeito 👏
                        </div>

                        <textarea
                          readOnly
                          value={getObsPilar(avaliacaoSelecionada, 'tatica')}
                          placeholder="Observação do Tático..."
                          style={{ height: '120px', resize: 'none' }}
                          className="w-full mt-2.5 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      {/* 4. MENTAL */}
                      <div
                        style={{
                          margin: '16px 0',
                          padding: 16,
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                        }}
                        className="dark:bg-slate-850 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>🎯</span> MENTAL
                          </span>
                          <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                            Nota: {Math.round(avaliacaoSelecionada.notas.mental)}/10 -{' '}
                            {tituloNota(avaliacaoSelecionada.notas.mental)}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg"
                            style={{
                              width: `${(avaliacaoSelecionada.notas.mental / 10) * 100}%`,
                              backgroundColor: '#2563eb',
                            }}
                          />
                        </div>

                        {/* LEGENDA EMBAIXO DE CADA ITEM */}
                        <div
                          style={{
                            marginTop: 10,
                            padding: 10,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#555',
                            lineHeight: 1.6,
                            textAlign: 'center',
                          }}
                          className="dark:bg-slate-900 dark:text-slate-300"
                        >
                          <b>Legenda:</b>
                          <br />
                          0 a 2 = Muito Ruim • 3 a 4 = Ruim • 5 a 6 = Precisa Melhorar •<br />
                          7 = Bom • 8 = Muito Bom • 9 = Excelente • 10 = Perfeito 👏
                        </div>

                        <textarea
                          readOnly
                          value={getObsPilar(avaliacaoSelecionada, 'mental')}
                          placeholder="Observação do Mental..."
                          style={{ height: '120px', resize: 'none' }}
                          className="w-full mt-2.5 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      {/* 5. DISCIPLINAR */}
                      <div
                        style={{
                          margin: '16px 0',
                          padding: 16,
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                        }}
                        className="dark:bg-slate-850 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>🛡️</span> DISCIPLINAR
                          </span>
                          <span style={{ color: '#2563eb' }} className="text-sm sm:text-base font-bold">
                            Nota: {Math.round(avaliacaoSelecionada.notas.disciplinar)}/10 -{' '}
                            {tituloNota(avaliacaoSelecionada.notas.disciplinar)}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg"
                            style={{
                              width: `${(avaliacaoSelecionada.notas.disciplinar / 10) * 100}%`,
                              backgroundColor: '#2563eb',
                            }}
                          />
                        </div>

                        {/* LEGENDA EMBAIXO DE CADA ITEM */}
                        <div
                          style={{
                            marginTop: 10,
                            padding: 10,
                            background: '#f9fafb',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#555',
                            lineHeight: 1.6,
                            textAlign: 'center',
                          }}
                          className="dark:bg-slate-900 dark:text-slate-300"
                        >
                          <b>Legenda:</b>
                          <br />
                          0 a 2 = Muito Ruim • 3 a 4 = Ruim • 5 a 6 = Precisa Melhorar •<br />
                          7 = Bom • 8 = Muito Bom • 9 = Excelente • 10 = Perfeito 👏
                        </div>

                        <textarea
                          readOnly
                          value={getObsPilar(avaliacaoSelecionada, 'disciplinar')}
                          placeholder="Observação do Disciplinar..."
                          style={{ height: '120px', resize: 'none' }}
                          className="w-full mt-2.5 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
          Nenhum atleta selecionado. Cadastre atletas no Plantel para visualizar os relatórios.
        </div>
      )}
    </div>
  );
};
