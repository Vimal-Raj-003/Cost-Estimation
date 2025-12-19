import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Plus, Trash2, Sun, Moon, Download, FileText, Loader2, ArrowRight, 
  CheckCircle, Save, History, Box, Search, Filter, ExternalLink, Copy, Archive, 
  MoreVertical, ArrowUpDown, ChevronDown, BookOpen, Layers, Zap, TrendingUp, BarChart 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { UserInputs, CalculationResult, ShapeType, RunnerType, ProjectMetadata, ProjectStatus, Template } from './types';
import { MATERIALS, DEFAULT_TEMPLATES } from './constants';
import { InputField, InputGroup } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { calculateCosts } from './utils/calculations';
import { Sidebar } from './components/Sidebar';
import { ReportsSection } from './components/ReportsSection';

const generateProjectId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `EST-IM-${year}-${random}`;
};

const INITIAL_METADATA: ProjectMetadata = {
  projectId: generateProjectId(),
  projectName: '',
  customerName: '',
  partName: '',
  estimationType: 'Injection Molding',
  createdBy: 'Current User',
  createdDate: new Date().toLocaleDateString(),
  status: 'Draft',
  version: 1,
};

const INITIAL_INPUTS: UserInputs = {
  length: 100,
  width: 50,
  height: 20,
  wallThickness: 2,
  projectedArea: null,
  shapeType: ShapeType.RECTANGLE,
  volume: null,
  weight: null,
  annualVolume: 100000,
  workingDays: 250,
  shiftsPerDay: 2,
  hoursPerShift: 8,
  oee: 0.85,
  scrapRate: 0.02,
  materialCode: 'PP_HOMO',
  isGlassFilled: false,
  runnerType: RunnerType.COLD_2_PLATE,
  numOperators: 1,
  operatorRate: 150, 
  laborOverhead: 0.3,
  useRobot: false,
  useConveyor: false,
  resinPriceOverride: 105,
  packagingCostPerPart: 0.50,
  sgaRate: 0.1,
  profitRate: 0.15,
  purchasedItems: [],
};

interface SavedEstimate {
  metadata: ProjectMetadata;
  inputs: UserInputs;
  updatedAt: string;
  totalCost: number;
}

type ViewMode = 'dashboard' | 'new-estimate-step1' | 'new-estimate-workspace' | 'estimates' | 'templates' | 'reports';

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [metadata, setMetadata] = useState<ProjectMetadata>(INITIAL_METADATA);
  const [inputs, setInputs] = useState<UserInputs>(INITIAL_INPUTS);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Library State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'updatedAt', direction: 'desc' });

  useEffect(() => {
    const stored = localStorage.getItem('esti_mate_pro_records');
    if (stored) {
      try {
        setSavedEstimates(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored estimates");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('esti_mate_pro_records', JSON.stringify(savedEstimates));
  }, [savedEstimates]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
        const res = calculateCosts(inputs);
        setResult(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputs]);

  const startNewEstimate = (templateInputs?: UserInputs) => {
    setMetadata({ ...INITIAL_METADATA, projectId: generateProjectId() });
    setInputs(templateInputs || INITIAL_INPUTS);
    setView('new-estimate-step1');
  };

  const updateMetadata = (key: keyof ProjectMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const updateInput = (key: keyof UserInputs, value: any) => {
    if (metadata.status === 'Final' || metadata.status === 'Sold') return;
    setInputs(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'number' && value !== '' ? parseFloat(value) : value
    }));
  };

  const handleMaterialChange = (newCode: string) => {
    if (metadata.status === 'Final' || metadata.status === 'Sold') return;
    const selectedMat = MATERIALS.find(m => m.code === newCode);
    setInputs(prev => ({
      ...prev,
      materialCode: newCode,
      resinPriceOverride: selectedMat ? selectedMat.priceResin : prev.resinPriceOverride
    }));
  };

  const saveToStorage = (isFinalizing: boolean = false) => {
    const newStatus: ProjectStatus = isFinalizing ? 'Final' : metadata.status;
    const updatedMetadata = { ...metadata, status: newStatus };
    if (isFinalizing) setMetadata(updatedMetadata);

    const calcResult = calculateCosts(inputs);

    setSavedEstimates(prev => {
      const filtered = prev.filter(e => e.metadata.projectId !== metadata.projectId);
      return [
        { 
          metadata: updatedMetadata, 
          inputs, 
          updatedAt: new Date().toLocaleString(),
          totalCost: calcResult.totalPartCost
        },
        ...filtered
      ];
    });
  };

  const handleFinalize = () => {
    saveToStorage(true);
    alert("Estimate finalized and locked.");
  };

  const loadEstimate = (est: SavedEstimate, targetView: ViewMode = 'new-estimate-workspace') => {
    setMetadata(est.metadata);
    setInputs(est.inputs);
    setView(targetView);
  };

  const deleteEstimate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this estimate?")) {
      setSavedEstimates(prev => prev.filter(item => item.metadata.projectId !== id));
    }
  };

  const duplicateEstimate = (est: SavedEstimate, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = generateProjectId();
    const newMetadata: ProjectMetadata = {
      ...est.metadata,
      projectId: newId,
      projectName: `${est.metadata.projectName} (Copy)`,
      status: 'Draft',
      createdDate: new Date().toLocaleDateString(),
    };
    setSavedEstimates(prev => [
      { metadata: newMetadata, inputs: est.inputs, updatedAt: new Date().toLocaleString(), totalCost: est.totalCost },
      ...prev
    ]);
  };

  const archiveEstimate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedEstimates(prev => prev.map(est => 
      est.metadata.projectId === id ? { ...est, metadata: { ...est.metadata, status: 'Archived' as ProjectStatus } } : est
    ));
  };

  const handleExportExcel = () => {
    if (!result) return;
    const esc = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = [
      ['Category', 'Parameter', 'Value', 'Unit'],
      ['Project', 'Reference', metadata.projectId, ''],
      ['Project', 'Name', metadata.projectName, ''],
      ['Project', 'Date', metadata.createdDate, ''],
      [],
      ['Total', 'Final Part Cost', result.totalPartCost.toFixed(4), 'INR'],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(esc).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Estimate_${metadata.projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const input = document.getElementById('report-view-root') || document.getElementById('pdf-capture-root');
    if (!input) return;
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await html2canvas(input, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDarkMode ? '#0F172A' : '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report_${metadata.projectId}.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredEstimates = useMemo(() => {
    let res = savedEstimates.filter(e => 
      (statusFilter === 'All' ? e.metadata.status !== 'Archived' : e.metadata.status === statusFilter) &&
      (typeFilter === 'All' ? true : e.metadata.estimationType === typeFilter) &&
      (e.metadata.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       e.metadata.projectId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    res.sort((a, b) => {
      const aVal = a.metadata[sortConfig.key as keyof ProjectMetadata] || a[sortConfig.key as keyof SavedEstimate];
      const bVal = b.metadata[sortConfig.key as keyof ProjectMetadata] || b[sortConfig.key as keyof SavedEstimate];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return res;
  }, [savedEstimates, searchTerm, statusFilter, typeFilter, sortConfig]);

  const kpis = useMemo(() => {
    return {
      total: savedEstimates.length,
      drafts: savedEstimates.filter(e => e.metadata.status === 'Draft').length,
      finalized: savedEstimates.filter(e => e.metadata.status === 'Final').length,
      value: savedEstimates.reduce((acc, cur) => acc + (cur.totalCost || 0), 0)
    };
  }, [savedEstimates]);

  const renderProgressIndicator = () => {
    const steps = [
      { id: 'new-estimate-step1', label: 'Metadata' },
      { id: 'new-estimate-workspace', label: 'Inputs & Calculation' },
    ];
    const currentStepIndex = steps.findIndex(s => s.id === view);
    return (
      <div className="flex items-center space-x-4 mb-8">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${idx <= currentStepIndex ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {idx < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-sm font-medium ${idx <= currentStepIndex ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && <div className="h-px w-8 bg-slate-300 dark:bg-slate-700"></div>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderTemplates = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Templates Library</h1>
           <p className="text-slate-500 text-sm">Jumpstart your workflow with standardized cost models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DEFAULT_TEMPLATES.map((tmpl) => (
          <div key={tmpl.id} className="bg-brand-cardLight dark:bg-brand-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all border-b-4 hover:border-brand-primary">
            <div className="p-5 flex-1">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-brand-primary group-hover:bg-blue-50 transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tmpl.volumeProfile === 'High' ? 'bg-green-100 text-green-700' : tmpl.volumeProfile === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {tmpl.volumeProfile} Vol
                  </span>
               </div>
               <h3 className="font-bold text-slate-800 dark:text-white mb-2">{tmpl.name}</h3>
               <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{tmpl.description}</p>
               
               <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                     <span>Process</span>
                     <span className="text-slate-700 dark:text-slate-300">{tmpl.type}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                     <span>Default Mat.</span>
                     <span className="text-slate-700 dark:text-slate-300">{tmpl.inputs.materialCode}</span>
                  </div>
               </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
               <span className="text-[10px] text-slate-400">Updated: {tmpl.lastUpdated}</span>
               <button 
                onClick={() => startNewEstimate(tmpl.inputs)}
                className="text-brand-primary font-bold text-xs flex items-center hover:translate-x-1 transition-transform"
               >
                 Use Template <ArrowRight className="w-3 h-3 ml-1" />
               </button>
            </div>
          </div>
        ))}
        <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
           <Plus className="w-8 h-8 text-slate-400 mb-3" />
           <p className="text-sm font-bold text-slate-500">Add Custom Template</p>
           <p className="text-[10px] text-slate-400 mt-1">Convert an estimate to template</p>
        </div>
      </div>
    </div>
  );

  const renderEstimatesList = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estimate Repository</h1>
           <p className="text-slate-500 text-sm">Review, duplicate, and manage your cost portfolio.</p>
        </div>
        <button onClick={() => startNewEstimate()} className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4 mr-2" /> New Estimate
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total Portfolio', value: kpis.total, color: 'text-slate-800' },
           { label: 'Drafts Pending', value: kpis.drafts, color: 'text-amber-600' },
           { label: 'Finalized', value: kpis.finalized, color: 'text-green-600' },
           { label: 'Avg Unit Cost', value: `₹${(kpis.value / (kpis.total || 1)).toFixed(2)}`, color: 'text-slate-800' }
         ].map(k => (
           <div key={k.label} className="bg-brand-cardLight dark:bg-brand-cardDark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
             <p className={`text-xl font-bold dark:text-white ${k.color}`}>{k.value}</p>
           </div>
         ))}
      </div>

      <div className="bg-brand-cardLight dark:bg-brand-cardDark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
           <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search projects..." 
             className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
           <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
             <tr>
               <th onClick={() => handleSort('projectId')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer">Project ID</th>
               <th onClick={() => handleSort('projectName')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer">Name / Customer</th>
               <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
               <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
               <th onClick={() => handleSort('totalCost')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer">Total Cost</th>
               <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
             {filteredEstimates.length === 0 ? (
               <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">No records found.</td></tr>
             ) : filteredEstimates.map(est => (
               <tr key={est.metadata.projectId} onClick={() => loadEstimate(est)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                 <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 group-hover:text-brand-primary">{est.metadata.projectId}</td>
                 <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">{est.metadata.projectName}</div>
                    <div className="text-xs text-slate-500">{est.metadata.customerName}</div>
                 </td>
                 <td className="px-6 py-4 text-xs">{est.metadata.estimationType}</td>
                 <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${est.metadata.status === 'Final' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{est.metadata.status}</span>
                 </td>
                 <td className="px-6 py-4 font-mono text-sm font-bold">₹{est.totalCost.toFixed(4)}</td>
                 <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { e.stopPropagation(); loadEstimate(est, 'reports'); }} className="p-1.5 text-slate-400 hover:text-brand-primary" title="View Analytics Report"><BarChart className="w-4 h-4" /></button>
                       <button onClick={(e) => duplicateEstimate(est, e)} className="p-1.5 text-slate-400 hover:text-brand-primary" title="Duplicate"><Copy className="w-4 h-4" /></button>
                       <button onClick={(e) => deleteEstimate(est.metadata.projectId, e)} className="p-1.5 text-slate-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );

  const renderView = () => {
    if (view === 'reports' && result) {
      return (
        <ReportsSection 
          metadata={metadata} 
          inputs={inputs} 
          result={result} 
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      );
    }
    if (view === 'estimates') return renderEstimatesList();
    if (view === 'templates') return renderTemplates();

    if (view === 'new-estimate-step1') {
      return (
        <div className="max-w-2xl mx-auto mt-10 animate-slide-up">
          <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
               <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Metadata</h1>
               <p className="text-slate-500 text-sm mt-1">Configure identity for {metadata.projectId}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Project Name" value={metadata.projectName} onChange={(v) => updateMetadata('projectName', v)} />
                <InputField label="Customer Name" value={metadata.customerName} onChange={(v) => updateMetadata('customerName', v)} />
                <InputField label="Part Name" value={metadata.partName} onChange={(v) => updateMetadata('partName', v)} />
              </div>
              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => setView('new-estimate-workspace')}
                  disabled={!metadata.projectName || !metadata.customerName}
                  className="px-8 py-3 bg-brand-primary text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Configure Parts <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div id="pdf-capture-root" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-5 space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
               <h1 className="text-xl font-bold text-slate-800 dark:text-white">{metadata.projectName || 'Estimate Inputs'}</h1>
               <p className="text-xs text-slate-400">{metadata.projectId} • v{metadata.version}</p>
            </div>
            {metadata.status === 'Final' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Finalized</span>}
          </div>

          <InputGroup title="1. Geometry & Part">
            <InputField label="Length (mm)" value={inputs.length} onChange={(v) => updateInput('length', v)} type="number" />
            <InputField label="Width (mm)" value={inputs.width} onChange={(v) => updateInput('width', v)} type="number" />
            <InputField label="Thickness (mm)" value={inputs.wallThickness} onChange={(v) => updateInput('wallThickness', v)} type="number" />
            <InputField label="Shape" value={inputs.shapeType} onChange={(v) => updateInput('shapeType', v)} type="select" options={Object.keys(ShapeType).map(k => ({ label: k, value: k }))} />
          </InputGroup>

          <InputGroup title="2. Material & Tooling">
            <InputField label="Material" value={inputs.materialCode} onChange={(v) => handleMaterialChange(v)} type="select" options={MATERIALS.map(m => ({ label: m.name, value: m.code }))} />
            <InputField label="Runner Type" value={inputs.runnerType} onChange={(v) => updateInput('runnerType', v)} type="select" options={[{ label: 'Hot', value: RunnerType.HOT }, { label: 'Cold 2-Pl', value: RunnerType.COLD_2_PLATE }]} />
            <InputField label="Resin Cost" value={inputs.resinPriceOverride} onChange={(v) => updateInput('resinPriceOverride', v)} type="number" />
          </InputGroup>

          <InputGroup title="3. Production">
            <InputField label="Annual Vol." value={inputs.annualVolume} onChange={(v) => updateInput('annualVolume', v)} type="number" step="1" />
            <InputField label="OEE" value={inputs.oee} onChange={(v) => updateInput('oee', v)} type="number" step="0.01" />
            <InputField label="Use Robot" value={inputs.useRobot ? 1 : 0} onChange={(v) => updateInput('useRobot', v)} type="checkbox" />
          </InputGroup>

          <div className="flex space-x-3">
             <button onClick={handleFinalize} className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-900/10">Finalize</button>
             <button onClick={() => saveToStorage()} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"><Save className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="sticky top-24">
            {result ? <ResultsSection result={result} /> : <div className="p-20 text-center text-slate-400">Loading...</div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-brand-bgLight dark:bg-brand-bgDark transition-colors duration-200">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onNewEstimate={() => startNewEstimate()} 
        activeView={view}
        onViewChange={(v) => setView(v as ViewMode)}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-brand-cardLight dark:bg-brand-cardDark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
           <div className="flex items-center">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">{view === 'dashboard' ? 'Overview' : view.charAt(0).toUpperCase() + view.slice(1)}</h2>
             {view === 'reports' && metadata && (
               <span className="ml-3 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-mono">{metadata.projectId}</span>
             )}
           </div>
           <div className="flex items-center space-x-4">
              {view === 'reports' && (
                 <button onClick={() => setView('estimates')} className="text-sm font-bold text-brand-primary hover:underline">Back to List</button>
              )}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
           </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
           {view.includes('new-estimate') && renderProgressIndicator()}
           {view === 'dashboard' ? (
             <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div onClick={() => setView('templates')} className="bg-brand-cardLight dark:bg-brand-cardDark p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-primary group transition-all">
                       <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white">
                          <BookOpen className="w-6 h-6" />
                       </div>
                       <h3 className="font-bold mb-1">Explore Templates</h3>
                       <p className="text-xs text-slate-500">Standard configurations for faster quoting</p>
                    </div>
                    {savedEstimates.slice(0, 2).map(est => (
                       <div key={est.metadata.projectId} onClick={() => loadEstimate(est)} className="bg-brand-cardLight dark:bg-brand-cardDark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold truncate">{est.metadata.projectName}</h3>
                             <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{est.metadata.status}</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-4">{est.metadata.projectId}</p>
                          <div className="text-xs pt-4 border-t border-slate-100 dark:border-slate-800 text-brand-primary font-bold">Open Workspace →</div>
                       </div>
                    ))}
                </div>
                
                {/* Dashboard Stats */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                   <h3 className="text-lg font-bold mb-6">Portfolio Summary</h3>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Total Value</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(kpis.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Finalized</p>
                        <p className="text-2xl font-black text-green-600">{kpis.finalized}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Drafts</p>
                        <p className="text-2xl font-black text-amber-500">{kpis.drafts}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Conversion Rate</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{kpis.total > 0 ? ((kpis.finalized / kpis.total) * 100).toFixed(0) : 0}%</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : renderView()}
        </main>
      </div>
    </div>
  );
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
