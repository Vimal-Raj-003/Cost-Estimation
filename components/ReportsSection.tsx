
import React, { useMemo } from 'react';
import { CalculationResult, ProjectMetadata, UserInputs } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ComposedChart, Area
} from 'recharts';
import { 
  FileText, Download, TrendingUp, AlertCircle, Info, Layers, 
  Zap, Users, ShoppingBag, DollarSign, Activity, Package, Clock, ShieldAlert, 
  ChevronRight, ArrowRight, Printer, Copy, Check, Filter
} from 'lucide-react';
import { calculateCosts } from '../utils/calculations';

interface ReportsSectionProps {
  metadata: ProjectMetadata;
  inputs: UserInputs;
  result: CalculationResult;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

const COLORS = {
  material: '#5DADE2', // Blue
  process: '#48C9B0',  // Teal
  labor: '#F5B041',    // Amber
  overhead: '#AF7AC5', // Purple
  purchased: '#E59866',// Orange
  profit: '#58D68D',   // Green
  textMuted: '#94a3b8'
};

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);

const formatNumber = (val: number, decimals = 2) => 
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);

export const ReportsSection: React.FC<ReportsSectionProps> = ({ 
  metadata, inputs, result, onExportPDF, onExportExcel 
}) => {
  
  // 1. Cost vs Volume Trend Data
  const trendData = useMemo(() => {
    const volumes = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
    return volumes.map(v => {
      const res = calculateCosts({ ...inputs, annualVolume: v });
      return {
        volume: v >= 1000000 ? `${v/1000000}M` : `${v/1000}k`,
        cost: res.totalPartCost,
        rawVol: v
      };
    });
  }, [inputs]);

  // 2. Waterfall Data (Cumulative Build-up)
  const waterfallData = useMemo(() => {
    const components = [
      { name: 'Material', val: result.materialCostPerPart, color: COLORS.material },
      { name: 'Process', val: result.processCostPerPart, color: COLORS.process },
      { name: 'Pack/OH', val: result.packagingCost + result.sgaCost, color: COLORS.overhead },
      { name: 'Items', val: result.purchasedItemsCost, color: COLORS.purchased },
      { name: 'Margin', val: result.profitCost, color: COLORS.profit },
    ];

    let cumulative = 0;
    const items = components.map(c => {
      const start = cumulative;
      cumulative += c.val;
      return {
        ...c,
        start,
        displayVal: c.val
      };
    });

    // Add final total bar
    items.push({
      name: 'Total',
      val: result.totalPartCost,
      start: 0,
      displayVal: result.totalPartCost,
      color: '#1F3A5F' // brand-primary
    });

    return items;
  }, [result]);

  // 3. Distribution Data
  const distributionData = [
    { name: 'Material', value: result.materialCostPerPart, color: COLORS.material },
    { name: 'Process', value: result.processCostPerPart, color: COLORS.process },
    { name: 'Overhead', value: result.sgaCost + result.packagingCost, color: COLORS.overhead },
    { name: 'Purchased', value: result.purchasedItemsCost, color: COLORS.purchased },
    { name: 'Margin', value: result.profitCost, color: COLORS.profit },
  ].filter(d => d.value > 0);

  // 4. Process breakdown
  const processData = [
    { name: 'Machine', value: result.machineCostPerPart, fill: COLORS.process },
    { name: 'Labor', value: result.laborCostPerPart, fill: COLORS.labor },
    { name: 'Auxiliary', value: result.auxCostPerPart, fill: COLORS.overhead },
  ];

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <button onClick={handleCopy} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors ml-2">
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
      </button>
    );
  };

  const TableRow = ({ label, value, unit = '', highlight = false }: any) => (
    <tr className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 group">
      <td className="py-3 text-slate-500 dark:text-slate-400 text-xs font-medium">{label}</td>
      <td className={`py-3 text-right text-xs font-bold font-mono ${highlight ? 'text-brand-primary dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
        {value} <span className="text-[10px] text-slate-400 font-normal ml-0.5">{unit}</span>
        <CopyButton text={value.toString()} />
      </td>
    </tr>
  );

  return (
    <div id="report-view-root" className="max-w-6xl mx-auto space-y-12 animate-fade-in py-8 pb-32">
      
      {/* SECTION 1: PROJECT OVERVIEW HEADER */}
      <div className="bg-brand-primary dark:bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center space-x-3">
                 <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Estimate Portfolio</div>
                 <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                 <span className="text-white/60 font-mono text-xs">{metadata.projectId}</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight">{metadata.projectName}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
                 <div className="flex items-center"><Users className="w-4 h-4 mr-2 opacity-50" /> {metadata.customerName}</div>
                 <div className="flex items-center"><FileText className="w-4 h-4 mr-2 opacity-50" /> v{metadata.version}</div>
                 <div className="flex items-center"><Clock className="w-4 h-4 mr-2 opacity-50" /> {metadata.createdDate}</div>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={onExportPDF} className="flex items-center px-6 py-3 bg-white text-brand-primary rounded-2xl font-black text-sm hover:scale-[1.03] transition-all shadow-xl">
                 <Printer className="w-4 h-4 mr-2" /> PDF Report
              </button>
              <button onClick={onExportExcel} className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-sm hover:bg-white/20 transition-all border border-white/10">
                 <Download className="w-4 h-4 mr-2" /> Engineering XLS
              </button>
           </div>
        </div>
      </div>

      {/* SECTION 2: COST SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unit Cost', value: formatCurrency(result.totalPartCost), sub: 'Final Price', icon: DollarSign, color: 'text-brand-primary' },
          { label: 'Annual Total', value: formatCurrency(result.totalPartCost * inputs.annualVolume), sub: `for ${formatNumber(inputs.annualVolume, 0)} units`, icon: Package, color: 'text-purple-500' },
          { label: 'Project Margin', value: `${(inputs.profitRate * 100).toFixed(1)}%`, sub: formatCurrency(result.profitCost), icon: TrendingUp, color: 'text-green-600' },
          { label: 'Cycle Time', value: `${result.cycleTime.toFixed(1)}s`, sub: `${result.actualPPH.toFixed(0)} PPH`, icon: Activity, color: 'text-teal-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 ${kpi.color}`}>
                   <kpi.icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
             <h3 className="text-3xl font-black text-slate-800 dark:text-white">{kpi.value}</h3>
             <p className="text-xs text-slate-500 mt-2 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* SECTION 3: ANALYTICAL VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Donut */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-10 flex items-center">
             <div className="w-4 h-4 bg-brand-primary rounded-md mr-3 shadow-lg shadow-blue-500/20"></div>
             Cost Contribution Breakdown
           </h4>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%" cy="50%"
                      innerRadius={90} outerRadius={125}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1200}
                      label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      labelLine={{ stroke: COLORS.textMuted, strokeWidth: 1 }}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Volume Trend */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-10 flex items-center">
             <div className="w-4 h-4 bg-purple-500 rounded-md mr-3 shadow-lg shadow-purple-500/20"></div>
             Volume Sensitivity Amortization
           </h4>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={trendData}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="5 5" />
                    <XAxis dataKey="volume" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="cost" fill="#EEF2FF" stroke="none" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="cost" stroke={COLORS.material} strokeWidth={4} dot={{ fill: COLORS.material, r: 6, strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }} animationDuration={2000} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Buildup Waterfall Chart */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-10 flex items-center">
             <div className="w-4 h-4 bg-teal-500 rounded-md mr-3 shadow-lg shadow-teal-500/20"></div>
             Price Accretion Waterfall Model
           </h4>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: string) => name === 'displayVal' ? [formatCurrency(value), 'Cost'] : null}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    {/* Transparent bar for base stacking */}
                    <Bar dataKey="start" stackId="stack" fill="transparent" />
                    {/* Visible cost increments */}
                    <Bar dataKey="displayVal" stackId="stack" radius={[6, 6, 0, 0]} barSize={60} animationDuration={1500}>
                       {waterfallData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-4 flex flex-wrap gap-4 justify-center">
              {waterfallData.map((d, i) => (
                <div key={i} className="flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{d.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* SECTION 4: DETAILED AUDIT TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
               <Layers className="w-3 h-3 mr-2" /> Material Computation
            </h5>
            <table className="w-full">
               <tbody>
                  <TableRow label="Polymer Feedstock" value={inputs.materialCode} highlight />
                  <TableRow label="Net Part Weight" value={result.netWeight.toFixed(2)} unit="g" />
                  <TableRow label="Runner System (Paid)" value={result.runnerWeight.toFixed(2)} unit="g" />
                  <TableRow label="Resin Market Price" value={formatNumber(inputs.resinPriceOverride || 0)} unit="INR/Kg" />
                  <TableRow label="Allowed Regrind" value={result.scrapCredit > 0 ? 'Applicable' : '0%'} />
                  <TableRow label="Total Shot Weight" value={result.shotWeight.toFixed(2)} unit="g" />
               </tbody>
            </table>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
               <Zap className="w-3 h-3 mr-2" /> Manufacturing Derivation
            </h5>
            <table className="w-full">
               <tbody>
                  <TableRow label="Machine Cluster" value={`${result.selectedMachine?.tonnage} Ton`} highlight />
                  <TableRow label="MHR (Machine Hourly Rate)" value={formatNumber(result.selectedMachine?.mhr_inr || 0)} unit="INR" />
                  <TableRow label="Optimal Cavity Count" value={result.numCavities} unit="Cav" />
                  <TableRow label="Cycle Duration" value={result.cycleTime.toFixed(1)} unit="sec" />
                  <TableRow label="Production OEE" value={`${(inputs.oee * 100).toFixed(0)}%`} />
                  <TableRow label="Hourly Yield (Net)" value={result.actualPPH.toFixed(0)} unit="PPH" />
               </tbody>
            </table>
         </div>
      </div>

      {/* SECTION 5: RISK & ASSUMPTIONS PANEL */}
      <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none"><ShieldAlert className="w-64 h-64" /></div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
               <h4 className="text-xl font-bold flex items-center"><DollarSign className="w-6 h-6 mr-3 text-brand-primary" /> Market Risk</h4>
               <p className="text-slate-400 text-sm leading-relaxed">Resin costs are tied to crude oil futures. A 5% market surge impacts unit cost by <span className="text-white font-bold">{((result.materialCostPerPart * 0.05 / result.totalPartCost) * 100).toFixed(1)}%</span>.</p>
            </div>
            <div className="space-y-4">
               <h4 className="text-xl font-bold flex items-center"><Activity className="w-6 h-6 mr-3 text-teal-400" /> Ops Efficiency</h4>
               <p className="text-slate-400 text-sm leading-relaxed">Calculations assume steady-state {inputs.oee * 100}% OEE. Startup scrap is excluded from amortized pricing.</p>
            </div>
            <div className="space-y-4">
               <h4 className="text-xl font-bold flex items-center"><Layers className="w-6 h-6 mr-3 text-amber-400" /> Tooling Life</h4>
               <p className="text-slate-400 text-sm leading-relaxed">Cavity selection is optimized for the {formatNumber(inputs.annualVolume, 0)} annual target. Tool wear might affect scrap rates after 1M cycles.</p>
            </div>
         </div>
      </div>

      {/* TECHNICAL FOOTER (For Prints) */}
      <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
         <div>EstiMate Pro Technical Report &copy; {new Date().getFullYear()}</div>
         <div>Strictly Confidential • {metadata.projectId} • v{metadata.version}</div>
      </div>

    </div>
  );
};
