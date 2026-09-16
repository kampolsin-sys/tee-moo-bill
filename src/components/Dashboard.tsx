import { useMemo, useState, useRef } from 'react';
import { useAppStore, Transaction, User } from '../store/useAppStore';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Trash2, CheckCircle2, Download, Edit2, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import EditModal from './EditModal';
import ImageViewer from './ImageViewer';

export default function Dashboard() {
  const { transactions, markCycleAsPaid, deleteTransaction } = useAppStore();
  const billRef = useRef<HTMLDivElement>(null);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [checkoutImage, setCheckoutImage] = useState<string | null>(null);
  
  // Group transactions by clearDate
  const groups = useMemo(() => {
    const pendingTxs = transactions.filter(t => t.status === 'pending');
    const grouped = pendingTxs.reduce((acc, tx) => {
      if (!acc[tx.clearDate]) acc[tx.clearDate] = [];
      acc[tx.clearDate].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
    
    // Sort keys (dates) ascending
    return Object.keys(grouped).sort().map(date => ({
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

  const handleCheckout = async (whoIsPaying: User | 'All') => {
    if (!currentGroup || !billRef.current) return;
    
    // hide buttons during capture
    const buttonsToHide = billRef.current.querySelectorAll('.no-print');
    buttonsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    // Create temporary stamp
    const stampDiv = document.createElement('div');
    stampDiv.className = "absolute inset-0 flex items-center justify-center z-50 pointer-events-none";
    let stampHtml = '';
    if (whoIsPaying === 'All') {
      stampHtml = `<div style="transform: rotate(-15deg); font-size: 3rem; font-weight: 900; color: #22c55e; border: 8px solid #22c55e; padding: 1rem 2rem; border-radius: 1rem; opacity: 0.35; background: rgba(255,255,255,0.4);">เคลียร์แล้ว</div>`;
    } else if (whoIsPaying === 'Moo') {
      stampHtml = `<div style="transform: rotate(-15deg); font-size: 2.5rem; font-weight: 900; color: #f97316; border: 8px solid #f97316; padding: 1rem 2rem; border-radius: 1rem; opacity: 0.35; background: rgba(255,255,255,0.4); margin-right: 50%;">หมูเคลียร์แล้ว</div>`;
    } else {
      stampHtml = `<div style="transform: rotate(-15deg); font-size: 2.5rem; font-weight: 900; color: #ec4899; border: 8px solid #ec4899; padding: 1rem 2rem; border-radius: 1rem; opacity: 0.35; background: rgba(255,255,255,0.4); margin-left: 50%;">ตี๋เคลียร์แล้ว</div>`;
    }
    stampDiv.innerHTML = stampHtml;
    billRef.current.appendChild(stampDiv);

    try {
      // Small delay to ensure stamp is rendered
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(billRef.current, { scale: 2, backgroundColor: '#f9fafb' });
      const image = canvas.toDataURL("image/jpeg");
      const suffix = whoIsPaying === 'All' ? 'all' : whoIsPaying.toLowerCase();
      const filename = `bill-${currentGroup.clearDate}-${suffix}.jpg`;
      
      // Try Web Share API for mobile first
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      let shared = false;
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'สรุปบิลตี๋หมู',
            });
            shared = true;
          } catch (e) {
            console.log('Share cancelled or failed', e);
          }
        }
      }

      if (!shared) {
        setCheckoutImage(image);
      }
      
      const promptText = whoIsPaying === 'All' 
        ? "ต้องการบันทึกว่าบิลรอบนี้ 'จ่ายครบทั้งหมดแล้ว' หรือไม่?"
        : `ต้องการบันทึกว่า '${whoIsPaying === 'Tee' ? 'ตี๋' : 'หมู'} จ่ายคืนแล้ว' หรือไม่?`;

      if (window.confirm(promptText)) {
        markCycleAsPaid(currentGroup.clearDate, whoIsPaying);
        if (whoIsPaying === 'All' || currentGroup.transactions.length === 0) {
          setActiveDate(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพ");
    } finally {
      // cleanup stamp and show buttons
      billRef.current.removeChild(stampDiv);
      buttonsToHide.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  if (!currentGroup) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 relative">
        <CheckCircle2 className="w-16 h-16 text-green-300 mb-4" />
        <p className="text-xl font-bold text-gray-700">ไม่มีบิลค้างชำระ 🎉</p>
        <p className="mt-2 text-sm text-center">ทุกอย่างเคลียร์หมดแล้วจ้า</p>
        {editingTx && <EditModal transaction={editingTx} onClose={() => setEditingTx(null)} />}
      </div>
    );
  }

  return (
    <div className="p-2 space-y-4 relative">
      {editingTx && <EditModal transaction={editingTx} onClose={() => setEditingTx(null)} />}
      
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
              รอบ {format(parseISO(g.clearDate), 'dd MMM yyyy', { locale: th })}
            </button>
          ))}
        </div>
      )}

      <div ref={billRef} className="bg-white rounded-2xl shadow-sm border overflow-hidden p-3 relative">
        <div className="text-center mb-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">รอบบิลที่จะเคลียร์วันที่</h2>
          <p className="text-xl font-black text-primary">{format(parseISO(currentGroup.clearDate), 'dd MMM yyyy', { locale: th })}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 items-start relative">
          {/* Left Column: Tee paid, Moo owes */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col h-full relative z-10">
            <div className="text-center mb-3 border-b border-orange-200 pb-2">
              <h3 className="font-black text-orange-800 text-lg">หมูติดตี๋</h3>
              <p className="text-[10px] text-gray-500 mb-1 leading-tight">(ตี๋ออกเงินให้ก่อน หมูต้องจ่ายคืนตี๋)</p>
              <p className="text-2xl font-black text-orange-600">฿{summary.mooOwesTeeTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            
            <div className="space-y-2 flex-1">
              {summary.teePaidTxs.map(({tx, owes}) => (
                <div 
                  key={tx.id} 
                  className="text-[11px] leading-tight flex justify-between group cursor-pointer hover:bg-orange-100/50 p-1 -mx-1 rounded transition-colors"
                  onClick={() => setEditingTx(tx)}
                >
                  <div className="flex-1 pr-1">
                    <span className="font-semibold text-gray-800">
                      {tx.description}
                      {tx.receiptUrl && (
                        <button onClick={(e) => { e.stopPropagation(); setViewingImage(tx.receiptUrl!); }} className="inline-block ml-1 text-blue-500 hover:text-blue-700" title="ดูรูปสลิป">
                          <ImageIcon className="w-3 h-3 inline mb-[2px]" />
                        </button>
                      )}
                    </span>
                    <span className="no-print whitespace-nowrap ml-1">
                      <button className="text-blue-300 hover:text-blue-500 inline" onClick={(e) => { e.stopPropagation(); setEditingTx(tx); }}>
                        <Edit2 className="w-3 h-3 inline" />
                      </button>
                      <button className="text-red-300 hover:text-red-500 ml-1 inline" onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}>
                        <Trash2 className="w-3 h-3 inline" />
                      </button>
                    </span>
                    <div className="text-[10px] text-gray-500">
                      ยอดเต็ม ฿{tx.amount} {tx.sharedWith === 'Both' ? '(หารครึ่ง)' : '(คุณใช้คนเดียว)'}
                    </div>
                  </div>
                  <div className="font-bold text-orange-700">฿{owes}</div>
                </div>
              ))}
              {summary.teePaidTxs.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-4">ไม่มีรายการ</p>
              )}
            </div>

            <button 
              onClick={() => handleCheckout('Moo')}
              disabled={summary.mooOwesTeeTotal === 0}
              className="no-print mt-3 w-full bg-orange-500 disabled:bg-gray-300 text-white p-2 rounded-lg font-bold text-sm flex justify-center items-center gap-1 active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" /> หมูจ่ายคืนแล้ว
            </button>
          </div>

          {/* Right Column: Moo paid, Tee owes */}
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 flex flex-col h-full relative z-10">
            <div className="text-center mb-3 border-b border-pink-200 pb-2">
              <h3 className="font-black text-pink-800 text-lg">ตี๋ติดหมู</h3>
              <p className="text-[10px] text-gray-500 mb-1 leading-tight">(หมูออกเงินให้ก่อน ตี๋ต้องจ่ายคืนหมู)</p>
              <p className="text-2xl font-black text-pink-600">฿{summary.teeOwesMooTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            
            <div className="space-y-2 flex-1">
              {summary.mooPaidTxs.map(({tx, owes}) => (
                <div 
                  key={tx.id} 
                  className="text-[11px] leading-tight flex justify-between group cursor-pointer hover:bg-pink-100/50 p-1 -mx-1 rounded transition-colors"
                  onClick={() => setEditingTx(tx)}
                >
                  <div className="flex-1 pr-1">
                    <span className="font-semibold text-gray-800">
                      {tx.description}
                      {tx.receiptUrl && (
                        <button onClick={(e) => { e.stopPropagation(); setViewingImage(tx.receiptUrl!); }} className="inline-block ml-1 text-blue-500 hover:text-blue-700" title="ดูรูปสลิป">
                          <ImageIcon className="w-3 h-3 inline mb-[2px]" />
                        </button>
                      )}
                    </span>
                    <span className="no-print whitespace-nowrap ml-1">
                      <button className="text-blue-300 hover:text-blue-500 inline" onClick={(e) => { e.stopPropagation(); setEditingTx(tx); }}>
                        <Edit2 className="w-3 h-3 inline" />
                      </button>
                      <button className="text-red-300 hover:text-red-500 ml-1 inline" onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}>
                        <Trash2 className="w-3 h-3 inline" />
                      </button>
                    </span>
                    <div className="text-[10px] text-gray-500">
                      ยอดเต็ม ฿{tx.amount} {tx.sharedWith === 'Both' ? '(หารครึ่ง)' : '(คุณใช้คนเดียว)'}
                    </div>
                  </div>
                  <div className="font-bold text-pink-700">฿{owes}</div>
                </div>
              ))}
              {summary.mooPaidTxs.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-4">ไม่มีรายการ</p>
              )}
            </div>

            <button 
              onClick={() => handleCheckout('Tee')}
              disabled={summary.teeOwesMooTotal === 0}
              className="no-print mt-3 w-full bg-pink-500 disabled:bg-gray-300 text-white p-2 rounded-lg font-bold text-sm flex justify-center items-center gap-1 active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" /> ตี๋จ่ายคืนแล้ว
            </button>
          </div>
        </div>

        {/* Net Total Summary */}
        <div className="text-center pt-2 border-t text-sm relative z-10">
          {summary.mooOwesTeeTotal === summary.teeOwesMooTotal ? (
            <span className="text-gray-500 font-bold">ยอดเจ๊ากันพอดี</span>
          ) : (
            <span className="font-bold">
              สรุปยอดหักลบ: <span className={summary.mooOwesTeeTotal > summary.teeOwesMooTotal ? "text-orange-600" : "text-pink-600"}>
                {summary.mooOwesTeeTotal > summary.teeOwesMooTotal ? "หมูต้องโอนให้ตี๋ " : "ตี๋ต้องโอนให้หมู "}
                ฿{Math.abs(summary.mooOwesTeeTotal - summary.teeOwesMooTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </span>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => handleCheckout('All')}
        className="w-full bg-green-600 text-white p-3 rounded-xl font-bold shadow flex justify-center items-center gap-2 active:scale-95 transition-transform"
      >
        <CheckCircle2 className="w-5 h-5" /> เคลียร์ยอดทั้งสองฝ่าย & เซฟรูป
      </button>
      
      {viewingImage && (
        <ImageViewer 
          url={viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}

      {checkoutImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-white/10 w-full p-4 text-center rounded-t-xl mb-4 shadow-lg text-white font-medium">
            👇 แตะรูปภาพค้างไว้ แล้วเลือก "บันทึกรูปภาพ" (Save Image)
          </div>
          <button 
            onClick={() => setCheckoutImage(null)}
            className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition z-10"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="flex-1 w-full flex items-center justify-center overflow-auto pb-8">
            <img 
              src={checkoutImage} 
              alt="Checkout Bill" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'default' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
