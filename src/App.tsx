import { useEffect } from 'react';
import { Home, PlusCircle, Settings as SettingsIcon, Repeat, History as HistoryIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Routines from './components/Routines';
import SettingsPage from './components/SettingsPage';
import History from './components/History';
import { initSync, useAppStore } from './store/useAppStore';
import { cn } from './lib/utils';

export default function App() {
  const { activeTab, setActiveTab } = useAppStore();

  useEffect(() => {
    initSync();
  }, []);

  const tabs = [
    { id: 'home', label: 'หน้าแรก', icon: Home },
    { id: 'add', label: 'เพิ่ม', icon: PlusCircle },
    { id: 'routines', label: 'ประจำ', icon: Repeat },
    { id: 'history', label: 'ประวัติ', icon: HistoryIcon },
    { id: 'settings', label: 'ตั้งค่า', icon: SettingsIcon },
  ] as const;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-xl overflow-hidden relative">
      <header className="bg-primary text-primary-foreground p-4 text-center font-bold text-lg shadow-sm z-10">
        ตี๋ติดหมู หมูติดตี๋
      </header>
      
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && <Dashboard />}
        {activeTab === 'add' && <AddTransaction />}
        {activeTab === 'routines' && <Routines />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <nav className="absolute bottom-0 w-full bg-white border-t flex justify-around p-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
              activeTab === tab.id 
                ? "text-primary scale-110" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
