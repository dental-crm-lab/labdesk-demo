'use strict';
const store = require('./store');

const DEFAULT_CONFIG = {
  labName: 'MedLab',
  stages: ['Новый', 'Дизайн (CAD)', 'Фрезеровка / Печать', 'Спекание / Обработка', 'Готово', 'Выдан'],
  deadlineTiers: [
    { maxUnits: 7, days: 4 },
    { maxUnits: 14, days: 6 },
    { maxUnits: 24, days: 8 },
    { maxUnits: 9999, days: 10 }
  ],
  urgentDays: 2,
  urgentPercent: 40,
  payouts: {
    technician: { mode: 'percent', percent: 30, fixedZr: 0, fixedPmma: 0 },
    miller: { mode: 'percent', percent: 0, fixedZr: 0, fixedPmma: 0 }
  },
  nonWorkingWeekdays: [0],
  holidays: [],
  notifyRoles: {
    newOrder: ['owner', 'admin'],
    dueSoon: ['owner'],
    overdue: ['owner']
  }
};

const DEFAULT_PRICE_LIST = [
  { id: '1.1', category: 'Коронки', name: 'Цельнофрезерованная анатомическая коронка ZrO2', price: 6000, unit: 'tooth' },
  { id: '1.2', category: 'Коронки', name: 'Коронка ZrO2 на винтовой фиксации', price: 6000, unit: 'tooth', addon: 1500, addonLabel: 'Титановое основание с винтом' },
  { id: '1.3', category: 'Коронки', name: 'Коронка ZrO2-PRETTAU (редуцирование + e.max)', price: 8000, unit: 'tooth' },
  { id: '1.4', category: 'Коронки', name: 'Коронка ZrO2-PRETTAU на винтовой фиксации (+e.max)', price: 8000, unit: 'tooth', addon: 1500, addonLabel: 'Титановое основание с винтом' },
  { id: '1.5', category: 'Коронки', name: 'Цельнофрезерованная коронка PMMA-Multi', price: 1200, unit: 'tooth' },
  { id: '1.6', category: 'Коронки', name: 'Коронка PMMA-Multi на винтовой фиксации', price: 1200, unit: 'tooth', addon: 1500, addonLabel: 'Титановое основание с винтом' },
  { id: '2.1', category: 'Виниры', name: 'Винир E.max STANDART', price: 9000, unit: 'tooth' },
  { id: '2.2', category: 'Виниры', name: 'Винир E.max Premium на рефракторе', price: 12000, unit: 'tooth' },
  { id: '3.1', category: 'Вкладки', name: 'Вкладка окклюзионная e.max (OnLay)', price: 6500, unit: 'tooth' },
  { id: '3.2', category: 'Вкладки', name: 'Вкладка культевая ZrO2 (InLay)', price: 6000, unit: 'tooth' },
  { id: '4.1', category: 'Индивидуальные абатменты', name: 'Инд. абатмент цельноциркониевый', price: 4500, unit: 'tooth' },
  { id: '4.2', category: 'Индивидуальные абатменты', name: 'Инд. абатмент цельнофрезерованный Premill', price: 5500, unit: 'tooth' },
  { id: '5.1', category: 'Балочные конструкции', name: 'Балка Титан на 4-х имплантах', price: 50000, unit: 'case' },
  { id: '5.2', category: 'Балочные конструкции', name: 'Балка Титан на 5-6-ти имплантах', price: 55000, unit: 'case' },
  { id: '5.3', category: 'Балочные конструкции', name: 'Балка селективное спекание на 4-х имплантах', price: 25000, unit: 'case' },
  { id: '5.4', category: 'Балочные конструкции', name: 'Балка селективное спекание на 5-6 имплантах', price: 30000, unit: 'case' },
  { id: '5.5', category: 'Балочные конструкции', name: 'Супраструктура на балочную конструкцию', price: 80000, unit: 'case' },
  { id: '6.1', category: 'Хирургические шаблоны (3D-печать)', name: 'Хирургический шаблон без втулок', price: 5000, unit: 'case' },
  { id: '6.2', category: 'Хирургические шаблоны (3D-печать)', name: 'Доп. отверстие под имплант', price: 1000, unit: 'case' },
  { id: '7.1', category: '3D печать', name: 'Диагностические модели ВНЧС', price: 3000, unit: 'case' },
  { id: '7.2', category: '3D печать', name: 'WaxUp (моделировка + печать), 1 челюсть', price: 5000, unit: 'case' },
  { id: '8.1', category: 'Прочее', name: 'Восковой базис с прикусными шаблонами', price: 200, unit: 'case' },
  { id: '8.2', category: 'Прочее', name: 'Диагностическая модель из гипса III класса', price: 300, unit: 'case' },
  { id: '8.3', category: 'Прочее', name: 'Титановое основание Multi-Unit Аналог Geo', price: 2500, unit: 'tooth' },
  { id: '8.4', category: 'Прочее', name: 'Титановое основание Аналог Geo', price: 1500, unit: 'tooth' },
  { id: '8.5', category: 'Прочее', name: 'Искусственная десна Aidite (1 зуб)', price: 500, unit: 'tooth' }
];

// Blank/demo seed: no fake orders, doctors, payments, expenses or time-off —
// just the config, the (generic, editable) price list, and a single
// placeholder owner login so the app is usable out of the box. Rename/PIN
// this account (or add real staff) from Настройки → Сотрудники per client.
function seedIfNeeded() {
  if (!store.getDoc('settings/config')) {
    store.setDoc('settings/config', DEFAULT_CONFIG);
  }
  if (!store.getDoc('settings/priceList')) {
    store.setDoc('settings/priceList', { items: DEFAULT_PRICE_LIST });
  }
  const staffRows = store.listCollection('staff');
  if (staffRows.length === 0) {
    store.setDoc('staff/owner-demo', { name: 'Демо', role: 'owner', pin: '1234', phone: '', active: true, demo: false, createdAt: new Date().toISOString() });
  }
}

module.exports = { seedIfNeeded, DEFAULT_CONFIG, DEFAULT_PRICE_LIST };
