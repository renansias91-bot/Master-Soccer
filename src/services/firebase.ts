import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableIndexedDbPersistence,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';

import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Atleta, AvaliacaoJogo, ItemCompeticaoTaxa, RegistroFinanceiroAtleta, JogoAgenda, TesteFisicoAtleta } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicialização com suporte a cache offline IndexedDB (multi-aba)
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  try {
    enableIndexedDbPersistence(firestoreInstance).catch((err) => {
      console.warn('Persistência IndexedDB aviso:', err?.message || err);
    });
  } catch {
    // Modo de fallback seguro
  }
}

export const db = firestoreInstance;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Remove recursivamente qualquer chave undefined ou null para garantir que o Firestore não rejeite
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// Teste inicial de conexão ao servidor (não bloqueante)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Master Soccer RJ: Modo offline ativo. Dados serão salvos localmente no IndexedDB.');
    }
    return false;
  }
}

export interface AvaliacaoFirestoreDoc {
  id: string;
  atletaId: string;
  nomeAtleta: string;
  categoria: string;
  data: string;
  dataJogo: string;
  nota: number;
  notaGeral: number;
  observacoes: string;
  observacoesPorPilar?: {
    tecnica?: string;
    tatica?: string;
    fisica?: string;
    mental?: string;
    disciplinar?: string;
  };
  nomeProfessor: string;
  avaliador: string;
  adversario: string;
  competicao: string;
  minutosJogados: number;
  minutos1Tempo?: number;
  minutos2Tempo?: number;
  resultado?: string;
  titular: boolean;
  notas: {
    tecnica: number;
    tatica: number;
    fisica: number;
    mental: number;
    disciplinar: number;
  };
  pontosFortes?: string[];
  pontosMelhoria?: string[];
  atualizadoEm: string;
}

export const firebaseService = {
  // Cadastrar novo atleta no Firestore com addDoc na coleção 'athletes'
  async cadastrarAtleta(atletaData: Omit<Atleta, 'id'> | Atleta): Promise<string> {
    const path = 'athletes';
    const rawData = {
      nome: (atletaData.nome || '').trim(),
      categoria: atletaData.categoria || 'SUB-15',
      posicao: atletaData.posicao || 'Meio-Campista',
      dataNascimento: atletaData.dataNascimento || '2010-01-01',
      pernaDominante: atletaData.pernaDominante || 'Destro',
      status: atletaData.status || 'Ativo',
      dataCadastro: atletaData.dataCadastro || new Date().toISOString().split('T')[0],
      ...(atletaData.apelido && atletaData.apelido.trim() ? { apelido: atletaData.apelido.trim() } : {}),
      ...(atletaData.altura && !isNaN(Number(atletaData.altura)) ? { altura: Number(atletaData.altura) } : {}),
      ...(atletaData.peso && !isNaN(Number(atletaData.peso)) ? { peso: Number(atletaData.peso) } : {}),
      ...(atletaData.numeroCamisa && !isNaN(Number(atletaData.numeroCamisa))
        ? { numeroCamisa: Number(atletaData.numeroCamisa) }
        : {}),
      ...(atletaData.fotoUrl && atletaData.fotoUrl.trim() ? { fotoUrl: atletaData.fotoUrl.trim() } : {}),
      criadoEm: new Date().toISOString(),
    };

    const payload = cleanFirestoreData(rawData);

    try {
      const docRef = await addDoc(collection(db, 'athletes'), payload);
      return docRef.id;
    } catch (error) {
      console.error('Erro no addDoc de athlete:', error);
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Atualizar atleta existente na coleção 'athletes'
  async atualizarAtleta(id: string, atletaData: Partial<Atleta>): Promise<void> {
    const path = `athletes/${id}`;
    const { id: _, ...rest } = atletaData;
    const rawData = {
      ...rest,
      atualizadoEm: new Date().toISOString(),
    };
    const payload = cleanFirestoreData(rawData);

    try {
      await setDoc(doc(db, 'athletes', id), payload, { merge: true });
    } catch (error) {
      console.error('Erro no update de athlete:', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Salvar atleta: roteador entre cadastrar (addDoc) e atualizar (setDoc merge)
  async salvarAtleta(atleta: Atleta): Promise<string> {
    if (atleta.id && !atleta.id.startsWith('atl-')) {
      await this.atualizarAtleta(atleta.id, atleta);
      return atleta.id;
    } else {
      return await this.cadastrarAtleta(atleta);
    }
  },

  // Excluir atleta no Firestore (coleção 'athletes') e TODAS as avaliações dele vinculadas
  async excluirAtleta(id: string): Promise<void> {
    const path = `athletes/${id}`;
    try {
      // 1. Apaga o atleta da coleção 'athletes'
      await deleteDoc(doc(db, 'athletes', id));
    } catch (error) {
      console.error('Erro no deleteDoc de athlete:', error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }

    // 2. Apaga todas as avaliações deste atleta no Firestore para não deixar avaliação órfã
    try {
      const q = query(collection(db, 'avaliacoes'), where('atletaId', '==', id));
      const snap = await getDocs(q);
      const promessasExclusao = snap.docs.map((docSnap) =>
        deleteDoc(doc(db, 'avaliacoes', docSnap.id))
      );
      await Promise.all(promessasExclusao);
    } catch (err) {
      console.warn('Aviso ao excluir avaliações vinculadas do atleta:', err);
    }

    // 3. Apaga registro financeiro do atleta no Firestore
    try {
      await deleteDoc(doc(db, 'financeiro_atletas', id));
    } catch (err) {
      console.warn('Aviso ao excluir financeiro do atleta:', err);
    }
  },


  // Salvar avaliação no Firestore
  async salvarAvaliacao(avaliacao: AvaliacaoJogo, nomeAtleta?: string): Promise<void> {
    const path = `avaliacoes/${avaliacao.id}`;
    const rawData: AvaliacaoFirestoreDoc = {
      id: avaliacao.id,
      atletaId: avaliacao.atletaId,
      nomeAtleta: nomeAtleta || '',
      categoria: avaliacao.categoria,
      data: avaliacao.dataJogo,
      dataJogo: avaliacao.dataJogo,
      nota: avaliacao.notaGeral,
      notaGeral: avaliacao.notaGeral,
      observacoes: avaliacao.observacoes || '',
      ...(avaliacao.observacoesPorPilar ? { observacoesPorPilar: avaliacao.observacoesPorPilar } : {}),
      nomeProfessor: avaliacao.avaliador || 'Comissão Técnica',
      avaliador: avaliacao.avaliador || 'Comissão Técnica',
      adversario: avaliacao.adversario || '',
      competicao: avaliacao.competicao || '',
      minutosJogados: avaliacao.minutosJogados || 0,
      minutos1Tempo: avaliacao.minutos1Tempo || 0,
      minutos2Tempo: avaliacao.minutos2Tempo || 0,
      resultado: avaliacao.resultado || '',
      titular: avaliacao.titular ?? true,
      notas: avaliacao.notas,
      pontosFortes: avaliacao.pontosFortes || [],
      pontosMelhoria: avaliacao.pontosMelhoria || [],
      atualizadoEm: new Date().toISOString(),
    };

    const payload = cleanFirestoreData(rawData);

    try {
      await setDoc(doc(db, 'avaliacoes', avaliacao.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Excluir avaliação no Firestore
  async excluirAvaliacao(id: string): Promise<void> {
    const path = `avaliacoes/${id}`;
    try {
      await deleteDoc(doc(db, 'avaliacoes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Buscar todos os dados do Firestore
  async buscarDados(): Promise<{ atletas: Atleta[]; avaliacoes: AvaliacaoJogo[] }> {
    const atletas: Atleta[] = [];
    const avaliacoes: AvaliacaoJogo[] = [];

    try {
      let snapAtletas = await getDocs(collection(db, 'athletes'));
      if (snapAtletas.empty) {
        // Fallback para atletas se houver registros anteriores
        const snapLegado = await getDocs(collection(db, 'atletas'));
        if (!snapLegado.empty) {
          snapAtletas = snapLegado;
        }
      }

      snapAtletas.forEach((docSnap) => {
        const d = docSnap.data();
        atletas.push({
          id: docSnap.id,
          nome: d.nome || '',
          apelido: d.apelido || '',
          categoria: d.categoria || 'SUB-15',
          posicao: d.posicao || 'Meio-Campista',
          numeroCamisa: d.numeroCamisa || undefined,
          dataNascimento: d.dataNascimento || '2009-01-01',
          pernaDominante: d.pernaDominante || 'Destro',
          altura: d.altura || undefined,
          peso: d.peso || undefined,
          status: d.status || 'Ativo',
          dataCadastro: d.dataCadastro || new Date().toISOString().split('T')[0],
          fotoUrl: d.fotoUrl || '',
        });
      });
    } catch (error) {
      console.warn('Aviso ao buscar atletas do Firestore (pode estar offline):', error);
    }

    try {
      const snapAvaliacoes = await getDocs(collection(db, 'avaliacoes'));
      snapAvaliacoes.forEach((docSnap) => {
        const d = docSnap.data();
        avaliacoes.push({
          id: d.id || docSnap.id,
          atletaId: d.atletaId || '',
          categoria: d.categoria || 'SUB-15',
          dataJogo: d.dataJogo || d.data || new Date().toISOString().split('T')[0],
          adversario: d.adversario || '',
          competicao: d.competicao || 'Campeonato',
          minutosJogados: d.minutosJogados || 0,
          minutos1Tempo: d.minutos1Tempo || 0,
          minutos2Tempo: d.minutos2Tempo || 0,
          resultado: d.resultado || '',
          titular: d.titular ?? true,
          notas: d.notas || { tecnica: 7, tatica: 7, fisica: 7, mental: 7, disciplinar: 7 },
          notaGeral: d.notaGeral ?? d.nota ?? 7,
          observacoes: d.observacoes || '',
          observacoesPorPilar: d.observacoesPorPilar || undefined,
          pontosFortes: d.pontosFortes || [],
          pontosMelhoria: d.pontosMelhoria || [],
          avaliador: d.avaliador || d.nomeProfessor || 'Comissão Técnica',
        });
      });
    } catch (error) {
      console.warn('Aviso ao buscar avaliações do Firestore (pode estar offline):', error);
    }

    return { atletas, avaliacoes };
  },

  // Observador em tempo real (onSnapshot na coleção 'athletes' e 'avaliacoes')
  observarDados(
    onAtletas: (atletas: Atleta[]) => void,
    onAvaliacoes: (avaliacoes: AvaliacaoJogo[]) => void
  ): () => void {
    const unsubAtletas = onSnapshot(
      collection(db, 'athletes'),
      (snapshot) => {
        const atls: Atleta[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          atls.push({
            id: docSnap.id,
            nome: d.nome || '',
            apelido: d.apelido || '',
            categoria: d.categoria || 'SUB-15',
            posicao: d.posicao || 'Meio-Campista',
            numeroCamisa: d.numeroCamisa || undefined,
            dataNascimento: d.dataNascimento || '2009-01-01',
            pernaDominante: d.pernaDominante || 'Destro',
            altura: d.altura || undefined,
            peso: d.peso || undefined,
            status: d.status || 'Ativo',
            dataCadastro: d.dataCadastro || new Date().toISOString().split('T')[0],
            fotoUrl: d.fotoUrl || '',
          });
        });
        onAtletas(atls);
      },
      (error) => {
        console.error('Erro no onSnapshot athletes:', error);
        alert(`Erro de conexão no Firestore (athletes): ${error.message}`);
      }
    );

    const unsubAvaliacoes = onSnapshot(
      collection(db, 'avaliacoes'),
      (snapshot) => {
        const avs: AvaliacaoJogo[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          avs.push({
            id: d.id || docSnap.id,
            atletaId: d.atletaId || '',
            categoria: d.categoria || 'SUB-15',
            dataJogo: d.dataJogo || d.data || new Date().toISOString().split('T')[0],
            adversario: d.adversario || '',
            competicao: d.competicao || 'Campeonato',
            minutosJogados: d.minutosJogados || 0,
            minutos1Tempo: d.minutos1Tempo || 0,
            minutos2Tempo: d.minutos2Tempo || 0,
            resultado: d.resultado || '',
            titular: d.titular ?? true,
            notas: d.notas || { tecnica: 7, tatica: 7, fisica: 7, mental: 7, disciplinar: 7 },
            notaGeral: d.notaGeral ?? d.nota ?? 7,
            observacoes: d.observacoes || '',
            observacoesPorPilar: d.observacoesPorPilar || undefined,
            pontosFortes: d.pontosFortes || [],
            pontosMelhoria: d.pontosMelhoria || [],
            avaliador: d.avaliador || d.nomeProfessor || 'Comissão Técnica',
          });
        });
        onAvaliacoes(avs);
      },
      (error) => {
        console.warn('Snapshot avaliacoes offline ou pausado:', error.message);
      }
    );

    return () => {
      unsubAtletas();
      unsubAvaliacoes();
    };
  },

  // ==========================================
  // SINCRONIZAÇÃO FINANCEIRA NA NUVEM
  // ==========================================

  // Salvar ou atualizar competição / taxa no Firestore
  async salvarCompeticao(comp: ItemCompeticaoTaxa): Promise<void> {
    const path = `financeiro_competicoes/${comp.id}`;
    const payload = cleanFirestoreData({
      id: comp.id,
      nome: comp.nome,
      valor: Number(comp.valor) || 0,
      tipo: comp.tipo || 'competicao',
      categoria: comp.categoria || 'TODAS',
      descricao: comp.descricao || '',
      criadoEm: comp.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    });

    try {
      await setDoc(doc(db, 'financeiro_competicoes', comp.id), payload, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar competicao no Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Excluir competição / taxa no Firestore
  async excluirCompeticao(id: string): Promise<void> {
    const path = `financeiro_competicoes/${id}`;
    try {
      await deleteDoc(doc(db, 'financeiro_competicoes', id));
    } catch (error) {
      console.error('Erro ao excluir competicao no Firestore:', error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Salvar registro financeiro do atleta (mensalidades pagas e competições pagas)
  async salvarRegistroFinanceiroAtleta(registro: RegistroFinanceiroAtleta): Promise<void> {
    const path = `financeiro_atletas/${registro.atletaId}`;
    const payload = cleanFirestoreData({
      atletaId: registro.atletaId,
      valorMensalidadePadrao: registro.valorMensalidadePadrao || 150,
      mensalidadesPagas: registro.mensalidadesPagas || [],
      competicoesPagas: registro.competicoesPagas || {},
      atualizadoEm: new Date().toISOString(),
    });

    try {
      await setDoc(doc(db, 'financeiro_atletas', registro.atletaId), payload, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar financeiro do atleta no Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Observador em tempo real para dados financeiros
  observarFinanceiro(
    onCompeticoes: (comps: ItemCompeticaoTaxa[]) => void,
    onRegistros: (registros: Record<string, RegistroFinanceiroAtleta>) => void
  ): () => void {
    const unsubCompeticoes = onSnapshot(
      collection(db, 'financeiro_competicoes'),
      (snapshot) => {
        const comps: ItemCompeticaoTaxa[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          comps.push({
            id: docSnap.id,
            nome: d.nome || '',
            valor: Number(d.valor) || 0,
            tipo: d.tipo || 'competicao',
            categoria: d.categoria || 'TODAS',
            descricao: d.descricao || '',
            criadoEm: d.criadoEm || '',
          });
        });
        if (comps.length > 0) {
          onCompeticoes(comps);
        }
      },
      (error) => {
        console.warn('Snapshot financeiro_competicoes offline ou pausado:', error.message);
      }
    );

    const unsubRegistros = onSnapshot(
      collection(db, 'financeiro_atletas'),
      (snapshot) => {
        const registros: Record<string, RegistroFinanceiroAtleta> = {};
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          registros[docSnap.id] = {
            atletaId: docSnap.id,
            valorMensalidadePadrao: Number(d.valorMensalidadePadrao) || 150,
            mensalidadesPagas: Array.isArray(d.mensalidadesPagas) ? d.mensalidadesPagas : [],
            competicoesPagas: d.competicoesPagas && typeof d.competicoesPagas === 'object' ? d.competicoesPagas : {},
            atualizadoEm: d.atualizadoEm || '',
          };
        });
        onRegistros(registros);
      },
      (error) => {
        console.warn('Snapshot financeiro_atletas offline ou pausado:', error.message);
      }
    );

    return () => {
      unsubCompeticoes();
      unsubRegistros();
    };
  },

  // ==========================================
  // JOGOS DA AGENDA
  // ==========================================
  async salvarJogo(jogo: JogoAgenda): Promise<void> {
    const path = `jogos/${jogo.id}`;
    const payload = cleanFirestoreData({
      id: jogo.id,
      adversario: (jogo.adversario || '').trim(),
      dataJogo: jogo.dataJogo || '',
      hora: jogo.hora || '',
      categoria: jogo.categoria || 'SUB-15',
      local: jogo.local || '',
      tipo: jogo.tipo || 'Campeonato',
      placar: jogo.placar || '',
      realizado: Boolean(jogo.realizado),
      observacoesGerais: jogo.observacoesGerais || '',
      criadoEm: jogo.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    });

    try {
      await setDoc(doc(db, 'jogos', jogo.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async excluirJogo(id: string): Promise<void> {
    const path = `jogos/${id}`;
    try {
      await deleteDoc(doc(db, 'jogos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  observarJogos(onJogos: (jogos: JogoAgenda[]) => void): () => void {
    const unsub = onSnapshot(
      collection(db, 'jogos'),
      (snapshot) => {
        const jogos: JogoAgenda[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          jogos.push({
            id: d.id || docSnap.id,
            adversario: d.adversario || '',
            dataJogo: d.dataJogo || '',
            hora: d.hora || '',
            categoria: d.categoria || 'SUB-15',
            local: d.local || '',
            tipo: d.tipo || 'Campeonato',
            placar: d.placar || '',
            realizado: Boolean(d.realizado),
            observacoesGerais: d.observacoesGerais || '',
            criadoEm: d.criadoEm || '',
          });
        });
        if (jogos.length > 0) {
          onJogos(jogos);
        }
      },
      (error) => {
        console.warn('Snapshot jogos offline ou pausado:', error.message);
      }
    );
    return unsub;
  },

  // ==========================================
  // TESTES FÍSICOS
  // ==========================================
  async salvarTesteFisico(teste: TesteFisicoAtleta): Promise<void> {
    const path = `testes_fisicos/${teste.id}`;
    const payload = cleanFirestoreData({
      id: teste.id,
      atletaId: teste.atletaId,
      data: teste.data,
      categoria: teste.categoria,
      ...(teste.velocidade30m !== undefined ? { velocidade30m: Number(teste.velocidade30m) } : {}),
      ...(teste.saltoVertical !== undefined ? { saltoVertical: Number(teste.saltoVertical) } : {}),
      ...(teste.resistenciaYoYo !== undefined ? { resistenciaYoYo: Number(teste.resistenciaYoYo) } : {}),
      ...(teste.agilidadeShuttle !== undefined ? { agilidadeShuttle: Number(teste.agilidadeShuttle) } : {}),
      ...(teste.flexibilidadeBanco !== undefined ? { flexibilidadeBanco: Number(teste.flexibilidadeBanco) } : {}),
      ...(teste.estatura !== undefined ? { estatura: Number(teste.estatura) } : {}),
      ...(teste.massaCorporal !== undefined ? { massaCorporal: Number(teste.massaCorporal) } : {}),
      observacoes: teste.observacoes || '',
      avaliador: teste.avaliador || 'Preparação Física',
      atualizadoEm: new Date().toISOString(),
    });

    try {
      await setDoc(doc(db, 'testes_fisicos', teste.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async excluirTesteFisico(id: string): Promise<void> {
    const path = `testes_fisicos/${id}`;
    try {
      await deleteDoc(doc(db, 'testes_fisicos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  observarTestesFisicos(onTestes: (testes: TesteFisicoAtleta[]) => void): () => void {
    const unsub = onSnapshot(
      collection(db, 'testes_fisicos'),
      (snapshot) => {
        const testes: TesteFisicoAtleta[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          testes.push({
            id: d.id || docSnap.id,
            atletaId: d.atletaId || '',
            data: d.data || '',
            categoria: d.categoria || 'SUB-15',
            velocidade30m: d.velocidade30m !== undefined ? Number(d.velocidade30m) : undefined,
            saltoVertical: d.saltoVertical !== undefined ? Number(d.saltoVertical) : undefined,
            resistenciaYoYo: d.resistenciaYoYo !== undefined ? Number(d.resistenciaYoYo) : undefined,
            agilidadeShuttle: d.agilidadeShuttle !== undefined ? Number(d.agilidadeShuttle) : undefined,
            flexibilidadeBanco: d.flexibilidadeBanco !== undefined ? Number(d.flexibilidadeBanco) : undefined,
            estatura: d.estatura !== undefined ? Number(d.estatura) : undefined,
            massaCorporal: d.massaCorporal !== undefined ? Number(d.massaCorporal) : undefined,
            observacoes: d.observacoes || '',
            avaliador: d.avaliador || 'Preparação Física',
          });
        });
        if (testes.length > 0) {
          onTestes(testes);
        }
      },
      (error) => {
        console.warn('Snapshot testes_fisicos offline ou pausado:', error.message);
      }
    );
    return unsub;
  },
};
