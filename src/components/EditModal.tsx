import { useState } from 'react';
import { useAppStore, Transaction, User } from '../store/useAppStore';

interface EditModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function EditModal({ transaction, onClose }: EditModalProps) {
  const { updateTransaction } = useAppStore();
  
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [note, setNote] = useState(transaction.note || '');
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [paidBy, setPaidBy] = useState<User>(transaction.paidBy);
  const [sharedWith, setSharedWith] = useState<User | 'Both'>(transaction.sharedWith);
  const [clearDate, setClearDate] = useState(transaction.clearDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTransaction(transaction.id, {
      date,
      description,
      note,
      amount: parseFloat(amount),
      paidBy,
      sharedWith,
      clearDate
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">แก้ไขรายการ</h3>
          <button onClick={onClose} className="text-gray-500 font-bold text-xl px-2">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">วันที่ใช้จ่าย</label>
            <input type="date" required className="w-full p-2 border rounded-lg text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">รายการ</label>
            <input type="text" required className="w-full p-2 border rounded-lg text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ยอดเงิน (บาท)</label>
            <input type="number" required min="0" step="0.01" className="w-full p-2 border rounded-lg text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ใครออกเงินก่อน?</label>
              <select className="w-full p-2 border rounded-lg" value={paidBy} onChange={(e) => setPaidBy(e.target.value as User)}>
                <option value="Tee">ตี๋เป็นคนจ่าย</option>
                <option value="Moo">หมูเป็นคนจ่าย</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">รายการเป็นของใคร?</label>
              <select className="w-full p-2 border rounded-lg" value={sharedWith} onChange={(e) => setSharedWith(e.target.value as User | 'Both')}>
                <option value="Both">ทั้งคู่ (หารครึ่ง)</option>
                <option value="Moo">ของหมูคนเดียว</option>
                <option value="Tee">ของตี๋คนเดียว</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
            <input type="text" className="w-full p-2 border rounded-lg text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">วันที่ต้องเคลียร์ยอด</label>
            <input type="date" required className="w-full p-2 border rounded-lg text-sm" value={clearDate} onChange={(e) => setClearDate(e.target.value)} />
          </div>

          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 p-2 bg-gray-100 text-gray-700 rounded-lg font-medium">ยกเลิก</button>
            <button type="submit" className="flex-1 p-2 bg-primary text-white rounded-lg font-medium">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
