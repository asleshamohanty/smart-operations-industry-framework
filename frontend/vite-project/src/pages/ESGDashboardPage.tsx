import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSearchParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ESGDashboard = () => {
  const [scores, setScores] = useState<any>({});
  const [report, setReport] = useState<any>({});
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [materials, setMaterials] = useState<Array<{ material: string; quantity: number; emissions: number }>>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiReportLoading, setAiReportLoading] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErrorMsg("");
        const pid = searchParams.get("projectId");
        const materialsUrl = pid ? `${API_BASE_URL}/esg/materials?project_id=${encodeURIComponent(pid)}` : `${API_BASE_URL}/esg/materials`;
        const [scoresRes, reportRes, materialsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/esg/scores`),
          axios.get(`${API_BASE_URL}/esg/report`),
          axios.get(materialsUrl),
        ]);
        if (cancelled) return;
        const first = scoresRes.data?.data?.[0] || {};
        const aggregate = scoresRes.data?.aggregate || {};
        setScores(aggregate); // Use aggregate scores instead of first project
        setReport(reportRes.data || {});
        // Compute emissions using same factors as backend
        const FACTOR: Record<string, number> = {
          cement: 0.8,
          steel: 1.85,
          sand: 0.01,
          bricks: 0.25,
          timber: 0.5,
          glass: 0.9,
          paint: 0.6,
          concrete: 0.8,
          aluminum: 1.2,
          plastic: 0.3,
          bitumen: 0.4,
          gravel: 0.05,  // Low CO2 factor for gravel
          asphalt: 0.3,  // Moderate CO2 factor for asphalt
          "drainage pipes": 0.2,  // Low CO2 factor for pipes
          "recycled concrete": 0.3,
          "recycled steel": 0.9,  // Lower CO2 for recycled materials
          "sustainable timber": 0.2,  // Lower CO2 for sustainable timber
          "low-carbon cement": 0.4,  // Lower CO2 for low-carbon cement
          "eco-friendly paint": 0.2,  // Lower CO2 for eco-friendly paint
          "solar panels": 0.1,  // Very low CO2 for renewable energy
          "insulation material": 0.15,  // Low CO2 for insulation
          "water treatment system": 0.05,  // Very low CO2 for water systems
          "wind turbines": 0.08,  // Very low CO2 for renewable energy
          "green roof materials": 0.12,  // Low CO2 for green materials
          "skilled labor": 0.02,  // Very low CO2 for workforce
          "engineers": 0.01,  // Very low CO2 for engineers
          "supervisors": 0.01,  // Very low CO2 for supervisors
          "safety personnel": 0.01,  // Very low CO2 for safety personnel
          "equipment operators": 0.02,  // Very low CO2 for operators
          "quality inspectors": 0.01,  // Very low CO2 for inspectors
        };
        const list = (materialsRes.data?.materials || []).map((m: any) => {
          const key = String(m.material || "").toLowerCase();
          const qty = Number(m.quantity || 0);
          const factor = FACTOR[key] ?? 0;
          return { material: m.material, quantity: qty, emissions: qty * factor };
        });
        setMaterials(list);
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e?.message || "Failed to load ESG data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (scores.total_score) {
      const newAlerts = [];
      if (scores.environment_score < 70) newAlerts.push("Environmental score below BRSR threshold!");
      if (scores.social_score < 75) newAlerts.push("Social compliance below standard!");
      if (scores.governance_score < 80) newAlerts.push("Governance oversight risk!");
      if (scores.total_score < 70) newAlerts.push("Overall ESG below compliance level!");
      setAlerts(newAlerts);
    }
  }, [scores]);

  const radarData = (() => {
    const align = report?.sdg_alignment || {};
    const entries = Object.entries(align) as Array<[string, any]>;
    if (entries.length) {
      return entries.map(([k, v]) => {
        const num = parseInt(String(v)) || 0; // parse "67% (.." -> 67
        return { subject: k, value: num };
      });
    }
    // fallback to scores-based if report not ready
    return [
      { subject: "SDG 9", value: Number(scores.environment_score || 0) },
      { subject: "SDG 11", value: Number(scores.social_score || 0) },
      { subject: "SDG 12", value: Number(scores.total_score || 0) },
      { subject: "SDG 13", value: Number(scores.environment_score || 0) },
    ];
  })();

  const thresholds = report?.thresholds || {
    environment_score: 70,
    social_score: 75,
    governance_score: 80,
    total_score: 70,
  };

  const kpis = [
    {
      key: "environment_score",
      label: "Environment",
      value: Number(scores.environment_score || 0),
      threshold: thresholds.environment_score,
    },
    {
      key: "social_score",
      label: "Social",
      value: Number(scores.social_score || 0),
      threshold: thresholds.social_score,
    },
    {
      key: "governance_score",
      label: "Governance",
      value: Number(scores.governance_score || 0),
      threshold: thresholds.governance_score,
    },
    {
      key: "total_score",
      label: "Overall",
      value: Number(scores.total_score || 0),
      threshold: thresholds.total_score,
    },
  ];

  const colorFor = (value: number, threshold: number) => {
    if (value >= threshold) return "text-green-600";
    if (value >= Math.max(0, threshold - 10)) return "text-yellow-500";
    return "text-red-600";
  };

  const BLUE = "#3b82f6";

  const downloadReportPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    pdf.addImage(imgData, "PNG", (pageWidth - canvas.width * ratio) / 2, 24, canvas.width * ratio, canvas.height * ratio);
    pdf.save("esg_report.pdf");
  };

  const fetchAiReport = async () => {
    try {
      setAiReportLoading(true);
      const response = await axios.get(`${API_BASE_URL}/esg/ai-report`);
      setAiReport(response.data);
    } catch (error) {
      console.error("Error fetching AI report:", error);
      setErrorMsg("Failed to generate AI report");
    } finally {
      setAiReportLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {loading && (
        <Card className="p-6"><div className="text-muted-foreground">Loading ESG analytics…</div></Card>
      )}
      {!loading && errorMsg && (
        <Card className="p-6"><div className="text-red-600">{errorMsg}</div></Card>
      )}
      
      {/* Critical Alerts - Top Priority */}
      {alerts.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 shadow-2xl rounded-xl">
          <div className="flex items-center mb-4">
            <div className="bg-red-500 p-3 rounded-full mr-4 animate-pulse">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-red-800 mb-1">⚠️ Critical ESG Alerts</h3>
              <p className="text-red-600 font-medium">Immediate attention required</p>
            </div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-red-200">
            <ul className="space-y-2">
              {alerts.map((alert, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span className="text-red-800 font-semibold text-lg">{alert}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-red-200">
              <button
                onClick={() => {
                  const reportSection = document.getElementById('ai-esg-report');
                  if (reportSection) {
                    reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Auto-generate report after scrolling
                    setTimeout(() => {
                      if (!aiReport && !aiReportLoading) {
                        fetchAiReport();
                      }
                    }, 500);
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Generate AI ESG Report
              </button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Overall ESG Score */}
      <Card className="p-6 shadow-xl rounded-lg border border-gray-100 hover:shadow-2xl transition-all">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Overall ESG Score</h2>
            </div>
          <div className="text-5xl font-extrabold text-foreground">{Number(scores.total_score || 0).toFixed(1)}</div>
        </div>
         <div className="w-full mt-4 flex justify-center">
           <Gauge
             value={Number(scores.total_score || 0)}
             startAngle={-110}
             endAngle={110}
             sx={{
               [`& .${gaugeClasses.valueText}`]: {
                 fontSize: 44,
                 transform: 'translate(0px, 0px)',
                 fontWeight: 800,
                 fill: '#111827',
               },
               [`& .${gaugeClasses.valueArc}`]: { fill: '#16a34a' },
               [`& .${gaugeClasses.referenceArc}`]: { fill: '#e5e7eb' },
             }}
             text={({ value, valueMax }) => `${Math.round(value)} / ${valueMax}`}
             width={800}
             height={260}
           />
         </div>
      </Card>

      {/* E/S/G Scores */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {kpis.slice(0, 3).map(k => (
          <Card key={k.key} className={`p-4 shadow-md rounded-lg border border-red-300 hover:shadow-lg transition-all`}>
            <div className="flex justify-between items-center gap-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">{k.label}</h3>
              <span className={`text-xs md:text-sm font-semibold ${colorFor(k.value, k.threshold)}`}>
                Tgt {k.threshold}
              </span>
            </div>
            <div className="mt-2 text-2xl md:text-3xl font-bold">{k.value.toFixed(1)}</div>
            <div className="mt-2 flex justify-center">
              <Gauge
                value={k.value}
                startAngle={-110}
                endAngle={110}
                sx={{
                  [`& .${gaugeClasses.valueText}`]: {
                    fontSize: 22,
                    transform: 'translate(0px, 0px)',
                    fontWeight: 700,
                  },
                  [`& .${gaugeClasses.valueArc}`]: { fill: '#16a34a' },
                  [`& .${gaugeClasses.referenceArc}`]: { fill: '#e5e7eb' },
                }}
                text={({ value }) => `${Math.round(value)}`}
                width={360}
                height={180}
              />
            </div>
          </Card>
        ))}
      </div>


       {/* SDG Alignment */}
       <Card className="p-6 shadow-lg rounded-lg border border-gray-100 hover:shadow-xl transition-all">
        <h3 className="text-xl font-semibold mb-4 text-foreground">SDG Alignment</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SDG List */}
          <div className="space-y-3">
            {Object.entries(report?.sdg_alignment || {}).map(([sdg, text]) => (
              <div key={sdg} className="flex justify-between border-b pb-2 font-medium text-foreground">
                <span>{sdg}</span>
                <span className="text-muted-foreground">{String(text)}</span>
              </div>
            ))}
          </div>
          {/* Radar Chart */}
           <div className="w-full flex justify-center">
            <RadarChart outerRadius={120} width={520} height={320} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Score" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
            </RadarChart>
          </div>
        </div>
      </Card>

      {/* Materials Usage */}
      <Card className="p-6 shadow-lg rounded-lg border border-gray-100 hover:shadow-xl transition-all">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Materials Used and Emissions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Material</th>
                <th className="py-2 pr-4">Quantity (tons)</th>
                <th className="py-2 pr-4">Emissions (tCO₂)</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, idx) => (
                <tr key={`${m.material}-${idx}`} className="border-t">
                  <td className="py-2 pr-4 font-medium text-foreground">{m.material}</td>
                  <td className="py-2 pr-4">{m.quantity.toLocaleString()}</td>
                  <td className="py-2 pr-4">{m.emissions.toLocaleString()}</td>
                </tr>
              ))}
              {!materials.length && (
                <tr>
                  <td className="py-2 pr-4" colSpan={3}>No material data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Report */}
      <Card id="ai-esg-report" className="p-6 shadow-lg rounded-lg border border-gray-100 hover:shadow-xl transition-all">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">🤖 AI-Generated ESG Report</h3>
            <p className="text-sm text-muted-foreground">Powered by Gemini AI • Comprehensive analysis of your ESG data</p>
          </div>
          <div className="flex gap-2">
            {!aiReport && (
              <button
                onClick={fetchAiReport}
                disabled={aiReportLoading}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiReportLoading ? "Generating..." : "Generate Report"}
              </button>
            )}
            <button
              onClick={downloadReportPdf}
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
        
        {aiReportLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">AI is analyzing your ESG data...</p>
          </div>
        )}
        
        {aiReport && (
          <div ref={reportRef} className="space-y-6 bg-muted p-6 rounded-lg">
            {aiReport.status === "fallback" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800">Template Report</h4>
                    <p className="text-yellow-700 text-sm">{aiReport.message}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Executive Summary */}
            <div className="bg-background p-4 rounded-lg border">
              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                📊 Executive Summary
              </h4>
              <p className="text-foreground leading-relaxed">{aiReport.ai_report.executive_summary}</p>
            </div>
            
            {/* Environmental Analysis */}
            <div className="bg-background p-4 rounded-lg border">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                🌱 Environmental Analysis
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-muted-foreground">Carbon Footprint</h5>
                  <p className="text-foreground">{aiReport.ai_report.environmental_analysis.carbon_footprint}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Waste Management</h5>
                  <p className="text-foreground">{aiReport.ai_report.environmental_analysis.waste_management}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Resource Efficiency</h5>
                  <p className="text-foreground">{aiReport.ai_report.environmental_analysis.resource_efficiency}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Recommendations</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiReport.ai_report.environmental_analysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Social Analysis */}
            <div className="bg-background p-4 rounded-lg border">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                👥 Social Analysis
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-muted-foreground">Community Impact</h5>
                  <p className="text-foreground">{aiReport.ai_report.social_analysis.community_impact}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Worker Safety</h5>
                  <p className="text-foreground">{aiReport.ai_report.social_analysis.worker_safety}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Local Sourcing</h5>
                  <p className="text-foreground">{aiReport.ai_report.social_analysis.local_sourcing}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Recommendations</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiReport.ai_report.social_analysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Governance Analysis */}
            <div className="bg-background p-4 rounded-lg border">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                🏛️ Governance Analysis
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-muted-foreground">Compliance Status</h5>
                  <p className="text-foreground">{aiReport.ai_report.governance_analysis.compliance_status}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Transparency</h5>
                  <p className="text-foreground">{aiReport.ai_report.governance_analysis.transparency}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Risk Management</h5>
                  <p className="text-foreground">{aiReport.ai_report.governance_analysis.risk_management}</p>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground">Recommendations</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiReport.ai_report.governance_analysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Priority Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                ⚡ Priority Actions
              </h4>
              <ol className="list-decimal pl-5 space-y-2">
                {aiReport.ai_report.priority_actions.map((action: string, i: number) => (
                  <li key={i} className="text-foreground font-medium">{action}</li>
                ))}
              </ol>
            </div>
            
            {/* Next Steps */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                🎯 Next Steps
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                {aiReport.ai_report.next_steps.map((step: string, i: number) => (
                  <li key={i} className="text-foreground">{step}</li>
                ))}
              </ul>
            </div>
            
            {/* Data Summary */}
            <div className="bg-gray-100 p-4 rounded-lg text-sm text-muted-foreground">
              <p><strong>Analysis Summary:</strong> {aiReport.data_summary.projects_analyzed} projects, {aiReport.data_summary.materials_analyzed} materials, {aiReport.data_summary.shipments_analyzed} shipments analyzed</p>
              <p><strong>Generated:</strong> {new Date(aiReport.generated_at).toLocaleString()}</p>
            </div>
          </div>
        )}
        
        {!aiReport && !aiReportLoading && (
          <div className="text-center py-8 bg-muted rounded-lg">
            <div className="text-6xl mb-4">🤖</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">AI-Powered ESG Analysis</h4>
            <p className="text-muted-foreground mb-4">Get comprehensive insights powered by Gemini AI</p>
            <button
              onClick={fetchAiReport}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Generate AI Report
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ESGDashboard;


