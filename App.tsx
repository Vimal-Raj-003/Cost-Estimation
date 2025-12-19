
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Sun, Moon, Download, FileText, ArrowRight, 
  CheckCircle, Save, BookOpen, Layers, Zap, TrendingUp, BarChart,
  Search, Info, Database, MoreVertical, Package, Clock, ShieldAlert, Users, LayoutDashboard, ChevronRight, Printer, Filter, Copy, ArrowUpDown, Calculator, Lock, PlusCircle, X, ShoppingBag
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { UserInputs, CalculationResult, ShapeType, RunnerType, ProjectMetadata, ProjectStatus, WeightSource, User, PurchasedItem } from './types';
import { MATERIALS, DEFAULT_TEMPLATES } from './constants';
import { InputField, InputGroup } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { calculateCosts } from './utils/calculations';
import { Sidebar } from './components/Sidebar';
import { ReportsSection } from './components/ReportsSection';
import { Auth } from './components/Auth';

const generateSequentialProjectId = (existingEstimates: SavedEstimate[]) => {
  const year = new Date().getFullYear();
  const prefix = `EST-IM-${year}-`;
  const yearIds = existingEstimates.map(e => e.metadata.projectId).filter(id => id.startsWith(prefix));
  let nextSequence = 1;
  if (yearIds.length > 0) {
    const sequences = yearIds.map(id => {
      const parts = id.split('-');
      const seqStr = parts[parts.length - 1];
      const parsed = parseInt(seqStr, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
    nextSequence = Math.max(...sequences) + 1;
  }
  return `${prefix}${nextSequence.toString().padStart(6, '0')}`;
};

const EMPTY_INPUTS: UserInputs = {
  length: null,
  width: null,
  height: null,
  wallThickness: null,
  projectedArea: null,
  shapeType: ShapeType.RECTANGLE,
  volume: null,
  weight: null,
  weightSource: 'calculated',
  annualVolume: null,
  workingDays: 250,
  shiftsPerDay: 3,
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

const INITIAL_METADATA = (id: string, userName: string): ProjectMetadata => ({
  projectId: id,
  projectName: '',
  customerName: '',
  partName: '',
  estimationType: 'Injection Molding',
  createdBy: userName,
  createdDate: new Date().toLocaleDateString(),
  status: 'Draft',
  version: 1,
});

interface SavedEstimate {
  metadata: ProjectMetadata;
  inputs: UserInputs;
  result: CalculationResult | null;
  updatedAt: string;
}

type ViewMode = 'dashboard' | 'new-estimate-step1' | 'new-estimate-workspace' | 'estimates' | 'reports';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);
  const [metadata, setMetadata] = useState<ProjectMetadata>(INITIAL_METADATA('PENDING', 'Guest'));
  const [inputs, setInputs] = useState<UserInputs>(EMPTY_INPUTS);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('esti_mate_pro_records_v2');
    if (stored) {
      try { setSavedEstimates(JSON.parse(stored)); } catch (e) { console.error("Parse failed"); }
    }
    const storedUser = localStorage.getItem('esti_mate_pro_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { console.error("User parse failed"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('esti_mate_pro_records_v2', JSON.stringify(savedEstimates));
  }, [savedEstimates]);

  useEffect(() => {
    if (user) localStorage.setItem('esti_mate_pro_user', JSON.stringify(user));
    else localStorage.removeItem('esti_mate_pro_user');
  }, [user]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleRunCalculation = () => {
    const res = calculateCosts(inputs);
    setResult(res);
    setMetadata(prev => ({ ...prev, lastCalculatedAt: new Date().toLocaleString() } as any));
  };

  // Run calculation automatically when inputs change to keep workspace updated
  useEffect(() => {
    if (view === 'new-estimate-workspace') {
      const missing = [];
      if (inputs.length === null) missing.push("L");
      if (inputs.width === null) missing.push("W");
      if (inputs.height === null) missing.push("H");
      if (inputs.annualVolume === null) missing.push("Vol");
      
      if (missing.length === 0) {
        handleRunCalculation();
      }
    }
  }, [inputs, view]);

  const startNewEstimate = () => {
    const newId = generateSequentialProjectId(savedEstimates);
    setMetadata(INITIAL_METADATA(newId, user?.name || 'User'));
    setInputs(EMPTY_INPUTS);
    setResult(null);
    setView('new-estimate-step1');
  };

  const updateMetadata = (key: keyof ProjectMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const updateInput = (key: keyof UserInputs, value: any) => {
    setInputs(prev => {
      let nextValue = value;
      if (value === '' || value === null || value === undefined) {
        nextValue = null;
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        if (!value.endsWith('.')) {
          nextValue = parseFloat(value);
        }
      }
      return { ...prev, [key]: nextValue };
    });
  };

  const handleMaterialChange = (newCode: string) => {
    const selectedMat = MATERIALS.find(m => m.code === newCode);
    setInputs(prev => ({
      ...prev,
      materialCode: newCode,
      resinPriceOverride: selectedMat ? selectedMat.priceResin : prev.resinPriceOverride
    }));
  };

  const addPurchasedItem = () => {
    const newItem: PurchasedItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Component',
      price: 0,
      scrapRate: 0.02
    };
    setInputs(prev => ({
      ...prev,
      purchasedItems: [...prev.purchasedItems, newItem]
    }));
  };

  const removePurchasedItem = (id: string) => {
    setInputs(prev => ({
      ...prev,
      purchasedItems: prev.purchasedItems.filter(item => item.id !== id)
    }));
  };

  const updatePurchasedItem = (id: string, key: keyof PurchasedItem, value: any) => {
    setInputs(prev => ({
      ...prev,
      purchasedItems: prev.purchasedItems.map(item => item.id === id ? { ...item, [key]: value } : item)
    }));
  };

  const finalizeProject = () => {
    const res = calculateCosts(inputs);
    setResult(res);
    const updatedMetadata = { ...metadata, status: 'Final' as ProjectStatus };
    setMetadata(updatedMetadata);
    setSavedEstimates(prev => {
      const filtered = prev.filter(e => e.metadata.projectId !== metadata.projectId);
      return [{ metadata: updatedMetadata, inputs, result: res, updatedAt: new Date().toLocaleString() }, ...filtered];
    });
    alert("Project Finalized.");
  };

  const loadEstimate = (est: SavedEstimate, target: ViewMode = 'new-estimate-workspace') => {
    setMetadata(est.metadata);
    setInputs(est.inputs);
    setResult(est.result);
    setView(target);
  };

  const handleExportPDF = async () => {
    const input = document.getElementById('report-view-root') || document.getElementById('pdf-capture-root');
    if (!input) return;
    setIsExportingPDF(true);
    window.scrollTo(0, 0);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const canvas = await html2canvas(input, { 
        scale: 3, useCORS: true, logging: false, backgroundColor: isDarkMode ? '#0F172A' : '#ffffff',
        windowWidth: document.documentElement.offsetWidth, windowHeight: input.scrollHeight
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth() - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`Estimation_Report_${metadata.projectId}.pdf`);
    } catch (err) {
      console.error(err);
    } finally { setIsExportingPDF(false); }
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const renderWorkspace = () => (
    <div id="pdf-capture-root" className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-slide-up">
      <div className="xl:col-span-8 space-y-8 pb-32">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{metadata.projectName || 'Estimation Workspace'}</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">{metadata.projectId} • Real-time Calculations Active</p>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={finalizeProject} className="px-5 py-3 bg-white dark:bg-slate-800 text-brand-primary dark:text-blue-400 rounded-2xl font-bold text-xs flex items-center border border-brand-primary/20 hover:bg-blue-50 transition-colors shadow-sm"><Lock className="w-4 h-4 mr-2" /> Finalize Project</button>
              {result && <button onClick={() => setView('reports')} className="px-5 py-3 bg-brand-primary text-white rounded-2xl font-bold text-xs flex items-center shadow-lg shadow-blue-500/20"><BarChart className="w-4 h-4 mr-2" /> Full Report</button>}
           </div>
        </div>

        {/* 1. Geometry Section */}
        <InputGroup title="1. Part Geometry & Tonnage Requirement">
          <InputField label="Part Length" value={inputs.length ?? ''} onChange={(v) => updateInput('length', v)} type="number" suffix="mm" />
          <InputField label="Part Width" value={inputs.width ?? ''} onChange={(v) => updateInput('width', v)} type="number" suffix="mm" />
          <InputField label="Part Height" value={inputs.height ?? ''} onChange={(v) => updateInput('height', v)} type="number" suffix="mm" />
          <InputField label="Wall Thickness" value={inputs.wallThickness ?? ''} onChange={(v) => updateInput('wallThickness', v)} type="number" suffix="mm" />
          <InputField label="Shape Profile" value={inputs.shapeType} onChange={(v) => updateInput('shapeType', v)} type="select" options={Object.keys(ShapeType).map(k => ({ label: k, value: k }))} />
          <InputField label="Part Weight (Input)" value={inputs.weight ?? ''} onChange={(v) => updateInput('weight', v)} type="number" suffix="g" />
          
          {/* Intermediate Geometry Calculations */}
          {result && (
            <>
              <InputField label="Computed Volume" value={result.volumeMm3.toFixed(2)} isCalculated suffix="mm³" />
              <InputField label="Projected Area" value={result.projectedAreaCm2.toFixed(2)} isCalculated suffix="cm²" />
              <InputField label="Required Tonnage" value={result.requiredTonnage.toFixed(0)} isCalculated suffix="T" />
              <InputField label="Net Weight (Calc)" value={result.netWeight.toFixed(2)} isCalculated suffix="g" />
            </>
          )}
        </InputGroup>

        {/* 2. Production & Machine Metrics */}
        <InputGroup title="2. Production Logistics & Machine Selection">
          <InputField label="Material" value={inputs.materialCode} onChange={(v) => handleMaterialChange(v)} type="select" options={MATERIALS.map(m => ({ label: m.name, value: m.code }))} />
          <InputField label="Annual Volume" value={inputs.annualVolume ?? ''} onChange={(v) => updateInput('annualVolume', v)} type="number" suffix="units" />
          <InputField label="Runner System" value={inputs.runnerType} onChange={(v) => updateInput('runnerType', v)} type="select" options={[{ label: 'Hot', value: RunnerType.HOT }, { label: 'Cold 2-Plate', value: RunnerType.COLD_2_PLATE }, { label: 'Cold 3-Plate', value: RunnerType.COLD_3_PLATE }]} />
          
          {/* Intermediate Production Calculations */}
          {result && (
            <>
              <InputField label="Optimal Cavities" value={result.numCavities} isCalculated />
              <InputField label="Selected Machine" value={result.selectedMachine?.tonnage ? `${result.selectedMachine.tonnage}T` : 'None'} isCalculated />
              <InputField label="Cycle Time" value={result.cycleTime.toFixed(1)} isCalculated suffix="sec" />
              <InputField label="Yield (Net PPH)" value={result.actualPPH.toFixed(0)} isCalculated suffix="parts/hr" />
              <InputField label="Total Shot Weight" value={result.shotWeight.toFixed(2)} isCalculated suffix="g" />
              <InputField label="Runner Weight" value={result.runnerWeight.toFixed(2)} isCalculated suffix="g" />
            </>
          )}
        </InputGroup>

        {/* 3. Cost & Commercial Derivation */}
        <InputGroup title="3. Commercial Derivation & Unit Costs">
          <InputField label="Resin Price (Input)" value={inputs.resinPriceOverride ?? ''} onChange={(v) => updateInput('resinPriceOverride', v)} type="number" suffix="₹/Kg" />
          <InputField label="Packaging/Part" value={inputs.packagingCostPerPart ?? ''} onChange={(v) => updateInput('packagingCostPerPart', v)} type="number" suffix="₹" />
          <InputField label="SGA Rate" value={inputs.sgaRate ?? ''} onChange={(v) => updateInput('sgaRate', v)} type="number" step="0.01" />
          <InputField label="Profit Margin" value={inputs.profitRate ?? ''} onChange={(v) => updateInput('profitRate', v)} type="number" step="0.01" />
          
          {/* Intermediate Cost Calculations */}
          {result && (
            <>
              <InputField label="Material Cost/Unit" value={result.materialCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Process Cost/Unit" value={result.processCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Machine Cost/Unit" value={result.machineCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Labor Cost/Unit" value={result.laborCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Auxiliary Cost/Unit" value={result.auxCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Overhead Cost/Unit" value={result.sgaCost.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Profit/Unit" value={result.profitCost.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Total Unit Cost" value={result.totalPartCost.toFixed(2)} isCalculated suffix="₹" highlight />
            </>
          )}
        </InputGroup>

        {/* 4. Purchased Items / Child Parts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center">
                 <ShoppingBag className="w-4 h-4 mr-2 text-brand-primary" /> 4. Purchased Components & Child Parts
              </h3>
              <button onClick={addPurchasedItem} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-brand-primary dark:text-blue-300 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all">
                <PlusCircle className="w-4 h-4" /> Add Item
              </button>
           </div>
           
           <div className="space-y-4">
              {inputs.purchasedItems.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                   <p className="text-xs text-slate-400">No purchased components added to this estimation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inputs.purchasedItems.map((item) => (
                    <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative group animate-fade-in">
                       <button onClick={() => removePurchasedItem(item.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                       </button>
                       <div className="grid grid-cols-1 gap-4">
                          <input 
                            className="bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm font-bold focus:border-brand-primary outline-none py-1"
                            value={item.name}
                            onChange={(e) => updatePurchasedItem(item.id, 'name', e.target.value)}
                          />
                          <div className="flex gap-4">
                             <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Price</label>
                                <input 
                                  type="number" 
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 text-xs font-mono"
                                  value={item.price}
                                  onChange={(e) => updatePurchasedItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                />
                             </div>
                             <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Scrap %</label>
                                <input 
                                  type="number" step="0.01"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 text-xs font-mono"
                                  value={item.scrapRate}
                                  onChange={(e) => updatePurchasedItem(item.id, 'scrapRate', parseFloat(e.target.value) || 0)}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           {result && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                 <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Purchased Value</span>
                    <span className="text-2xl font-black text-brand-primary">₹{result.purchasedItemsCost.toFixed(2)}</span>
                 </div>
              </div>
           )}
        </div>
      </div>

      <div className="xl:col-span-4">
        <div className="sticky top-24">
           {result ? <ResultsSection result={result} /> : (
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"><Info className="w-8 h-8 text-slate-400" /></div>
                <h3 className="text-slate-800 dark:text-white font-black">Calculation Pending</h3>
                <p className="text-xs text-slate-500 mt-2">Complete geometry and volume inputs to activate live costing engine.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-brand-bgLight dark:bg-brand-bgDark transition-all duration-300">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onNewEstimate={startNewEstimate} activeView={view} onViewChange={(v) => setView(v as ViewMode)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{view.replace('-', ' ')}</h2>
             <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
             <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">EST-PRO_v2.1</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                {user.picture ? <img src={user.picture} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-[10px] text-white font-bold">{user.name[0]}</div>}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.name}</span>
                <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase hover:underline">Logout</button>
             </div>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-2xl text-slate-500 bg-slate-50 dark:bg-slate-800 hover:text-brand-primary transition-all">
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
           </div>
        </header>
        <main className="flex-1 p-10 overflow-y-auto">
           {view === 'dashboard' ? (
              <div className="max-w-6xl mx-auto space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div onClick={startNewEstimate} className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center cursor-pointer group hover:border-brand-primary transition-all">
                       <Plus className="w-8 h-8 text-brand-primary mb-6" />
                       <h3 className="text-lg font-black text-slate-800 dark:text-white">New Calculation</h3>
                       <p className="text-xs text-slate-400 mt-2">Zeroed workspace for new project</p>
                    </div>
                    {savedEstimates.slice(0, 5).map(est => (
                       <div key={est.metadata.projectId} onClick={() => loadEstimate(est)} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl cursor-pointer group">
                          <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{est.metadata.projectName}</h3>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">{est.metadata.projectId}</p>
                          <div className="mt-8 flex items-center justify-between border-t pt-6">
                             <span className="text-xl font-black text-brand-primary">₹{est.result?.totalPartCost.toFixed(2) || '0.00'}</span>
                             <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ) : view === 'new-estimate-step1' ? (
             <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-12">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Project Context</h1>
                <p className="text-slate-500 mt-2 mb-10">Set metadata before entering workspace.</p>
                <div className="space-y-6">
                  <InputField label="Project Name" value={metadata.projectName} onChange={(v) => updateMetadata('projectName', v)} />
                  <InputField label="Customer" value={metadata.customerName} onChange={(v) => updateMetadata('customerName', v)} />
                </div>
                <button onClick={() => setView('new-estimate-workspace')} disabled={!metadata.projectName} className="w-full mt-10 py-5 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all disabled:opacity-50">Enter Workspace</button>
             </div>
           ) : view === 'new-estimate-workspace' ? renderWorkspace() : view === 'estimates' ? (
              <div className="max-w-6xl mx-auto space-y-8">
                 <h1 className="text-3xl font-black text-slate-800 dark:text-white">Estimates Library</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedEstimates.length === 0 ? <p className="text-slate-400 italic">No saved estimates yet.</p> : savedEstimates.map(est => (
                       <div key={est.metadata.projectId} onClick={() => loadEstimate(est)} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl cursor-pointer">
                          <div className="flex justify-between items-start mb-4">
                             <span className="text-[9px] font-black uppercase bg-green-100 text-green-700 px-2 py-1 rounded-md">{est.metadata.status}</span>
                             <span className="text-[10px] text-slate-400">{est.updatedAt}</span>
                          </div>
                          <h3 className="font-black text-slate-800 dark:text-white">{est.metadata.projectName}</h3>
                          <p className="text-xs text-slate-500 mt-1">{est.metadata.customerName}</p>
                          <div className="mt-6 flex justify-between items-center">
                             <span className="text-xl font-bold">₹{est.result?.totalPartCost.toFixed(2)}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ) : view === 'reports' ? (
             result && <ReportsSection metadata={metadata} inputs={inputs} result={result} onExportPDF={handleExportPDF} onExportExcel={() => {}} />
           ) : null}
        </main>
      </div>
    </div>
  );
}
