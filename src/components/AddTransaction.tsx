import { useState, useEffect } from 'react';
import { useAppStore, User } from '../store/useAppStore';
import { calculateClearDate } from '../lib/dateUtils';
import { format } from 'date-fns';

export default function AddTransaction() {
  const { addTransaction, draftTransaction, setDraftTransaction, setActiveTab } = useAppStore();
  
  const [date, setDate] = useState(draftTransaction?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(draftTransaction?.description || '');
  const [note, setNote] = useState(draftTransaction?.note || '');
  const [amount, setAmount] = useState(draftTransaction?.amount?.toString() || '');
  const [paidBy, setPaidBy] = useState<User>(draftTransaction?.paidBy || 'Tee');
  const [sharedWith, setSharedWith] = useState<User | 'Both'>(draftTransaction?.sharedWith || 'Both');
  const [clearDate, setClearDate] = useState(draftTransaction?.clearDate || calculateClearDate(format(new Date(), 'yyyy-MM-dd'), draftTransaction?.paidBy || 'Tee'));
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!draftTransaction?.clearDate) {
      setClearDate(calculateClearDate(date, paidBy));
    }
  }, [date, paidBy, draftTransaction]);

  // Clear draft when unmounting so it doesn't persist forever
  useEffect(() => {
    return () => setDraftTransaction(null);
  }, [setDraftTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    let receiptUrl = undefined;
    if (receiptFile) {
      setIsUploading(true);
      try {
        const { uploadReceipt } = await import('../lib/uploadUtils');
        receiptUrl = await uploadReceipt(receiptFile);
      } catch (err) {
        alert('อัปโหลดไฟล์ล้มเหลว กรุณาลองใหม่');
        setIsUploading(false);
        return;
      }
    }

    addTransaction({
      date,
      description,
      note,
      amount: parseFloat(amount),
      paidBy,
      sharedWith,
      clearDate,
      receiptUrl
    });
    
    // reset form but keep some defaults
    setDescription('');
    setNote('');
    setAmount('');
    setReceiptFile(null);
    setIsUploading(false);
    setActiveTab('home');
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
            className="w-full p-2 border rounded-lg bg-blue-50 text-blue-700 font-medium mb-1"
            value={clearDate}
            onChange={(e) => setClearDate(e.target.value)}
          />
          <p className="text-xs text-gray-500 mb-4">* คำนวณอัตโนมัติตามรอบบิล แต่สามารถแก้ไขเองได้</p>
          
          <label className="block text-sm font-medium text-gray-700 mb-1 pt-2 border-t">แนบรูปสลิป / บิล (ไม่บังคับ)</label>

          <input 
            type="file" 
            accept="image/*"
            className="w-full p-2 border rounded-lg text-sm bg-gray-50"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setReceiptFile(e.target.files[0]);
              }
            }}
          />
          {receiptFile && <p className="text-xs text-green-600 mt-1">เลือกไฟล์: {receiptFile.name}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isUploading}
          className={`w-full text-white p-3 rounded-xl font-bold text-lg mt-4 shadow-md transition-transform ${isUploading ? 'bg-gray-400' : 'bg-primary active:scale-95'}`}
        >
          {isUploading ? 'กำลังอัปโหลด...' : 'บันทึกรายการ'}
        </button>
      </form>
    </div>
  );
}
