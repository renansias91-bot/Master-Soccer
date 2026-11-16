const STORAGE_KEY_FINANCEIRO_HASH = 'mastersoccer_financeiro_senha_hash_v1';
const USUARIO_FINANCEIRO_PADRAO = 'financeiro';
const SENHA_PADRAO_INICIAL = 'master123';
const EMAIL_ADM_PRINCIPAL = 'renan.sias91@gmail.com';

// SHA-256 em JavaScript puro para fallback caso crypto.subtle não esteja disponível (ex: HTTP local)
function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export async function gerarHashSenhaFinanceiro(texto: string): Promise<string> {
  const normalizado = `msrj_fin::${texto}`;
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(normalizado);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback abaixo
  }
  return sha256Fallback(normalizado);
}

export async function getHashPadraoFinanceiro(): Promise<string> {
  return gerarHashSenhaFinanceiro(SENHA_PADRAO_INICIAL);
}

export function getHashSenhaFinanceiroLocal(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_FINANCEIRO_HASH);
  } catch {
    return null;
  }
}

export function salvarHashSenhaFinanceiroLocal(hash: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_FINANCEIRO_HASH, hash);
  } catch {
    // ignore
  }
}

export async function verificarSenhaFinanceiro(
  senhaDigitada: string,
  hashConfigurado?: string | null
): Promise<boolean> {
  const hashAlvo = hashConfigurado || getHashSenhaFinanceiroLocal() || (await getHashPadraoFinanceiro());
  const hashDigitado = await gerarHashSenhaFinanceiro(senhaDigitada);
  return hashDigitado === hashAlvo;
}

export async function verificarCredenciaisFinanceiro(
  usuarioDigitado: string,
  senhaDigitada: string,
  hashConfigurado?: string | null
): Promise<boolean> {
  const usuarioOk = usuarioDigitado.trim().toLowerCase() === USUARIO_FINANCEIRO_PADRAO;
  if (!usuarioOk) return false;
  return verificarSenhaFinanceiro(senhaDigitada, hashConfigurado);
}

export function isAdmPrincipalEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === EMAIL_ADM_PRINCIPAL;
}
