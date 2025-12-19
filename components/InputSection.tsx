
import React from 'react';
import { HelpCircle, Calculator, User, ChevronDown } from 'lucide-react';

interface InputGroupProps {
  title: string;
  children: React.ReactNode;
}

export const InputGroup: React.FC<InputGroupProps> = ({ title, children }) => (
  <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6 transition-all duration-300 hover:shadow-md">
    <div className="flex items-center justify-between mb-5 border-b border-slate-50 dark:border-slate-800 pb-3">
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center">
        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full mr-2"></div>
        {title}
      </h3>
    </div>
    {/* Modified grid to 2 columns on larger screens instead of 3 to fit narrower space */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange?: (val: any) => void;
  type?: 'text' | 'number' | 'select' | 'checkbox';
  options?: { label: string; value: string | number }[];
  suffix?: string;
  step?: string;
  isCalculated?: boolean;
  highlight?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  options, 
  suffix,
  step = "0.01",
  isCalculated = false,
  highlight = false
}) => {
  const baseClasses = "w-full border text-sm rounded-xl block p-2.5 transition-all outline-none appearance-none";
  
  // Input vs Calculated Color logic
  const stateClasses = isCalculated 
    ? (highlight 
        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-brand-primary dark:text-blue-300 font-bold cursor-default" 
        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-default")
    : "bg-[#EEF2FF] dark:bg-[#1D2A44] border-blue-200/50 dark:border-blue-900/30 text-brand-primary dark:text-blue-100 font-medium focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400/50";

  // Ensure value is handled safely for native input/select elements to prevent "Type 'number' is not assignable to type 'string'" errors in some React environments
  const displayValue = value === null || value === undefined ? '' : String(value);

  return (
    <div className="flex flex-col group animate-fade-in">
      <div className="flex justify-between items-center mb-1.5 px-1">
        <label className={`text-[10px] font-bold uppercase tracking-widest truncate max-w-[70%] ${isCalculated ? 'text-slate-400' : 'text-brand-primary dark:text-blue-400'}`}>
          {label}
        </label>
        <div className={`flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${isCalculated ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-100 dark:bg-blue-900/40 text-brand-primary dark:text-blue-300'}`}>
          {isCalculated ? (
            <><Calculator className="w-2 h-2 mr-1" /> Calc</>
          ) : (
            <><User className="w-2 h-2 mr-1" /> Input</>
          )}
        </div>
      </div>
      
      <div className="relative">
        {type === 'select' ? (
          <div className="relative">
             <select
              className={`${baseClasses} ${stateClasses}`}
              value={displayValue}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={isCalculated}
            >
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        ) : type === 'checkbox' ? (
          <label className={`flex items-center p-2.5 border rounded-xl cursor-pointer transition-all ${stateClasses}`}>
            <input
               type="checkbox"
               checked={Boolean(value)}
               onChange={(e) => onChange?.(e.target.checked)}
               disabled={isCalculated}
               className="w-4 h-4 text-brand-primary bg-white border-slate-300 rounded focus:ring-brand-primary focus:ring-2"
            />
            <span className="ml-3 text-sm font-semibold">{Boolean(value) ? 'Yes' : 'No'}</span>
          </label>
        ) : (
          <div className="relative flex items-center">
            <input
              type={type}
              step={step}
              readOnly={isCalculated}
              className={`${baseClasses} ${stateClasses}`}
              value={displayValue}
              onChange={(e) => onChange?.(e.target.value)}
            />
            {suffix && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className={`text-[10px] font-bold ${isCalculated ? 'text-slate-400' : 'text-brand-primary/60 dark:text-blue-400/60'}`}>
                  {suffix}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
