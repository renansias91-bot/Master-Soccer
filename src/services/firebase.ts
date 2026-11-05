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
import { Atleta, AvaliacaoJogo } from '../types';

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
};
