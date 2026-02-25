import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

const delayData = [
  { date: "Week 1", actual: 2, predicted: 2.5, confidence: [1.5, 3.5] },
  { date: "Week 2", actual: 3, predicted: 4, confidence: [3, 5] },
  { date: "Week 3", actual: 5, predicted: 6, confidence: [4.5, 7.5] },
  { date: "Week 4", predicted: 8, confidence: [6, 10] },
  { date: "Week 5", predicted: 9, confidence: [7, 11] },
  { date: "Week 6", predicted: 10, confidence: [8, 12] },
];

const costData = [
  { date: "Week 1", actual: 100, predicted: 102, confidence: [95, 110] },
  { date: "Week 2", actual: 105, predicted: 110, confidence: [100, 120] },
  { date: "Week 3", actual: 115, predicted: 122, confidence: [110, 135] },
  { date: "Week 4", predicted: 135, confidence: [120, 150] },
  { date: "Week 5", predicted: 145, confidence: [130, 165] },
  { date: "Week 6", predicted: 158, confidence: [140, 180] },
];

interface ForecastChartProps {
  title: string;
  description: string;
  type: "delay" | "cost";
}

const ForecastChart = ({ title, description, type }: ForecastChartProps) => {
  const data = type === "delay" ? delayData : costData;
  const unit = type === "delay" ? "days" : "% of budget";

  return (
    <Card className="glass-panel p-6 fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            label={{ value: unit, angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="confidence" 
            fill="hsl(var(--primary))" 
            fillOpacity={0.2}
            stroke="none"
            name="Confidence Range"
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="hsl(var(--success))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--success))' }}
            name="Actual"
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--primary))' }}
            name="Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ForecastChart;
