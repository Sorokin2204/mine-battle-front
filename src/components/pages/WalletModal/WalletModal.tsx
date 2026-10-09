import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './WalletModal.module.scss';

type Tab = 'deposit' | 'withdraw' | 'history';
type Method = { name: string; icon: string; fee: number; bonus?: number };
const depositMethods: Method[] = [
  // { name: 'USDT', icon: 'tether', fee: 0, bonus: 7 },
  { name: 'TON', icon: 'ton', fee: 0 },
  { name: 'CryptoBot', icon: 'cryptobot', fee: 0 },
  // { name: 'TG STARS', icon: 'tgstars', fee: 0 },
  // { name: 'Bitcoin', icon: 'bitcoin', fee: 0, bonus: 7 },
  // { name: 'BNB', icon: 'bnb', fee: 0 },
  // { name: 'Tron', icon: 'tron', fee: 0 },
];
const withdrawMethods: Method[] = [
  { name: 'Карта', icon: 'card', fee: 4 },
  { name: 'Юmoney', icon: 'yoo', fee: 7 },
  { name: 'USDT', icon: 'trc20', fee: 0 },
  { name: 'CryptoBot', icon: 'cryptobot', fee: 0 },
  { name: 'USDT TON', icon: 'usdtton', fee: 0 },
];
// Static preview records; payment actions never create transactions.
const history = [
  { method: depositMethods[0], amount: 500 },
  { method: { name: 'USDT', icon: 'tether', fee: 0 }, amount: 500 },
  { method: depositMethods[1], amount: 1000 },
  { method: depositMethods[0], amount: 1000 },
  { method: { name: 'TG STARS', icon: 'tgstars', fee: 0 }, amount: 500 },
];
const TabIcon = ({ tab }: { tab: Tab }) => (
  <svg fill="currentColor" aria-hidden="true">
    <use href={`/bx-icons.svg#${tab === 'history' ? 'timer' : tab === 'deposit' ? 'plus' : 'minus'}`} />
  </svg>
);
const Money = ({ currency = 'RUB', muted = false }: { currency?: string; muted?: boolean }) => <span className={clsx(styles.money, muted && styles.mutedMoney)} aria-hidden="true">{currency === 'RUB' ? '₽' : '$'}</span>;

const WalletModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<Tab>('deposit');
  const [historyTab, setHistoryTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [currency, setCurrency] = useState('RUB');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>('TON');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTab('deposit'); setHistoryTab('deposit'); setCurrency('RUB'); setSelected('TON');
    setAmount(''); setDetails(''); setCurrencyOpen(false);
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const methods = tab === 'withdraw' ? withdrawMethods : depositMethods;
  const switchTab = (next: Tab) => {
    setTab(next); setSelected(next === 'deposit' ? 'TON' : null);
    setAmount(''); setDetails(''); setCurrencyOpen(false); setCurrency('RUB');
  };

  return createPortal(
    <div className={styles.root} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label="Баланс">
        <div className={styles.header}>
          <div className={styles.tabs} role="tablist" aria-label="Операции с балансом">
            {([['deposit', 'ДЕПОЗИТ'], ['withdraw', 'ВЫВОД'], ['history', 'ИСТОРИЯ']] as const).map(([id, label]) => (
              <button type="button" key={id} id={`wallet-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="wallet-panel" className={clsx(styles.tab, tab === id && styles.activeTab)} onClick={() => switchTab(id)}>
                <TabIcon tab={id} /><span>{label}</span>
              </button>
            ))}
          </div>
          <button ref={closeButton} type="button" className={styles.close} onClick={onClose} aria-label="Закрыть баланс"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m3 3 14 14M17 3 3 17" stroke="currentColor" strokeWidth="1.5" /></svg></button>
        </div>
        <div id="wallet-panel" role="tabpanel" aria-labelledby={`wallet-tab-${tab}`} className={styles.content}>
          {tab === 'history' ? <>
            <div className={styles.historyTabs}>
              {(['deposit', 'withdraw'] as const).map(id => <button type="button" key={id} aria-pressed={historyTab === id} className={clsx(styles.historyTab, historyTab === id && styles.activeHistoryTab)} onClick={() => setHistoryTab(id)}><TabIcon tab={id} />{id === 'deposit' ? 'ДЕПОЗИТЫ' : 'ВЫПЛАТЫ'}</button>)}
            </div>
            <div className={styles.history} aria-label="История операций">
              {historyTab === 'deposit' && history.map((record, i) => <div className={styles.historyRow} key={i}><div className={styles.historyLeft}><span className={styles.historyMethod}><img src={`/wallet/${record.method.icon}.svg`} alt="" />{record.method.name}</span><span className={styles.historySum}><Money />{record.amount}</span></div><span className={styles.status}>В обработке...</span></div>)}
            </div>
          </> : <>
            {tab === 'withdraw' && <div className={styles.currencyWrap}>
              <button type="button" className={styles.currency} aria-expanded={currencyOpen} aria-label="Валюта" onClick={() => setCurrencyOpen(!currencyOpen)}><img src={`/wallet/${currency.toLowerCase()}.svg`} alt="" /><span>{currency}</span><span className={clsx(styles.arrow, currencyOpen && styles.arrowOpen)} /></button>
              {currencyOpen && <div className={styles.currencyMenu}>{['RUB', 'USD'].map(code => <button type="button" key={code} onClick={() => { setCurrency(code); setCurrencyOpen(false); setSelected(null); }}><img src={`/wallet/${code.toLowerCase()}.svg`} alt="" />{code}</button>)}</div>}
            </div>}
            <div className={clsx(styles.methodsWrap, tab === 'withdraw' ? styles.withdrawMethods : styles.depositMethods)}><div className={styles.methods} aria-label="Способ оплаты">{methods.map(method => <button type="button" key={method.name} aria-pressed={selected === method.name} className={clsx(styles.method, selected === method.name && styles.selectedMethod)} onClick={() => setSelected(method.name)}><img src={`/wallet/${method.icon}.svg`} alt="" /><span>{method.name}</span><b className={styles.fee}>{method.fee}%</b>{method.bonus && <b className={styles.bonus}>+{method.bonus}%</b>}</button>)}</div></div>
            <form onSubmit={e => e.preventDefault()}>
              <div className={clsx(styles.fields, tab === 'withdraw' && styles.withdrawFields)}>
                <label className={styles.amountField}><input aria-label="Сумма" type={tab === 'deposit' ? 'number' : 'text'} min={tab === 'deposit' ? 0.1 : undefined} step="any" inputMode="decimal" placeholder="ВВЕДИТЕ СУММУ" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} /><span className={styles.minimum}>МИН: {tab === 'deposit' ? '0.1 TON' : <><Money currency={currency} muted />-</>}</span></label>
                {tab === 'withdraw' && <input className={styles.detailsField} aria-label="Реквизиты" placeholder="ВВЕДИТЕ РЕКВИЗИТЫ" value={details} onChange={e => setDetails(e.target.value)} />}
              </div>
              {tab === 'withdraw' && <div className={styles.total}><span>СУММА К ПОЛУЧЕНИЮ:</span><span><Money currency={currency} />0.00</span></div>}
              <button type="submit" className={styles.submit}>{tab === 'deposit' ? 'ПОПОЛНИТЬ' : 'ЗАКАЗАТЬ ВЫПЛАТУ'}</button>
            </form>
          </>}
        </div>
      </div>
    </div>, document.body,
  );
};
export default WalletModal;
