
import React, { useState } from 'react';
import { CalculationResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, ChevronDown, ChevronUp, Layers, Zap, Users, Box, TrendingUp, ShoppingBag } from 'lucide-react';

interface ResultsSectionProps {
  result: CalculationResult;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);
};

const formatNumber = (val: number, decimals = 2) => {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
};

// Colors matching the enterprise palette
const COLORS = {
  material: '#5DADE2', // Blue
  process: '#48C9B0',  // Teal
  labor: '#F5B041',    // Amber
  overhead: '#AF7AC5', // Purple
  purchased: '#E59866',// Orange
  profit: '#58D68D',   // Green
};

export const ResultsSection: React.FC<ResultsSectionProps> = ({ result }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('breakdown');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const chartData = [
    { name: 'Material', value: result.materialCostPerPart, color: COLORS.material },
    { name: 'Process', value: result.processCostPerPart, color: COLORS.process },
    { name: 'Overheads', value: (result.sgaCost + result.packagingCost), color: COLORS.overhead },
    { name: 'Margin', value: result.profitCost, color: COLORS.profit },
    { name: 'Purchased', value: result.purchasedItemsCost, color: COLORS.purchased },
  ].filter(d => d.value > 0);

  // Accordion Item Component
  const AccordionItem = ({ id, title, icon: Icon, color, total, children }: any) => {
    const isExpanded = expandedSection === id;
    return (
      <div className="mb-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-brand-cardLight dark:bg-brand-cardDark overflow-hidden transition-all duration-200">
        <button 
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
          </div>
          <div className="flex items-center space-x-4">
             <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(total)}</span>
             {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>
        {isExpanded && (
           <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 animate-fade-in">
             {children}
           </div>
        )}
      </div>
    );
  };

  const Row = ({ label, value, sub = false, highlight = false }: any) => (
    <div className={`flex justify-between items-center py-2 ${sub ? 'pl-11 text-xs' : 'pl-1'} border-b border-slate-100 dark:border-slate-700 last:border-0`}>
      <span className={`${sub ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
        {label}
      </span>
      <span className={`font-mono ${sub ? 'text-xs text-slate-500' : 'text-sm font-semibold text-slate-700 dark:text-slate-200'} ${highlight ? 'text-brand-primary dark:text-blue-400' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      
      {/* 1. Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Unit Cost', value: formatCurrency(result.totalPartCost), sub: 'Incl. Margin', color: 'border-l-4 border-blue-600' },
          { label: 'Cycle Time', value: `${formatNumber(result.cycleTime, 1)}s`, sub: `${result.actualPPH.toFixed(0)} parts/hr`, color: 'border-l-4 border-teal-500' },
          { label: 'Annual Cost', value: formatCurrency(result.totalPartCost * result.availableHours * result.requiredPPH), sub: 'Estimated', color: 'border-l-4 border-purple-500' }, 
          { label: 'Margin', value: `${((result.profitCost / result.totalPartCost) * 100).toFixed(1)}%`, sub: formatCurrency(result.profitCost), color: 'border-l-4 border-green-500' },
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-brand-cardLight dark:bg-brand-cardDark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${kpi.color} hover:shadow-md transition-shadow cursor-default group`}>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
             <p className="text-xl xl:text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-[1.02] transition-transform origin-left truncate">{kpi.value}</p>
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex items-start">
           <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
           <p className="text-sm text-amber-800 dark:text-amber-200">{result.warnings.join(' ')}</p>
        </div>
      )}

      {/* 2. Main Split Content - Changed layout for better visibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: Accordion Breakdown */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Detailed Breakdown</h3>
          </div>

          <AccordionItem id="material" title="Material Cost" icon={Layers} color={COLORS.material} total={result.materialCostPerPart}>
             <Row label="Resin Cost" value={formatCurrency(result.resinCost)} />
             <Row label="Scrap Credit" value={`-${formatCurrency(result.scrapCredit)}`} sub />
             <Row label="Net Weight" value={`${formatNumber(result.netWeight)} g`} sub />
             <Row label="Shot Weight" value={`${formatNumber(result.shotWeight)} g`} sub />
          </AccordionItem>

          <AccordionItem id="process" title="Process Cost" icon={Zap} color={COLORS.process} total={result.processCostPerPart}>
             <Row label="Machine Rate" value={formatCurrency(result.machineCostPerPart)} />
             <Row label="Labor Cost" value={formatCurrency(result.laborCostPerPart)} />
             <Row label="Auxiliary Cost" value={formatCurrency(result.auxCostPerPart)} />
             <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
               <Row label="Machine Selection" value={`${result.selectedMachine?.tonnage}T`} sub />
               <Row label="Cavities" value={result.numCavities} sub />
               <Row label="Cycle Time" value={`${formatNumber(result.cycleTime, 1)}s`} sub />
             </div>
          </AccordionItem>

          <AccordionItem id="overheads" title="Overheads & Margin" icon={TrendingUp} color={COLORS.overhead} total={result.sgaCost + result.profitCost + result.packagingCost}>
             <Row label="Packaging" value={formatCurrency(result.packagingCost)} />
             <Row label="SG&A" value={formatCurrency(result.sgaCost)} />
             <Row label="Profit Margin" value={formatCurrency(result.profitCost)} highlight />
          </AccordionItem>

          {result.purchasedItemsCost > 0 && (
            <AccordionItem id="purchased" title="Purchased Items" icon={ShoppingBag} color={COLORS.purchased} total={result.purchasedItemsCost}>
               <Row label="Total Items Cost" value={formatCurrency(result.purchasedItemsCost)} />
               <div className="text-xs text-slate-500 mt-2 italic">Detailed item list available in inputs.</div>
            </AccordionItem>
          )}
        </div>

        {/* RIGHT: Infographics & Tech Panel */}
        <div className="space-y-6">
           {/* Chart Card */}
           <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-[400px]">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Cost Distribution</h4>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      // Improved label rendering to ensure values are visible
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number, name: string) => {
                         const total = chartData.reduce((acc, cur) => acc + cur.value, 0);
                         const percent = ((val / total) * 100).toFixed(1);
                         return [`${formatCurrency(val)} (${percent}%)`, name];
                      }}
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#F8FAFC' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value, entry: any) => (
                         <span className="text-slate-600 dark:text-slate-300 text-xs ml-1 font-medium">
                            {value}
                         </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Technical Specs Card */}
           <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
                 <Box className="w-4 h-4 mr-2 text-slate-400" /> Technical Summary
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                 <div>
                   <span className="block text-xs text-slate-400 mb-1">Projected Area</span>
                   <span className="font-medium text-slate-700 dark:text-slate-200 text-base">{formatNumber(result.projectedAreaCm2)} cm²</span>
                 </div>
                 <div>
                   <span className="block text-xs text-slate-400 mb-1">Required Clamp</span>
                   <span className="font-medium text-slate-700 dark:text-slate-200 text-base">{formatNumber(result.requiredTonnage, 0)} T</span>
                 </div>
                 <div>
                   <span className="block text-xs text-slate-400 mb-1">Cooling Time</span>
                   <span className="font-medium text-slate-700 dark:text-slate-200 text-base">{formatNumber(result.tCool, 1)} s</span>
                 </div>
                 <div>
                   <span className="block text-xs text-slate-400 mb-1">Fill Time</span>
                   <span className="font-medium text-slate-700 dark:text-slate-200 text-base">{formatNumber(result.tFill, 1)} s</span>
                 </div>
                 <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-slate-700 mt-1">
                    <span className="block text-xs text-slate-400 mb-1">Efficiency (OEE)</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{(result.availableHours > 0 ? (result.requiredPPH / result.actualPPH) * 100 : 0).toFixed(1)}% Capacity</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
