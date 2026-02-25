import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const energyData = [
  { month: "Jan", usage: 1200, target: 1300 },
  { month: "Feb", usage: 1150, target: 1250 },
  { month: "Mar", usage: 1100, target: 1200 },
  { month: "Apr", usage: 1050, target: 1150 },
  { month: "May", usage: 1000, target: 1100 },
  { month: "Jun", usage: 950, target: 1050 },
];

const waterData = [
  { month: "Jan", usage: 850, target: 900 },
  { month: "Feb", usage: 820, target: 870 },
  { month: "Mar", usage: 800, target: 850 },
  { month: "Apr", usage: 780, target: 820 },
  { month: "May", usage: 760, target: 800 },
  { month: "Jun", usage: 740, target: 780 },
];

interface TrendChartProps {
  title: string;
  description: string;
  type: "energy" | "water";
}

const TrendChart = ({ title, description, type }: TrendChartProps) => {
  const data = type === "energy" ? energyData : waterData;

  return (
    <Card className="glass-panel p-6 fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="usage" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
            name="Actual Usage"
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="hsl(var(--success))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--success))' }}
            name="Target"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TrendChart;
