import { addMonths, getDate, setDate, format } from 'date-fns';
import { useAppStore, getCycleSettings, User } from '../store/useAppStore';

export function calculateClearDate(expenseDateStr: string, paidBy: User) {
  const storeSettings = useAppStore.getState().settings;
  // If Tee paid, Moo owes Tee. If Moo paid, Tee owes Moo.
  const cycleType = paidBy === 'Tee' ? 'mooOwesTee' : 'teeOwesMoo';
  const settings = getCycleSettings(storeSettings, cycleType);
  
  const expenseDate = new Date(expenseDateStr);
  const day = getDate(expenseDate);
  
  let targetMonth = expenseDate;
  
  if (day > settings.cycleEndDay) {
    targetMonth = addMonths(expenseDate, 2);
  } else {
    targetMonth = addMonths(expenseDate, 1);
  }
  
  const clearDate = setDate(targetMonth, settings.payDay);
  return format(clearDate, 'yyyy-MM-dd');
}
