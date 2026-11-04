import React from 'react';

interface MasterSoccerEscudoProps {
  className?: string;
  size?: number;
}

export const MasterSoccerEscudo: React.FC<MasterSoccerEscudoProps> = ({
  className = 'w-10 h-10',
  size = 48,
}) => {
  return (
    <img
      src="/assets/master_soccer_escudo.png"
      alt="Escudo Oficial Master Soccer - Rio de Janeiro - Brasil"
      width={size}
      height={size}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{ width: size, height: size, aspectRatio: '838 / 935' }}
      loading="eager"
      decoding="async"
    />
  );
};
