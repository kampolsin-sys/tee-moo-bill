import { useState, useEffect } from 'react';
import { useAppStore, User } from '../store/useAppStore';
import { calculateClearDate } from '../lib/dateUtils';
import { format } from 'date-fns';

export default function AddTransaction() {
  const addTransaction = useAppStore((state) => state.addTransaction);
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<User>('Tee');
  const [sharedWith, setSharedWith] = useState<User | 'Both'>('Both');
  const [clearDate, setClearDate] = useState(calculateClearDate(format(new Date(), 'yyyy-MM-dd'), 'Tee'));

  useEffect(() => {
    setClearDate(calculateClearDate(date, paidBy));
  }, [date, paidBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    addTransaction({
      date,
      description,
      note,
      amount: parseFloat(amount),
      paidBy,
      sharedWith,
      clearDate
    });
    
    // reset form but keep some defaults
    setDescription('');
    setNote('');
    setAmount('');
    alert('บันทึกรายการสำเร็จ');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">เพิ่มรายการใช้จ่าย</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ใช้จ่าย</label>
          <input 
            type="date" 
            required
            className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายการ</label>
          <input 
            type="text" 
            required
            placeholder="เช่น ค่าข้าวต้ม, ค่าเน็ต"
            className="w-full p-2 border rounded-lg"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงิน (บาท)</label>
          <input 
            type="number" 
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full p-2 border rounded-lg text-xl"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ใครเป็นคนออกเงินก่อน?</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value as User)}
            >
              <option value="Tee">ตี๋เป็นคนจ่าย</option>
              <option value="Moo">หมูเป็นคนจ่าย</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายการนี้เป็นของใคร?</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={sharedWith}
              onChange={(e) => setSharedWith(e.target.value as User | 'Both')}
            >
              <option value="Both">ใช้ร่วมกัน (หารครึ่ง)</option>
              <option value="Moo">ของหมูคนเดียว</option>
              <option value="Tee">ของตี๋คนเดียว</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded-lg"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="pt-2 border-t mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ต้องเคลียร์ยอด</label>
          <input 
            type="date" 
            required
            className="w-full p-2 border rounded-lg bg-blue-50 text-blue-700 font-medium"
            value={clearDate}
            onChange={(e) => setClearDate(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">* คำนวณอัตโนมัติตามรอบบิล แต่สามารถแก้ไขเองได้</p>
        </div>

        <button type="submit" className="w-full bg-primary text-white p-3 rounded-xl font-bold text-lg mt-4 shadow-md active:scale-95 transition-transform">
          บันทึกรายการ
        </button>
      </form>
    </div>
  );
}
