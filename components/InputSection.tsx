import React from 'react';
import { HelpCircle } from 'lucide-react';

interface InputGroupProps {
  title: string;
  children: React.ReactNode;
}

export const InputGroup: React.FC<InputGroupProps> = ({ title, children }) => (
  <div className="bg-brand-cardLight dark:bg-brand-cardDark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6 transition-colors duration-200">
    <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-700 pb-3">
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {children}
    </div>
  </div>
);

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (val: any) => void;
  type?: 'text' | 'number' | 'select' | 'checkbox';
  options?: { label: string; value: string | number }[];
  suffix?: string;
  step?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  options, 
  suffix,
  step = "0.01"
}) => {
  return (
    <div className="flex flex-col group">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-focus-within:text-brand-primary dark:group-focus-within:text-brand-material transition-colors">
          {label}
        </label>
      </div>
      
      <div className="relative">
        {type === 'select' ? (
          <div className="relative">
             <select
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent block w-full p-2.5 transition-all outline-none appearance-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        ) : type === 'checkbox' ? (
          <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
               type="checkbox"
               checked={Boolean(value)}
               onChange={(e) => onChange(e.target.checked)}
               className="w-4 h-4 text-brand-primary bg-white border-slate-300 rounded focus:ring-brand-primary dark:focus:ring-brand-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">{Boolean(value) ? 'Yes, Include' : 'No'}</span>
          </label>
        ) : (
          <div className="relative flex items-center">
            <input
              type={type}
              step={step}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent block p-2.5 transition-all outline-none placeholder-slate-400"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            {suffix && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
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