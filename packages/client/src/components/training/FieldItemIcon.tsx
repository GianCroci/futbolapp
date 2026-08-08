import { FieldItem } from '../../types';

interface FieldItemIconProps {
  item: FieldItem;
  isSelected?: boolean;
}

export function FieldItemIcon({ item, isSelected }: FieldItemIconProps) {
  const renderIcon = () => {
    switch (item.type) {
      case 'cone':
        return (
          <g transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale ?? 1})`}>
            <polygon points="0,-3 -2.5,3 2.5,3" fill="#FF6B35" stroke="#CC4400" strokeWidth="0.3" />
            {item.label && (
              <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="2.2" fontWeight="bold" paintOrder="stroke" stroke="rgba(0,0,0,0.7)" strokeWidth="0.3" style={{ userSelect: 'none', pointerEvents: 'none' }}>{item.label}</text>
            )}
          </g>
        );

      case 'ball':
        return (
          <g transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale ?? 1})`}>
            <circle r="2" fill="white" stroke="#333" strokeWidth="0.2" />
            <polygon points="0,-0.8 0.8,-0.3 0.5,0.6 -0.5,0.6 -0.8,-0.3" fill="#333" />
            {item.label && (
              <text textAnchor="middle" dominantBaseline="central" fill="#1f2937" fontSize="2.2" fontWeight="bold" paintOrder="stroke" stroke="white" strokeWidth="0.4" style={{ userSelect: 'none', pointerEvents: 'none' }}>{item.label}</text>
            )}
          </g>
        );

      case 'arrow': {
        const len = item.length ?? 10;
        const half = len / 2;
        return (
          <g transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}>
            {/* Fixed stroke width — length varies, width does NOT */}
            <line x1="0" y1={half} x2="0" y2={-half} stroke="#2196F3" strokeWidth="0.9" strokeLinecap="round" />
            {/* Fixed-size arrowhead at the tip (y = -half) */}
            <polygon points={`0,${-half - 1.2} -1.8,${-half + 1.6} 1.8,${-half + 1.6}`} fill="#2196F3" />
            {item.label && (
              <text x="2.6" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="2.2" fontWeight="bold" paintOrder="stroke" stroke="#1565C0" strokeWidth="0.5" style={{ userSelect: 'none', pointerEvents: 'none' }}>{item.label}</text>
            )}
          </g>
        );
      }

      case 'player':
        return (
          <g transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale ?? 1})`}>
            <circle r="3.5" fill="#4CAF50" stroke="white" strokeWidth="0.5" />
            <circle r="2.8" fill="none" stroke="white" strokeWidth="0.3" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="3"
              fontWeight="bold"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {item.label || ''}
            </text>
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <g>
      {renderIcon()}
      {isSelected && (
        <circle
          cx={item.x}
          cy={item.y}
          r={item.type === 'player' ? 5 : 4}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="0.4"
          strokeDasharray="1,0.8"
        />
      )}
    </g>
  );
}
