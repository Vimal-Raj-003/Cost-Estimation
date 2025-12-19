import React from 'react';
import { LayoutDashboard, PlusCircle, List, FileText, Settings, PieChart, Database, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: PlusCircle, label: 'New Estimate', active: false },
    { icon: List, label: 'Estimates', active: false },
    { icon: FileText, label: 'Templates', active: false },
    { icon: Database, label: 'Rate Cards', active: false },
    { icon: PieChart, label: 'Reports', active: false },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 z-40 h-screen bg-brand-bgDark dark:bg-black text-slate-400 transition-all duration-300 border-r border-slate-800 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800">
        <div className={`flex items-center space-x-2 ${!isOpen && 'justify-center'}`}>
          <div className="bg-brand-primary w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/50">
            E
          </div>
          {isOpen && (
            <span className="text-white font-semibold text-lg tracking-tight">EstiMate<span className="text-brand-primary font-light">Pro</span></span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group ${
              item.active 
                ? 'bg-brand-primary text-white shadow-md' 
                : 'hover:bg-slate-800 hover:text-slate-100'
            } ${!isOpen ? 'justify-center' : ''}`}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-white' : 'text-slate-500 group-hover:text-slate-100'}`} />
            {isOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-800">
        <button className={`w-full flex items-center p-3 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors ${!isOpen ? 'justify-center' : ''}`}>
          <Settings className="w-5 h-5" />
          {isOpen && <span className="ml-3 text-sm font-medium">Settings</span>}
        </button>
        <button 
          onClick={toggleSidebar}
          className="w-full mt-2 flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
};