import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const comparisonData = [
  {
    phase: "Q1 2024",
    sustainable: 85,
    traditional: 62,
  },
  {
    phase: "Q2 2024",
    sustainable: 88,
    traditional: 65,
  },
  {
    phase: "Q3 2024",
    sustainable: 92,
    traditional: 68,
  },
  {
    phase: "Q4 2024",
    sustainable: 95,
    traditional: 70,
  },
];

const ComparisonChart = () => {
  return (
    <Card className="glass-panel p-6 fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Sustainability Performance Comparison
        </h3>
        <p className="text-sm text-muted-foreground">
          Comparing sustainable vs traditional project phases
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="phase" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            label={{ 
              value: 'Performance Score', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="sustainable" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
            name="Sustainable Projects"
          />
          <Bar 
            dataKey="traditional" 
            fill="hsl(var(--muted))" 
            radius={[8, 8, 0, 0]}
            name="Traditional Projects"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ComparisonChart;
