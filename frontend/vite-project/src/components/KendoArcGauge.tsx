import * as React from 'react';
import { ArcGauge, ArcGaugeProps } from '@progress/kendo-react-gauges';

type Props = {
  value: number;
  width?: number;
  height?: number;
};

const colors: NonNullable<ArcGaugeProps['colors']> = [
  { to: 25, color: '#0058e9' },
  { from: 25, to: 50, color: '#37b400' },
  { from: 50, to: 75, color: '#ffc000' },
  { from: 75, color: '#f31700' },
];

export const KendoArcGauge: React.FC<Props> = ({ value, width = 520, height = 260 }) => {
  const arcOptions: ArcGaugeProps = {
    value,
    colors,
    transitions: false,
  };

  const arcCenterRenderer = (val: number, color?: string) => (
    <h3 style={{ color: color || '#111827', margin: 0, fontSize: 28, fontWeight: 800 }}>{Math.round(val)}%</h3>
  );

  return (
    <div style={{ width, height }}>
      <ArcGauge {...arcOptions} arcCenterRender={arcCenterRenderer} />
    </div>
  );
};

export default KendoArcGauge;


