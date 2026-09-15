import { useState } from 'react';
import { useAppStore, getCycleSettings } from '../store/useAppStore';

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'mooOwesTee' | 'teeOwesMoo'>('mooOwesTee');

  const currentCycle = getCycleSettings(settings, activeTab);

  const handleUpdate = (field: keyof typeof currentCycle, value: number) => {
    updateSettings({
      [activeTab]: {
        ...currentCycle,
        [field]: value
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">ตั้งค่ารอบบิล</h2>
      
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-sm font-bold text-center border-b-2 transition-colors flex flex-col items-center justify-center leading-tight ${activeTab === 'mooOwesTee' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('mooOwesTee')}
        >
          <span>หมูติดตี๋</span>
          <span className="text-[10px] font-normal opacity-80">(บิลของตี๋)</span>
        </button>
        <button
          className={`flex-1 py-2 text-sm font-bold text-center border-b-2 transition-colors flex flex-col items-center justify-center leading-tight ${activeTab === 'teeOwesMoo' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('teeOwesMoo')}
        >
          <span>ตี๋ติดหมู</span>
          <span className="text-[10px] font-normal opacity-80">(บิลของหมู)</span>
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มรอบบิล (ของเดือนก่อนหน้า)</label>
          <input 
            type="number" 
            min="1" max="31"
            className="w-full p-2 border rounded-lg"
            value={currentCycle.cycleStartDay}
            onChange={(e) => handleUpdate('cycleStartDay', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันตัดรอบบิล (ของเดือนปัจจุบัน)</label>
          <input 
            type="number" 
            min="1" max="31"
            className="w-full p-2 border rounded-lg"
            value={currentCycle.cycleEndDay}
            onChange={(e) => handleUpdate('cycleEndDay', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันเคลียร์ยอด (ของเดือนถัดไป)</label>
          <input 
            type="number" 
            min="1" max="31"
            className="w-full p-2 border rounded-lg"
            value={currentCycle.payDay}
            onChange={(e) => handleUpdate('payDay', Number(e.target.value))}
          />
        </div>
      </div>
      
      <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
        ตัวอย่างตามค่าปัจจุบัน ({activeTab === 'mooOwesTee' ? 'สำหรับฝั่งหมูติดตี๋' : 'สำหรับฝั่งตี๋ติดหมู'}): ยอดที่เกิดตั้งแต่วันที่ {currentCycle.cycleStartDay} ม.ค. ถึง {currentCycle.cycleEndDay} ก.พ. จะถูกกำหนดให้เคลียร์ในวันที่ {currentCycle.payDay} มี.ค. อัตโนมัติ
      </p>
    </div>
  );
}
