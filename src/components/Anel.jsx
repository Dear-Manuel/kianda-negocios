// O "Anel" é o elemento assinatura da app: um anel de progresso desenhado à
// mão (traço arredondado sobre uma pista tracejada) usado para mostrar o
// gasto de uma categoria face ao limite planeado.
export default function Anel({ percent, color = '#d4a24c', size = 64, label, sublabel }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="anel-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray="2 5"
        />
        <circle
          className="anel-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={clamped >= 100 ? '#e8664f' : color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {label && <span className="text-xs text-cream font-medium text-center leading-tight">{label}</span>}
      {sublabel && <span className="text-[10px] text-muted text-center leading-tight">{sublabel}</span>}
    </div>
  );
}
