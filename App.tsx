
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Sun, Moon, Download, FileText, ArrowRight, 
  CheckCircle, Save, BookOpen, Layers, Zap, TrendingUp, BarChart,
  Search, Info, Database, MoreVertical, Package, Clock, ShieldAlert, Users, LayoutDashboard, ChevronRight, Printer, Filter, Copy, ArrowUpDown, Calculator, Lock, PlusCircle, X, ShoppingBag, Beaker, Gauge
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { UserInputs, CalculationResult, ShapeType, RunnerType, ProjectMetadata, ProjectStatus, WeightSource, User, PurchasedItem, Template } from './types';
import { MATERIALS, DEFAULT_TEMPLATES, MACHINES } from './constants';
import { InputField, InputGroup } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { calculateCosts } from './utils/calculations';
import { Sidebar } from './components/Sidebar';
import { ReportsSection } from './components/ReportsSection';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabaseClient';

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
  id?: string; // Supabase ID
  metadata: ProjectMetadata;
  inputs: UserInputs;
  result: CalculationResult | null;
  updatedAt: string;
}

type ViewMode = 'dashboard' | 'new-estimate-step1' | 'new-estimate-workspace' | 'estimates' | 'reports' | 'templates' | 'rate-cards';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);
  const [metadata, setMetadata] = useState<ProjectMetadata>(INITIAL_METADATA('PENDING', 'Guest'));
  const [inputs, setInputs] = useState<UserInputs>(EMPTY_INPUTS);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [currentDbId, setCurrentDbId] = useState<string | null>(null);
  const [rateCardTab, setRateCardTab] = useState<'materials' | 'machines'>('materials');

  // Auth State Listener
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleUserSession(session.user);
      }
      setAuthLoading(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setUser(null);
        setSavedEstimates([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = (authUser: any) => {
    setUser({
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || 'User',
      role: 'user',
      picture: authUser.user_metadata?.avatar_url
    });
    fetchEstimates(authUser.id);
  };

  // Fetch Estimates from Supabase
  const fetchEstimates = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;

      if (data) {
        const mapped: SavedEstimate[] = data.map(item => ({
          id: item.id,
          metadata: item.metadata as ProjectMetadata,
          inputs: item.inputs as UserInputs,
          result: item.result as CalculationResult,
          updatedAt: new Date(item.updated_at).toLocaleString()
        }));
        setSavedEstimates(mapped);
      }
    } catch (err) {
      console.error('Error fetching estimates:', err);
    }
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    setCurrentDbId(null); // Reset DB ID for new estimate
    setView('new-estimate-step1');
  };

  const loadTemplate = (template: Template) => {
    const newId = generateSequentialProjectId(savedEstimates);
    setMetadata({
      ...INITIAL_METADATA(newId, user?.name || 'User'),
      estimationType: template.type,
      projectName: `Copy of ${template.name}`
    });
    setInputs({
      ...template.inputs,
      // Reset dimensions for the template to force user input if needed, 
      // or keep them as examples. Keeping them is usually better for templates.
    });
    setResult(null);
    setCurrentDbId(null);
    setView('new-estimate-workspace');
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

  const finalizeProject = async () => {
    if (!user) return;
    const res = calculateCosts(inputs);
    setResult(res);
    const updatedMetadata = { ...metadata, status: 'Final' as ProjectStatus };
    setMetadata(updatedMetadata);

    try {
      const payload = {
        user_id: user.id,
        project_id: updatedMetadata.projectId,
        project_name: updatedMetadata.projectName,
        customer_name: updatedMetadata.customerName,
        status: 'Final',
        inputs: inputs,
        result: res,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      };

      let error;
      if (currentDbId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('estimates')
          .update(payload)
          .eq('id', currentDbId);
        error = updateError;
      } else {
        // Insert new
        const { data: insertData, error: insertError } = await supabase
          .from('estimates')
          .insert([payload])
          .select()
          .single();
        if (insertData) setCurrentDbId(insertData.id);
        error = insertError;
      }

      if (error) throw error;

      alert("Project Finalized and saved to Database.");
      fetchEstimates(user.id); // Refresh list
    } catch (err: any) {
      console.error('Error saving:', err);
      alert('Failed to save project: ' + err.message);
    }
  };

  const loadEstimate = (est: SavedEstimate, target: ViewMode = 'new-estimate-workspace') => {
    setMetadata(est.metadata);
    setInputs(est.inputs);
    setResult(est.result);
    setCurrentDbId(est.id || null);
    setView(target);
  };

  const handleExportPDF = async () => {
    const input = document.getElementById('report-view-root') || document.getElementById('pdf-capture-root');
    if (!input) return;
    setIsExportingPDF(true);
    
    // Scroll top to capture full context
    const originalScroll = window.scrollY;
    window.scrollTo(0, 0);

    try {
      // Short delay for React to ensure all elements are visible/rendered
      await new Promise(r => setTimeout(r, 1000));

      const canvas = await html2canvas(input, { 
        scale: 2, // High resolution
        useCORS: true, 
        logging: false, 
        backgroundColor: isDarkMode ? '#0F172A' : '#ffffff', // Match theme
        windowWidth: input.scrollWidth, 
        windowHeight: input.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = pdfHeight - (2 * margin); 
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = margin;
      let page = 1;

      // Footer Function
      const addFooter = (pageNum: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139); // Slate-500
        pdf.setDrawColor(226, 232, 240); // Slate-200
        
        // Divider
        pdf.line(margin, pdfHeight - margin - 5, pdfWidth - margin, pdfHeight - margin - 5);
        
        // Text
        const dateStr = new Date().toLocaleDateString();
        pdf.text(`Generated: ${dateStr}`, margin, pdfHeight - margin);
        pdf.text(`${metadata.projectName} | ${metadata.projectId}`, pdfWidth / 2, pdfHeight - margin, { align: 'center' });
        pdf.text(`Page ${pageNum}`, pdfWidth - margin, pdfHeight - margin, { align: 'right' });
      };

      // Header Function (Page 1 only or all? Let's do all if desired, but user asked for "A header". 
      // Often headers are only on p1 or simple headers on sub-pages. Let's stick to footer for consistent paging)
      // We will rely on the HTML capture for the main Header visuals on Page 1.
      
      // Page 1
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      addFooter(page);
      
      heightLeft -= contentHeight;

      // Subsequent Pages
      while (heightLeft > 0) {
        position -= contentHeight; 
        pdf.addPage();
        page++;
        
        // Add image shifted up to show next chunk
        // We use the same image data, just offset the Y position negatively
        // Note: position is relative to the top of the PDF page. 
        // For page 2, we want the image to start at: margin - contentHeight
        // The variable 'position' tracks exactly this relative Y.
        
        pdf.addImage(imgData, 'PNG', margin, margin - ((page - 1) * contentHeight), contentWidth, imgHeight);
        
        // Mask top margin (header area) to clean up bleed
        pdf.setFillColor(isDarkMode ? '#0F172A' : '#ffffff');
        pdf.rect(0, 0, pdfWidth, margin, 'F');
        
        // Mask bottom margin (footer area)
        pdf.rect(0, pdfHeight - margin - 6, pdfWidth, margin + 6, 'F');
        
        addFooter(page);
        heightLeft -= contentHeight;
      }

      pdf.save(`Estimation_Report_${metadata.projectId}.pdf`);

    } catch (err) {
      console.error(err);
      alert("Error generating PDF. Please try again.");
    } finally { 
      setIsExportingPDF(false); 
      window.scrollTo(0, originalScroll);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bgLight dark:bg-brand-bgDark">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  const renderWorkspace = () => (
    <div id="pdf-capture-root" className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-slide-up">
      {/* Reduced input width to 5 columns */}
      <div className="xl:col-span-5 space-y-6 pb-32">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{metadata.projectName || 'Estimation Workspace'}</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">{metadata.projectId}</p>
           </div>
           <button onClick={finalizeProject} className="p-2 bg-white dark:bg-slate-800 text-brand-primary dark:text-blue-400 rounded-xl border border-brand-primary/20 hover:bg-blue-50 transition-colors shadow-sm"><Lock className="w-4 h-4" /></button>
        </div>

        {/* 1. Geometry Section */}
        <InputGroup title="1. Part Geometry & Tonnage">
          <InputField label="Part Length" value={inputs.length ?? ''} onChange={(v) => updateInput('length', v)} type="number" suffix="mm" />
          <InputField label="Part Width" value={inputs.width ?? ''} onChange={(v) => updateInput('width', v)} type="number" suffix="mm" />
          <InputField label="Part Height" value={inputs.height ?? ''} onChange={(v) => updateInput('height', v)} type="number" suffix="mm" />
          <InputField label="Wall Thickness" value={inputs.wallThickness ?? ''} onChange={(v) => updateInput('wallThickness', v)} type="number" suffix="mm" />
          <InputField label="Shape Profile" value={inputs.shapeType} onChange={(v) => updateInput('shapeType', v)} type="select" options={Object.keys(ShapeType).map(k => ({ label: k, value: k }))} />
          <InputField label="Part Weight" value={inputs.weight ?? ''} onChange={(v) => updateInput('weight', v)} type="number" suffix="g" />
          
          {/* Intermediate Geometry Calculations */}
          {result && (
            <>
              <InputField label="Volume (Calc)" value={result.volumeMm3.toFixed(2)} isCalculated suffix="mm³" />
              <InputField label="Area (Calc)" value={result.projectedAreaCm2.toFixed(2)} isCalculated suffix="cm²" />
              <InputField label="Req. Tonnage" value={result.requiredTonnage.toFixed(0)} isCalculated suffix="T" />
            </>
          )}
        </InputGroup>

        {/* 2. Production & Machine Metrics */}
        <InputGroup title="2. Production & Machine">
          <InputField label="Material" value={inputs.materialCode} onChange={(v) => handleMaterialChange(v)} type="select" options={MATERIALS.map(m => ({ label: m.name, value: m.code }))} />
          <InputField label="Annual Volume" value={inputs.annualVolume ?? ''} onChange={(v) => updateInput('annualVolume', v)} type="number" suffix="units" />
          <InputField label="Runner System" value={inputs.runnerType} onChange={(v) => updateInput('runnerType', v)} type="select" options={[{ label: 'Hot', value: RunnerType.HOT }, { label: 'Cold 2-Plate', value: RunnerType.COLD_2_PLATE }, { label: 'Cold 3-Plate', value: RunnerType.COLD_3_PLATE }]} />
          
          {/* Intermediate Production Calculations */}
          {result && (
            <>
              <InputField label="Cavities" value={result.numCavities} isCalculated />
              <InputField label="Machine" value={result.selectedMachine?.tonnage ? `${result.selectedMachine.tonnage}T` : 'None'} isCalculated />
              <InputField label="Cycle Time" value={result.cycleTime.toFixed(1)} isCalculated suffix="sec" />
              <InputField label="Yield" value={result.actualPPH.toFixed(0)} isCalculated suffix="parts/hr" />
            </>
          )}
        </InputGroup>

        {/* 3. Cost & Commercial Derivation */}
        <InputGroup title="3. Commercial & Costs">
          <InputField label="Resin Price" value={inputs.resinPriceOverride ?? ''} onChange={(v) => updateInput('resinPriceOverride', v)} type="number" suffix="₹/Kg" />
          <InputField label="Packaging" value={inputs.packagingCostPerPart ?? ''} onChange={(v) => updateInput('packagingCostPerPart', v)} type="number" suffix="₹" />
          <InputField label="SGA Rate" value={inputs.sgaRate ?? ''} onChange={(v) => updateInput('sgaRate', v)} type="number" step="0.01" />
          <InputField label="Profit Margin" value={inputs.profitRate ?? ''} onChange={(v) => updateInput('profitRate', v)} type="number" step="0.01" />
          
          {/* Intermediate Cost Calculations */}
          {result && (
            <>
              <InputField label="Mat. Cost" value={result.materialCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Proc. Cost" value={result.processCostPerPart.toFixed(2)} isCalculated suffix="₹" />
              <InputField label="Total Cost" value={result.totalPartCost.toFixed(2)} isCalculated suffix="₹" highlight />
            </>
          )}
        </InputGroup>

        {/* 4. Purchased Items */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                 <ShoppingBag className="w-3 h-3 mr-2 text-brand-primary" /> Purchased Items
              </h3>
              <button onClick={addPurchasedItem} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-brand-primary dark:text-blue-300 rounded-lg hover:bg-blue-100 transition-all">
                <PlusCircle className="w-4 h-4" />
              </button>
           </div>
           
           <div className="space-y-3">
              {inputs.purchasedItems.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 relative group">
                   <button onClick={() => removePurchasedItem(item.id)} className="absolute top-1 right-1 p-0.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                   </button>
                   <input 
                      className="w-full bg-transparent border-none text-xs font-bold focus:ring-0 p-0 mb-1"
                      value={item.name}
                      onChange={(e) => updatePurchasedItem(item.id, 'name', e.target.value)}
                   />
                   <div className="flex gap-2">
                      <input type="number" placeholder="Price" className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-1 text-[10px] font-mono" value={item.price} onChange={(e) => updatePurchasedItem(item.id, 'price', parseFloat(e.target.value) || 0)} />
                      <input type="number" placeholder="Scrap %" className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-1 text-[10px] font-mono" value={item.scrapRate} onChange={(e) => updatePurchasedItem(item.id, 'scrapRate', parseFloat(e.target.value) || 0)} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Increased results width to 7 columns */}
      <div className="xl:col-span-7">
        <div className="sticky top-10">
           {result ? (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={() => setView('reports')} className="px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-xs flex items-center shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"><BarChart className="w-4 h-4 mr-2" /> Full Report</button>
              </div>
              <ResultsSection result={result} />
            </>
           ) : (
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"><Info className="w-8 h-8 text-slate-400" /></div>
                <h3 className="text-slate-800 dark:text-white font-black">Calculation Pending</h3>
                <p className="text-xs text-slate-500 mt-2">Complete inputs to see analysis.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-brand-bgLight dark:bg-brand-bgDark transition-all duration-300">
      {/* Export Overlay */}
      {isExportingPDF && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl flex flex-col items-center animate-slide-up shadow-2xl">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Generating Report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Formatting for A4 print...</p>
          </div>
        </div>
      )}

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
           ) : view === 'templates' ? (
              <div className="max-w-6xl mx-auto space-y-8">
                 <h1 className="text-3xl font-black text-slate-800 dark:text-white">Project Templates</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DEFAULT_TEMPLATES.map(tmpl => (
                       <div key={tmpl.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
                          <div className="flex justify-between items-start">
                             <h3 className="text-xl font-black text-slate-800 dark:text-white">{tmpl.name}</h3>
                             <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-md">{tmpl.volumeProfile} Vol</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-2 min-h-[40px]">{tmpl.description}</p>
                          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                             <span className="text-xs text-slate-400">Modified: {tmpl.lastUpdated}</span>
                             <button onClick={() => loadTemplate(tmpl)} className="flex items-center text-sm font-bold text-brand-primary hover:underline">
                                Use Template <ArrowRight className="w-4 h-4 ml-1" />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ) : view === 'rate-cards' ? (
              <div className="max-w-6xl mx-auto space-y-8">
                 <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">Rate Cards</h1>
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                       <button onClick={() => setRateCardTab('materials')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${rateCardTab === 'materials' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Materials</button>
                       <button onClick={() => setRateCardTab('machines')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${rateCardTab === 'machines' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Machines</button>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                       <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-slate-800/50">
                             <tr>
                                {rateCardTab === 'materials' ? (
                                   <>
                                     <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Material</th>
                                     <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                     <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Density (g/cm³)</th>
                                     <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Price (INR/kg)</th>
                                   </>
                                ) : (
                                   <>
                                     <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Machine Class</th>
                                     <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Max Shot (g)</th>
                                     <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Power (kW)</th>
                                     <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Rate (INR/hr)</th>
                                   </>
                                )}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {rateCardTab === 'materials' ? MATERIALS.map(m => (
                                <tr key={m.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4">
                                      <div className="font-bold text-sm text-slate-800 dark:text-white">{m.name}</div>
                                      <div className="text-xs text-slate-400">{m.family}</div>
                                   </td>
                                   <td className="px-6 py-4 text-xs font-mono text-slate-500">{m.code}</td>
                                   <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{m.density}</td>
                                   <td className="px-6 py-4 text-right font-mono font-bold text-brand-primary">₹{m.priceResin}</td>
                                </tr>
                             )) : MACHINES.map(m => (
                                <tr key={m.tonnage} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4">
                                      <div className="font-bold text-sm text-slate-800 dark:text-white">{m.tonnage} Ton</div>
                                   </td>
                                   <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{m.max_shot}</td>
                                   <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{m.power}</td>
                                   <td className="px-6 py-4 text-right font-mono font-bold text-brand-primary">₹{m.mhr_inr}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
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
