import React from 'react';

interface MasterSoccerEscudoProps {
  className?: string;
  size?: number;
}

export const MasterSoccerEscudo: React.FC<MasterSoccerEscudoProps> = ({
  className = '',
  size = 48,
}) => {
  return (
    <img
      src="/assets/master_soccer_escudo.png?v=3"
      alt="Escudo Oficial Master Soccer - Rio de Janeiro - Brasil"
      width={size}
      height={size}
      className={`object-contain object-center select-none shrink-0 bg-transparent ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
      decoding="async"
    />
  );
};

export const PecEscudo: React.FC<MasterSoccerEscudoProps> = ({
  className = '',
  size = 48,
}) => {
  return (
    <img
      src="/assets/pec_escudo.png?v=1"
      alt="Escudo Oficial PEC - Paduano Esporte Clube"
      width={size}
      height={size}
      className={`object-contain object-center select-none shrink-0 bg-transparent ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
      decoding="async"
    />
  );
};

interface CabecalhoParceriaDocumentoProps {
  logoSize?: number;
  compacto?: boolean;
  tituloDocumento?: string;
  subtituloDocumento?: string;
  infoDireita?: React.ReactNode;
  className?: string;
}

export const CabecalhoParceriaDocumento: React.FC<CabecalhoParceriaDocumentoProps> = ({
  logoSize = 48,
  compacto = false,
  tituloDocumento,
  subtituloDocumento,
  infoDireita,
  className = '',
}) => {
  return (
    <div
      className={`w-full border-b-2 border-slate-900 ${
        compacto ? 'pb-2 space-y-1.5' : 'pb-4 space-y-2.5'
      } ${className}`}
    >
      {/* Topo centralizado: Logo MASTER (esquerda) + Logo PEC (direita) do mesmo tamanho */}
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`flex items-center justify-center ${
            compacto ? 'gap-3.5 sumula-escudo' : 'gap-4 sm:gap-5'
          }`}
        >
          <MasterSoccerEscudo size={logoSize} />
          <PecEscudo size={logoSize} />
        </div>
        <p
          className={`font-black uppercase whitespace-nowrap ${
            compacto
              ? 'text-[9px] tracking-wider mt-1'
              : 'text-[9.5px] sm:text-[11px] tracking-widest mt-1.5'
          }`}
          style={{ color: '#334155' }}
        >
          MASTER SOCCER RJ / PADUANO ESPORTE CLUBE
        </p>
      </div>

      {/* Faixa opcional com título do documento e metadados */}
      {(tituloDocumento || subtituloDocumento || infoDireita) && (
        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="min-w-0">
            {tituloDocumento && (
              <h2
                className={`font-black uppercase tracking-tight leading-tight ${
                  compacto ? 'sumula-titulo text-sm sm:text-base' : 'text-base sm:text-lg'
                }`}
                style={{ color: '#020617' }}
              >
                {tituloDocumento}
              </h2>
            )}
            {subtituloDocumento && (
              <p
                className={`font-bold uppercase tracking-wide ${
                  compacto ? 'text-[10px]' : 'text-[11px] mt-0.5'
                }`}
                style={{ color: '#475569' }}
              >
                {subtituloDocumento}
              </p>
            )}
          </div>
          {infoDireita && <div className="text-right shrink-0">{infoDireita}</div>}
        </div>
      )}
    </div>
  );
};
