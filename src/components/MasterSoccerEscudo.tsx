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
