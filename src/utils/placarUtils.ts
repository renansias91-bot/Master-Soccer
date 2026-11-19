export type ResultadoPlacar = 'V' | 'E' | 'D';

export interface PlacarNumerico {
  golsMaster: number;
  golsAdversario: number;
  resultado: ResultadoPlacar;
  textoLimpo: string;
}

export function calcularResultadoPlacar(
  golsMaster: number,
  golsAdversario: number
): ResultadoPlacar {
  if (golsMaster > golsAdversario) return 'V';
  if (golsMaster === golsAdversario) return 'E';
  return 'D';
}

/**
 * Extrai os gols numéricos do Master e do Adversário de qualquer formato salvo,
 * removendo letras antigas (como "D 1x0", "V 2x1") e garantindo cálculo automático de V/E/D.
 */
export function extrairPlacarNumerico(placar?: string): PlacarNumerico | null {
  if (!placar) return null;
  const texto = placar.trim();
  if (!texto || /^ex\s*:/i.test(texto)) return null;

  const matchComLetra = texto.match(/^([VEDved])\s+(\d+)\s*[xX×-]\s*(\d+)$/);
  if (matchComLetra) {
    const letra = matchComLetra[1].toUpperCase();
    let golsMaster = parseInt(matchComLetra[2], 10);
    let golsAdversario = parseInt(matchComLetra[3], 10);

    // Corrige registros legados onde o usuário digitou "D 1x0" querendo dizer derrota do Master por 0x1
    if (letra === 'D' && golsMaster > golsAdversario) {
      [golsMaster, golsAdversario] = [golsAdversario, golsMaster];
    } else if (letra === 'V' && golsMaster < golsAdversario) {
      [golsMaster, golsAdversario] = [golsAdversario, golsMaster];
    }

    const resultado = calcularResultadoPlacar(golsMaster, golsAdversario);
    return {
      golsMaster,
      golsAdversario,
      resultado,
      textoLimpo: `${golsMaster} x ${golsAdversario}`,
    };
  }

  const matchNumeros = texto.match(/(\d+)\s*[xX×-]\s*(\d+)/);
  if (!matchNumeros) return null;

  const golsMaster = parseInt(matchNumeros[1], 10);
  const golsAdversario = parseInt(matchNumeros[2], 10);
  if (Number.isNaN(golsMaster) || Number.isNaN(golsAdversario)) return null;

  const resultado = calcularResultadoPlacar(golsMaster, golsAdversario);
  return {
    golsMaster,
    golsAdversario,
    resultado,
    textoLimpo: `${golsMaster} x ${golsAdversario}`,
  };
}

export function formatarPlacarLimpo(placar?: string): string | undefined {
  const parsed = extrairPlacarNumerico(placar);
  return parsed ? parsed.textoLimpo : undefined;
}
