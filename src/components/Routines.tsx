import { useState } from 'react';
import { useAppStore, User, Routine } from '../store/useAppStore';
import { calculateClearDate } from '../lib/dateUtils';
import { format } from 'date-fns';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';

export default function Routines() {
  const { routines, addRoutine, deleteRoutine, addTransaction, setDraftTransaction } = useAppStore();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<User>('Tee');
  const [sharedWith, setSharedWith] = useState<User | 'Both'>('Both');

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    addRoutine({
      description,
      amount: parseFloat(amount),
      paidBy,
      sharedWith
    });
    
    setDescription('');
    setAmount('');
  };

  const handleUseRoutine = (routine: Routine) => {
    setDraftTransaction({
      description: routine.description,
      amount: routine.amount,
      paidBy: routine.paidBy,
      sharedWith: routine.sharedWith,
      note: 'จากรายการประจำ',
    });
    useAppStore.getState().setActiveTab('add');
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">จัดการรายการประจำเดือน</h2>
      
      <form onSubmit={handleAddRoutine} className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
        <h3 className="font-semibold text-gray-700 border-b pb-2">สร้างรายการใหม่</h3>
        
        <div>
          <input 
            type="text" required placeholder="ชื่อรายการ (เช่น ค่าเช่าห้อง, เน็ต)"
            className="w-full p-2 border rounded-lg"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <input 
            type="number" required placeholder="ยอดเงินเริ่มต้น" step="0.01"
            className="w-full p-2 border rounded-lg"
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ใครเป็นคนออกเงินก่อน?</label>
            <select className="w-full p-2 border rounded-lg" value={paidBy} onChange={(e) => setPaidBy(e.target.value as User)}>
              <option value="Tee">ตี๋จ่าย</option>
              <option value="Moo">หมูจ่าย</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">รายการนี้เป็นของใคร?</label>
            <select className="w-full p-2 border rounded-lg" value={sharedWith} onChange={(e) => setSharedWith(e.target.value as User | 'Both')}>
              <option value="Both">ใช้ร่วมกัน (หารครึ่ง)</option>
              <option value="Moo">ของหมูคนเดียว</option>
              <option value="Tee">ของตี๋คนเดียว</option>
            </select>
          </div>
        </div>
        <button type="submit" className="w-full bg-gray-800 text-white p-2 rounded-lg font-medium flex items-center justify-center gap-2">
          <PlusCircle className="w-5 h-5" /> เพิ่มรายการประจำ
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">รายการที่มีอยู่</h3>
        {routines.length === 0 ? (
          <p className="text-gray-500 text-center py-4">ยังไม่มีรายการประจำ</p>
        ) : (
          routines.map(routine => (
            <div key={routine.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-800">{routine.description}</h4>
                  <p className="text-sm text-gray-500">฿{routine.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <button onClick={() => deleteRoutine(routine.id)} className="text-red-400 p-1">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUseRoutine(routine)}
                  className="flex-1 bg-green-50 text-green-700 border border-green-200 p-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4" /> ใช้รายการนี้
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
