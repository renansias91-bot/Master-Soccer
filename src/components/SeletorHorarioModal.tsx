import React, { useEffect, useRef, useState } from 'react';
import { Clock, Keyboard } from 'lucide-react';

interface SeletorHorarioModalProps {
  isOpen: boolean;
  valorInicial: string;
  onClose: () => void;
  onConfirm: (horaHHMM: string) => void;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

const parseHoraInicial = (valor: string): { hora: number; minuto: number } => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((valor || '').trim());
  if (match) {
    return { hora: Number(match[1]), minuto: Number(match[2]) };
  }
  return { hora: 12, minuto: 0 };
};

const aplicarMascaraHoraManual = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
};

const HORAS_EXTERNAS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const HORAS_INTERNAS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const MINUTOS_MARCAS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const DIAL_SIZE = 256;
const DIAL_CENTER = DIAL_SIZE / 2;
const RAIO_EXTERNO = 98;
const RAIO_INTERNO = 64;
const LIMIAR_INTERNO = 79;

export const SeletorHorarioModal: React.FC<SeletorHorarioModalProps> = ({
  isOpen,
  valorInicial,
  onClose,
  onConfirm,
}) => {
  const [horaSelecionada, setHoraSelecionada] = useState(12);
  const [minutoSelecionado, setMinutoSelecionado] = useState(0);
  const [etapa, setEtapa] = useState<'hora' | 'minuto'>('hora');
  const [modo, setModo] = useState<'relogio' | 'teclado'>('relogio');
  const [textoManual, setTextoManual] = useState('12:00');
  const [erroManual, setErroManual] = useState('');

  const dialRef = useRef<HTMLDivElement | null>(null);
  const inputManualRef = useRef<HTMLInputElement | null>(null);
  const arrastandoRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const { hora, minuto } = parseHoraInicial(valorInicial);
    setHoraSelecionada(hora);
    setMinutoSelecionado(minuto);
    setTextoManual(`${pad2(hora)}:${pad2(minuto)}`);
    setEtapa('hora');
    setModo('relogio');
    setErroManual('');
    arrastandoRef.current = false;
  }, [isOpen, valorInicial]);

  useEffect(() => {
    if (isOpen && modo === 'teclado') {
      requestAnimationFrame(() => {
        if (inputManualRef.current) {
          inputManualRef.current.focus();
          inputManualRef.current.select();
        }
      });
    }
  }, [isOpen, modo]);

  if (!isOpen) return null;

  const atualizarPorPonteiro = (clientX: number, clientY: number) => {
    const el = dialRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const distancia = Math.hypot(dx, dy);

    // Ângulo em graus no sentido horário a partir das 12h (topo = 0°)
    let angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angulo < 0) angulo += 360;

    if (etapa === 'hora') {
      const setor = Math.round(angulo / 30) % 12;
      const usarInterno = distancia < (LIMIAR_INTERNO * rect.width) / DIAL_SIZE;
      const novaHora = usarInterno ? HORAS_INTERNAS[setor] : HORAS_EXTERNAS[setor];
      setHoraSelecionada(novaHora);
      setTextoManual(`${pad2(novaHora)}:${pad2(minutoSelecionado)}`);
    } else {
      const novoMinuto = Math.round(angulo / 6) % 60;
      setMinutoSelecionado(novoMinuto);
      setTextoManual(`${pad2(horaSelecionada)}:${pad2(novoMinuto)}`);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    arrastandoRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    atualizarPorPonteiro(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastandoRef.current) return;
    atualizarPorPonteiro(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastandoRef.current) return;
    arrastandoRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    atualizarPorPonteiro(e.clientX, e.clientY);
    if (etapa === 'hora') {
      setEtapa('minuto');
    }
  };

  const alternarModo = () => {
    if (modo === 'relogio') {
      setTextoManual(`${pad2(horaSelecionada)}:${pad2(minutoSelecionado)}`);
      setErroManual('');
      setModo('teclado');
    } else {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(textoManual.trim());
      if (match) {
        setHoraSelecionada(Number(match[1]));
        setMinutoSelecionado(Number(match[2]));
      }
      setErroManual('');
      setModo('relogio');
    }
  };

  const handleAlterarTextoManual = (valor: string) => {
    const mascarado = aplicarMascaraHoraManual(valor);
    setTextoManual(mascarado);
    setErroManual('');
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(mascarado);
    if (match) {
      setHoraSelecionada(Number(match[1]));
      setMinutoSelecionado(Number(match[2]));
    }
  };

  const handleConfirmar = () => {
    if (modo === 'teclado') {
      const limpo = textoManual.trim();
      const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(limpo);
      if (!match) {
        setErroManual('Informe um horário válido entre 00:00 e 23:59.');
        if (inputManualRef.current) {
          inputManualRef.current.focus();
          inputManualRef.current.select();
        }
        return;
      }
      const hh = pad2(Number(match[1]));
      const mm = pad2(Number(match[2]));
      onConfirm(`${hh}:${mm}`);
      return;
    }

    onConfirm(`${pad2(horaSelecionada)}:${pad2(minutoSelecionado)}`);
  };

  // Cálculo da posição do ponteiro no relógio
  const isHoraInterna =
    etapa === 'hora' && (horaSelecionada === 0 || horaSelecionada >= 13);
  const raioPonteiro =
    etapa === 'hora' ? (isHoraInterna ? RAIO_INTERNO : RAIO_EXTERNO) : RAIO_EXTERNO;
  const anguloGraus =
    etapa === 'hora' ? (horaSelecionada % 12) * 30 : minutoSelecionado * 6;
  const anguloRad = ((anguloGraus - 90) * Math.PI) / 180;
  const pontaX = DIAL_CENTER + raioPonteiro * Math.cos(anguloRad);
  const pontaY = DIAL_CENTER + raioPonteiro * Math.sin(anguloRad);
  const minutoEmPontoDe5 = minutoSelecionado % 5 === 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[332px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Título superior igual Relógio Android */}
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Selecionar horário
        </div>

        {modo === 'relogio' ? (
          <>
            {/* Visor Digital Grande [HH] : [MM] */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => setEtapa('hora')}
                className={`w-[92px] h-[68px] rounded-2xl text-[40px] leading-none font-black flex items-center justify-center transition-all cursor-pointer border-2 ${
                  etapa === 'hora'
                    ? 'bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-500'
                    : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {pad2(horaSelecionada)}
              </button>

              <span className="text-[40px] font-black text-slate-700 dark:text-slate-300 leading-none pb-1">
                :
              </span>

              <button
                type="button"
                onClick={() => setEtapa('minuto')}
                className={`w-[92px] h-[68px] rounded-2xl text-[40px] leading-none font-black flex items-center justify-center transition-all cursor-pointer border-2 ${
                  etapa === 'minuto'
                    ? 'bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-500'
                    : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {pad2(minutoSelecionado)}
              </button>
            </div>

            {/* Relógio Redondo (Dial Picker 24h) */}
            <div className="flex justify-center mb-4">
              <div
                ref={dialRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 touch-none cursor-pointer"
                style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
              >
                {/* Haste + Ponteiro + Círculo ativo */}
                <svg
                  width={DIAL_SIZE}
                  height={DIAL_SIZE}
                  className="absolute inset-0 pointer-events-none"
                >
                  <line
                    x1={DIAL_CENTER}
                    y1={DIAL_CENTER}
                    x2={pontaX}
                    y2={pontaY}
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx={DIAL_CENTER} cy={DIAL_CENTER} r="4.5" fill="#2563eb" />
                  <circle cx={pontaX} cy={pontaY} r="19" fill="#2563eb" />
                  {etapa === 'minuto' && !minutoEmPontoDe5 && (
                    <circle cx={pontaX} cy={pontaY} r="3" fill="#ffffff" />
                  )}
                </svg>

                {/* Números das Horas (Anel externo 12, 1..11 + Anel interno 00, 13..23) */}
                {etapa === 'hora' && (
                  <>
                    {HORAS_EXTERNAS.map((h, i) => {
                      const rad = ((i * 30 - 90) * Math.PI) / 180;
                      const x = DIAL_CENTER + RAIO_EXTERNO * Math.cos(rad);
                      const y = DIAL_CENTER + RAIO_EXTERNO * Math.sin(rad);
                      const ativo = horaSelecionada === h;
                      return (
                        <div
                          key={`ext-${h}`}
                          className={`absolute w-9 h-9 -ml-[18px] -mt-[18px] flex items-center justify-center rounded-full text-sm font-bold pointer-events-none transition-colors ${
                            ativo
                              ? 'text-white font-black'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                          style={{ left: x, top: y }}
                        >
                          {h}
                        </div>
                      );
                    })}

                    {HORAS_INTERNAS.map((h, i) => {
                      const rad = ((i * 30 - 90) * Math.PI) / 180;
                      const x = DIAL_CENTER + RAIO_INTERNO * Math.cos(rad);
                      const y = DIAL_CENTER + RAIO_INTERNO * Math.sin(rad);
                      const ativo = horaSelecionada === h;
                      return (
                        <div
                          key={`int-${h}`}
                          className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-xs font-bold pointer-events-none transition-colors ${
                            ativo
                              ? 'text-white font-black'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                          style={{ left: x, top: y }}
                        >
                          {pad2(h)}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Números dos Minutos (00..55 de 5 em 5) */}
                {etapa === 'minuto' &&
                  MINUTOS_MARCAS.map((m, i) => {
                    const rad = ((i * 30 - 90) * Math.PI) / 180;
                    const x = DIAL_CENTER + RAIO_EXTERNO * Math.cos(rad);
                    const y = DIAL_CENTER + RAIO_EXTERNO * Math.sin(rad);
                    const ativo = minutoSelecionado === m;
                    return (
                      <div
                        key={`min-${m}`}
                        className={`absolute w-9 h-9 -ml-[18px] -mt-[18px] flex items-center justify-center rounded-full text-sm font-bold pointer-events-none transition-colors ${
                          ativo
                            ? 'text-white font-black'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                        style={{ left: x, top: y }}
                      >
                        {pad2(m)}
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        ) : (
          /* Modo Digitação Manual (ícone de teclado no rodapé alterna para cá) */
          <div className="py-3 space-y-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              Digite o horário (24h · HH:MM)
            </label>
            <input
              ref={inputManualRef}
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={textoManual}
              onChange={(e) => handleAlterarTextoManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmar();
                }
              }}
              placeholder="14:30"
              className="w-full h-16 px-4 text-center text-3xl font-black tracking-widest bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {erroManual ? (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">
                {erroManual}
              </p>
            ) : (
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center">
                Digite direto (ex: 1212 para 12:12 ou 1430 para 14:30)
              </p>
            )}
          </div>
        )}

        {/* Rodapé: Ícone Teclado/Relógio à esquerda + Cancelar e OK à direita */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={alternarModo}
            title={modo === 'relogio' ? 'Digitar horário manualmente' : 'Voltar ao relógio'}
            aria-label={modo === 'relogio' ? 'Digitar horário manualmente' : 'Voltar ao relógio'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {modo === 'relogio' ? (
              <Keyboard className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-xs transition-all cursor-pointer"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
