import { useMemo, useState } from 'react';
import { useAppStore, Transaction } from '../store/useAppStore';
import { format, parseISO } from 'date-fns';
import { History as HistoryIcon, Image as ImageIcon } from 'lucide-react';

export default function History() {
  const { transactions } = useAppStore();
  
  // Group transactions by clearDate
  const groups = useMemo(() => {
    const paidTxs = transactions.filter(t => t.status === 'paid');
    const grouped = paidTxs.reduce((acc, tx) => {
      if (!acc[tx.clearDate]) acc[tx.clearDate] = [];
      acc[tx.clearDate].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
    
    // Sort keys (dates) descending for history
    return Object.keys(grouped).sort().reverse().map(date => ({
      clearDate: date,
      transactions: grouped[date]
    }));
  }, [transactions]);

  const [activeDate, setActiveDate] = useState<string | null>(groups[0]?.clearDate || null);

  if (groups.length > 0 && !activeDate) {
    setActiveDate(groups[0].clearDate);
  }

  const currentGroup = groups.find(g => g.clearDate === activeDate) || groups[0];

  const summary = useMemo(() => {
    let mooOwesTeeTotal = 0; // Tee paid, Moo owes
    let teeOwesMooTotal = 0; // Moo paid, Tee owes
    let totalSpent = 0;

    const teePaidTxs: {tx: Transaction, owes: number}[] = [];
    const mooPaidTxs: {tx: Transaction, owes: number}[] = [];

    if (!currentGroup) return { mooOwesTeeTotal, teeOwesMooTotal, totalSpent, teePaidTxs, mooPaidTxs };

    currentGroup.transactions.forEach(tx => {
      totalSpent += tx.amount;
      
      if (tx.paidBy === 'Tee') {
        let owes = 0;
        if (tx.sharedWith === 'Both') owes = tx.amount / 2;
        else if (tx.sharedWith === 'Moo') owes = tx.amount;
        
        if (owes > 0) {
          mooOwesTeeTotal += owes;
          teePaidTxs.push({ tx, owes });
        }
      } 
      else if (tx.paidBy === 'Moo') {
        let owes = 0;
        if (tx.sharedWith === 'Both') owes = tx.amount / 2;
        else if (tx.sharedWith === 'Tee') owes = tx.amount;

        if (owes > 0) {
          teeOwesMooTotal += owes;
          mooPaidTxs.push({ tx, owes });
        }
      }
    });

    return {
      mooOwesTeeTotal,
      teeOwesMooTotal,
      totalSpent,
      teePaidTxs,
      mooPaidTxs
    };
  }, [currentGroup]);

  if (!currentGroup) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
        <HistoryIcon className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-xl font-bold text-gray-700">ไม่มีประวัติการชำระเงิน</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-4">
      {groups.length > 1 && (
        <div className="flex overflow-x-auto gap-2 pb-2 px-2">
          {groups.map(g => (
            <button
              key={g.clearDate}
              onClick={() => setActiveDate(g.clearDate)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                activeDate === g.clearDate ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-700'
              }`}
            >
              รอบ {format(parseISO(g.clearDate), 'dd MMM yyyy')}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden p-3 relative">
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-10">
          <div style={{ transform: 'rotate(-25deg)', fontSize: '5rem', fontWeight: 900, color: '#16a34a', border: '12px solid #16a34a', padding: '1rem 2rem', borderRadius: '2rem' }}>
            จ่ายแล้ว
          </div>
        </div>

        <div className="text-center mb-4 relative z-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">ประวัติรอบบิลวันที่</h2>
          <p className="text-xl font-black text-gray-700">{format(parseISO(currentGroup.clearDate), 'dd MMM yyyy')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 items-start relative z-10 opacity-80">
          {/* Left Column */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col h-full">
            <div className="text-center mb-3 border-b border-gray-200 pb-2">
              <h3 className="font-black text-gray-700 text-lg">หมูติดตี๋</h3>
              <p className="text-[10px] text-gray-500 mb-1 leading-tight">(ตี๋ออกเงินให้ก่อน หมูต้องจ่ายคืนตี๋)</p>
              <p className="text-2xl font-black text-gray-500">฿{summary.mooOwesTeeTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            
            <div className="space-y-2 flex-1">
              {summary.teePaidTxs.map(({tx, owes}) => (
                <div key={tx.id} className="text-[11px] leading-tight flex justify-between">
                  <div className="flex-1 pr-1">
                    <span className="font-semibold text-gray-700">
                      {tx.description}
                      {tx.receiptUrl && (
                        <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="inline-block ml-1 text-blue-500 hover:text-blue-700" title="ดูรูปสลิป">
                          <ImageIcon className="w-3 h-3 inline mb-[2px]" />
                        </a>
                      )}
                    </span>
                  </div>
                  <div className="font-bold text-gray-600">฿{owes}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col h-full">
            <div className="text-center mb-3 border-b border-gray-200 pb-2">
              <h3 className="font-black text-gray-700 text-lg">ตี๋ติดหมู</h3>
              <p className="text-[10px] text-gray-500 mb-1 leading-tight">(หมูออกเงินให้ก่อน ตี๋ต้องจ่ายคืนหมู)</p>
              <p className="text-2xl font-black text-gray-500">฿{summary.teeOwesMooTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            
            <div className="space-y-2 flex-1">
              {summary.mooPaidTxs.map(({tx, owes}) => (
                <div key={tx.id} className="text-[11px] leading-tight flex justify-between">
                  <div className="flex-1 pr-1">
                    <span className="font-semibold text-gray-700">
                      {tx.description}
                      {tx.receiptUrl && (
                        <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="inline-block ml-1 text-blue-500 hover:text-blue-700" title="ดูรูปสลิป">
                          <ImageIcon className="w-3 h-3 inline mb-[2px]" />
                        </a>
                      )}
                    </span>
                  </div>
                  <div className="font-bold text-gray-600">฿{owes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
