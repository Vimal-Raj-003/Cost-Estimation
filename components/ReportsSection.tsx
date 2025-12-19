import React, { useMemo } from 'react';
import { CalculationResult, ProjectMetadata, UserInputs } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ComposedChart, Area
} from 'recharts';
import { 
  FileText, Download, TrendingUp, AlertCircle, Info, Layers, 
  Zap, Users, ShoppingBag, DollarSign, Activity, Package, Clock, ShieldAlert, 
  ChevronRight, ArrowRight, Printer
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
  textMuted: '#94a3b8',
};

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);

const formatNumber = (val: number, decimals = 2) => 
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);

export const ReportsSection: React.FC<ReportsSectionProps> = ({ 
  metadata, inputs, result, onExportPDF, onExportExcel 
}) => {
  
  // 1. Scenario Analysis Data
  const scenarios = useMemo(() => {
    const lowVolInputs = { ...inputs, annualVolume: inputs.annualVolume * 0.5 };
    const highVolInputs = { ...inputs, annualVolume: inputs.annualVolume * 2 };
    
    return {
      current: result.totalPartCost,
      low: calculateCosts(lowVolInputs).totalPartCost,
      high: calculateCosts(highVolInputs).totalPartCost
    };
  }, [inputs, result]);

  // 2. Cost vs Volume Trend Data
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

  // 3. Waterfall Data Construction
  const waterfallData = [
    { name: 'Base Mat.', val: result.resinCost },
    { name: 'Net Mat.', val: result.materialCostPerPart },
    { name: 'Molding', val: result.materialCostPerPart + result.processCostPerPart },
    { name: 'Packaged', val: result.materialCostPerPart + result.processCostPerPart + result.packagingCost },
    { name: 'Total MFG', val: result.totalPartCost - result.profitCost },
    { name: 'Final', val: result.totalPartCost },
  ];

  // 4. Distribution Chart Data
  const distributionData = [
    { name: 'Material', value: result.materialCostPerPart, color: COLORS.material },
    { name: 'Process', value: result.processCostPerPart, color: COLORS.process },
    { name: 'Overhead', value: result.sgaCost + result.packagingCost, color: COLORS.overhead },
    { name: 'Purchased', value: result.purchasedItemsCost, color: COLORS.purchased },
    { name: 'Margin', value: result.profitCost, color: COLORS.profit },
  ].filter(d => d.value > 0);

  // 5. Process Detail Data
  const processData = [
    { name: 'Machine', value: result.machineCostPerPart, fill: COLORS.process },
    { name: 'Labor', value: result.laborCostPerPart, fill: COLORS.labor },
    { name: 'Auxiliary', value: result.auxCostPerPart, fill: COLORS.overhead },
  ];

  return (
    <div id="report-view-root" className="max-w-6xl mx-auto space-y-10 py-4 animate-fade-in pb-20">
      
      {/* SECTION 1: EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8 gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-3">
             <span className="px-2 py-0.5 bg-brand-primary text-white text-[10px] font-bold rounded uppercase tracking-widest">Executive Summary</span>
             <span className="text-slate-300 dark:text-slate-700">/</span>
             <span className="text-xs font-mono text-slate-400">{metadata.projectId}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metadata.projectName}</h1>
          <p className="text-slate-500 mt-2 flex items-center">
            Prepared for <span className="font-bold text-slate-700 dark:text-slate-300 ml-1 mr-2">{metadata.customerName}</span> 
            • Version {metadata.version} • {metadata.createdDate}
          </p>
        </div>
        <div className="flex items-center space-x-3">
           <button onClick={onExportPDF} className="flex items-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
             <Printer className="w-4 h-4 mr-2" /> Print PDF
           </button>
           <button onClick={onExportExcel} className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all">
             <Download className="w-4 h-4 mr-2" /> Detailed XLS
           </button>
        </div>
      </div>

      {/* SECTION 2: KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><DollarSign className="w-12 h-12" /></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Cost (INR)</p>
           <h3 className="text-3xl font-black text-slate-800 dark:text-white">{formatCurrency(result.totalPartCost)}</h3>
           <div className="mt-4 flex items-center text-xs">
             <span className="text-green-500 font-bold flex items-center">Optimized <Activity className="w-3 h-3 ml-1" /></span>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Package className="w-12 h-12" /></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Exposure</p>
           <h3 className="text-3xl font-black text-slate-800 dark:text-white">{formatCurrency(result.totalPartCost * inputs.annualVolume)}</h3>
           <p className="text-xs text-slate-400 mt-4">Based on {formatNumber(inputs.annualVolume, 0)} units</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-12 h-12" /></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operating Margin</p>
           <h3 className="text-3xl font-black text-green-600">{(result.profitRate * 100).toFixed(1)}%</h3>
           <p className="text-xs text-slate-400 mt-4">{formatCurrency(result.profitCost)} profit/part</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Clock className="w-12 h-12" /></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cycle Efficiency</p>
           <h3 className="text-3xl font-black text-slate-800 dark:text-white">{result.cycleTime.toFixed(1)}s</h3>
           <p className="text-xs text-slate-400 mt-4">{result.actualPPH.toFixed(0)} parts per hour</p>
        </div>
      </div>

      {/* SECTION 3: VISUAL COST ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3.1 Cost Distribution Donut */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-8 flex items-center">
             <Layers className="w-4 h-4 mr-2 text-brand-primary" /> Cost Contribution Breakdown
           </h4>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%" cy="50%"
                      innerRadius={80} outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 3.2 Process Breakup Bar */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-8 flex items-center">
             <Zap className="w-4 h-4 mr-2 text-brand-primary" /> Manufacturing Process Detail
           </h4>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={processData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                       {processData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 3.3 Volume Sensitivity Curve */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-8 flex items-center">
             <TrendingUp className="w-4 h-4 mr-2 text-brand-primary" /> Cost Amortization vs Annual Volume
           </h4>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={trendData}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="volume" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="cost" fill="#f8fafc" stroke="none" />
                    <Line type="monotone" dataKey="cost" stroke={COLORS.material} strokeWidth={3} dot={{ fill: COLORS.material, r: 4 }} activeDot={{ r: 6 }} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 3.4 Waterfall / Build Up */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-8 flex items-center">
             <Activity className="w-4 h-4 mr-2 text-brand-primary" /> Price Accretion Model
           </h4>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={waterfallData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Bar dataKey="val" fill={COLORS.material} radius={[6, 6, 0, 0]} barSize={35} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* SECTION 4: DETAILED TABLES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center">
              <Info className="w-4 h-4 mr-2 text-slate-400" /> Engineering Audit Specification
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Technical Data Pack</span>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 border-r border-slate-100 dark:border-slate-800">
               <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Material Logic</h5>
               <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Resin Code</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{inputs.materialCode}</td>
                    </tr>
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Net Part Weight</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{result.netWeight.toFixed(2)} g</td>
                    </tr>
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Scrap Rate Applied</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{(inputs.scrapRate * 100).toFixed(1)}%</td>
                    </tr>
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Resin Cost / Kg</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(inputs.resinPriceOverride)}</td>
                    </tr>
                  </tbody>
               </table>
            </div>
            <div className="p-6">
               <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Molding Logic</h5>
               <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Machine Tonnage</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{result.selectedMachine?.tonnage} T</td>
                    </tr>
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Machine Hourly Rate</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(result.selectedMachine?.mhr_inr || 0)}/hr</td>
                    </tr>
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">Number of Cavities</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{result.numCavities}</td>
                    </tr>
                    <tr className="py-2 flex justify-between">
                      <td className="text-slate-500">OEE Factor</td>
                      <td className="font-medium text-slate-700 dark:text-slate-200">{(inputs.oee * 100).toFixed(0)}%</td>
                    </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* SECTION 5: ASSUMPTIONS & RISK PROFILE */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl">
         <div className="flex items-start space-x-4">
            <ShieldAlert className="w-8 h-8 text-amber-500 flex-shrink-0" />
            <div className="space-y-4">
               <div>
                  <h4 className="text-lg font-bold text-amber-900 dark:text-amber-200">Assumptions & Risk Profile</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Estimations are based on the following key sensitivity factors. Any change in these variables will impact final pricing.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Market Volatility</p>
                     <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Resin Price Sensitivity</p>
                     <p className="text-xs text-amber-700 dark:text-amber-500">A ±10% shift in crude price impacts part cost by ≈ {((result.materialCostPerPart * 0.1 / result.totalPartCost) * 100).toFixed(1)}%.</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Production Risk</p>
                     <p className="text-sm font-bold text-amber-900 dark:text-amber-100">OEE Stability</p>
                     <p className="text-xs text-amber-700 dark:text-amber-500">Calculations assume steady-state {inputs.oee * 100}% OEE. Startup phase scrap may exceed estimates.</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Financial Risk</p>
                     <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Exchange Rate (USD/INR)</p>
                     <p className="text-xs text-amber-700 dark:text-amber-500">Current model uses fixed conversion. Import materials are subject to FX fluctuations.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};
