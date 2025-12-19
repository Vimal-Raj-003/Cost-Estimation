import React, { useState, useEffect } from 'react';
import { Settings, Calculator, Plus, Trash2, Sun, Moon, Download, FileText, User } from 'lucide-react';
import { UserInputs, CalculationResult, ShapeType, RunnerType } from './types';
import { MATERIALS } from './constants';
import { InputField, InputGroup } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { calculateCosts } from './utils/calculations';
import { Sidebar } from './components/Sidebar';

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
  resinPriceOverride: 0,
  packagingCostPerPart: 0.50,
  sgaRate: 0.1,
  profitRate: 0.15,
  purchasedItems: [],
};

export default function App() {
  const [inputs, setInputs] = useState<UserInputs>(INITIAL_INPUTS);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dark Mode Toggle Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Calculation Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        const res = calculateCosts(inputs);
        setResult(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputs]);

  const updateInput = (key: keyof UserInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'number' && value !== '' ? parseFloat(value) : value
    }));
  };

  const addPurchasedItem = () => {
    setInputs(prev => ({
      ...prev,
      purchasedItems: [...prev.purchasedItems, { id: Date.now().toString(), name: 'Item', price: 0, scrapRate: 0 }]
    }));
  };

  const updatePurchasedItem = (id: string, field: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      purchasedItems: prev.purchasedItems.map(item => 
        item.id === id ? { ...item, [field]: field === 'name' ? value : parseFloat(value) } : item
      )
    }));
  };

  const removePurchasedItem = (id: string) => {
    setInputs(prev => ({
      ...prev,
      purchasedItems: prev.purchasedItems.filter(item => item.id !== id)
    }));
  };

  return (
    <div className="min-h-screen flex bg-brand-bgLight dark:bg-brand-bgDark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* 1. Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* 2. Main Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* Top Header Bar */}
        <header className="h-16 bg-brand-cardLight dark:bg-brand-cardDark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
           <div className="flex items-center">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Project Alpha <span className="text-slate-400 font-normal mx-2">/</span> Estimate #0042</h2>
             <span className="ml-3 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Draft</span>
           </div>

           <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                 <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                   <FileText className="w-4 h-4 mr-2" /> Export PDF
                 </button>
                 <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                   <Download className="w-4 h-4 mr-2" /> Export Excel
                 </button>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center space-x-2 pl-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-bold">JD</div>
              </div>
           </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             
             {/* Left Column: Inputs */}
             <div className="xl:col-span-5 space-y-6 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">Estimate Inputs</h1>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Config v1.2</span>
                </div>

                <InputGroup title="1. Geometry & Part">
                  <InputField label="Length (mm)" value={inputs.length} onChange={(v) => updateInput('length', v)} type="number" />
                  <InputField label="Width (mm)" value={inputs.width} onChange={(v) => updateInput('width', v)} type="number" />
                  <InputField label="Height (mm)" value={inputs.height} onChange={(v) => updateInput('height', v)} type="number" />
                  <InputField label="Thickness (mm)" value={inputs.wallThickness} onChange={(v) => updateInput('wallThickness', v)} type="number" />
                  <InputField label="Weight (g)" value={inputs.weight || ''} onChange={(v) => updateInput('weight', v)} type="number" suffix="opt" />
                  <InputField 
                    label="Shape" 
                    value={inputs.shapeType} 
                    onChange={(v) => updateInput('shapeType', v)} 
                    type="select" 
                    options={Object.keys(ShapeType).map(k => ({ label: k, value: k }))} 
                  />
                </InputGroup>

                <InputGroup title="2. Material & Tooling">
                  <InputField 
                    label="Material" 
                    value={inputs.materialCode} 
                    onChange={(v) => updateInput('materialCode', v)} 
                    type="select" 
                    options={MATERIALS.map(m => ({ label: m.name, value: m.code }))} 
                  />
                  <InputField 
                    label="Runner Type" 
                    value={inputs.runnerType} 
                    onChange={(v) => updateInput('runnerType', v)} 
                    type="select" 
                    options={[
                      { label: 'Hot Runner', value: RunnerType.HOT },
                      { label: 'Semi Hot Runner', value: RunnerType.SEMI_HOT },
                      { label: 'Cold Runner 2-Plate', value: RunnerType.COLD_2_PLATE },
                      { label: 'Cold Runner 3-Plate', value: RunnerType.COLD_3_PLATE },
                    ]}
                  />
                  <InputField label="Glass Filled" value={inputs.isGlassFilled ? 1 : 0} onChange={(v) => updateInput('isGlassFilled', v)} type="checkbox" />
                  <InputField label="Resin Cost (₹/kg)" value={inputs.resinPriceOverride} onChange={(v) => updateInput('resinPriceOverride', v)} type="number" suffix="override" />
                </InputGroup>

                <InputGroup title="3. Production Data">
                  <InputField label="Annual Vol." value={inputs.annualVolume} onChange={(v) => updateInput('annualVolume', v)} type="number" step="1" />
                  <InputField label="Work Days" value={inputs.workingDays} onChange={(v) => updateInput('workingDays', v)} type="number" step="1" />
                  <InputField label="Shifts/Day" value={inputs.shiftsPerDay} onChange={(v) => updateInput('shiftsPerDay', v)} type="number" step="1" />
                  <InputField label="Hrs/Shift" value={inputs.hoursPerShift} onChange={(v) => updateInput('hoursPerShift', v)} type="number" />
                  <InputField label="OEE (0-1)" value={inputs.oee} onChange={(v) => updateInput('oee', v)} type="number" step="0.01" />
                  <InputField label="Scrap (0-1)" value={inputs.scrapRate} onChange={(v) => updateInput('scrapRate', v)} type="number" step="0.01" />
                </InputGroup>

                <InputGroup title="4. Process & Overhead">
                  <InputField label="Operators" value={inputs.numOperators} onChange={(v) => updateInput('numOperators', v)} type="number" step="0.5" />
                  <InputField label="Labor Rate (₹/hr)" value={inputs.operatorRate} onChange={(v) => updateInput('operatorRate', v)} type="number" />
                  <InputField label="SG&A Rate" value={inputs.sgaRate} onChange={(v) => updateInput('sgaRate', v)} type="number" step="0.01" />
                  <InputField label="Profit Margin" value={inputs.profitRate} onChange={(v) => updateInput('profitRate', v)} type="number" step="0.01" />
                  <InputField label="Packaging (₹)" value={inputs.packagingCostPerPart} onChange={(v) => updateInput('packagingCostPerPart', v)} type="number" />
                  <InputField label="Robot" value={inputs.useRobot ? 1 : 0} onChange={(v) => updateInput('useRobot', v)} type="checkbox" />
                  <InputField label="Conveyor" value={inputs.useConveyor ? 1 : 0} onChange={(v) => updateInput('useConveyor', v)} type="checkbox" />
                </InputGroup>

                {/* Purchased Items Table - Professional Look */}
                <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Purchased Items / Inserts</h3>
                      <button 
                        onClick={addPurchasedItem}
                        className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {inputs.purchasedItems.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-sm italic">No additional items added.</div>
                    ) : (
                      <div className="space-y-2">
                        {inputs.purchasedItems.map(item => (
                          <div key={item.id} className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex-1">
                              <input 
                                className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 border-none focus:ring-0 p-0 placeholder-slate-400"
                                placeholder="Item Name"
                                value={item.name}
                                onChange={(e) => updatePurchasedItem(item.id, 'name', e.target.value)}
                              />
                            </div>
                            <div className="w-20">
                              <input 
                                type="number"
                                className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 focus:border-brand-primary p-1 text-right"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => updatePurchasedItem(item.id, 'price', e.target.value)}
                              />
                            </div>
                            <div className="w-16">
                              <input 
                                type="number"
                                className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 focus:border-brand-primary p-1 text-right"
                                placeholder="Scrap"
                                step="0.01"
                                value={item.scrapRate}
                                onChange={(e) => updatePurchasedItem(item.id, 'scrapRate', e.target.value)}
                              />
                            </div>
                            <button 
                              onClick={() => removePurchasedItem(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

             </div>

             {/* Right Column: Results */}
             <div className="xl:col-span-7">
               <div className="sticky top-24 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                     <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                        <Calculator className="w-5 h-5 mr-2 text-brand-primary dark:text-blue-400" /> 
                        Cost Analysis
                     </h1>
                     <div className="text-xs font-mono text-slate-400">
                       {result ? `Updated: ${new Date().toLocaleTimeString()}` : 'Computing...'}
                     </div>
                  </div>
                  {result ? <ResultsSection result={result} /> : (
                    <div className="flex items-center justify-center h-96 bg-brand-cardLight dark:bg-brand-cardDark rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 animate-pulse">Initializing Cost Engine...</div>
                    </div>
                  )}
               </div>
             </div>

           </div>
        </main>
      </div>
    </div>
  );
}