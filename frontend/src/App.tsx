import React, { useState, useEffect, useCallback } from 'react';
import { isConnected, requestAccess } from '@stellar/freighter-api';
import {
    fetchLoans, requestLoan, payLoan, fetchMovements,
    fetchPool, invest, withdrawInvestment, fetchMyInvestment, fetchCreditScore,
} from './stellar-service';
import type { View } from './types';

import { LoginView } from './views/LoginView';
import { InicioView } from './views/InicioView';
import { SolicitarView } from './views/SolicitarView';
import { MisPrestamosView } from './views/MisPrestamosView';
import { MovimientosView } from './views/MovimientosView';
import { InvertirView } from './views/InvertirView';
import { AjustesView } from './views/AjustesView';
import { DebateView } from './views/DebateView';
import { RetirosView } from './views/RetirosView';


const MIN_AMOUNT = 10;
const MAX_AMOUNT = 10000;

const NAV_ITEMS = [
    { id: 'inicio' as View, icon: '🏠', label: 'Inicio' },
    { id: 'solicitar' as View, icon: '➕', label: 'Nuevo Préstamo' },
    { id: 'mis-prestamos' as View, icon: '💼', label: 'Mis Préstamos' },
    { id: 'movimientos' as View, icon: '📋', label: 'Movimientos' },
    { id: 'invertir' as View, icon: '📈', label: 'Invertir / Pool' },
    { id: 'retiros' as View, icon: '🏧', label: 'Retiros / Cajeros' },
    { id: 'debate' as View, icon: '⚖️', label: 'Debate AI' },
    { id: 'ajustes' as View, icon: '⚙️', label: 'Ajustes' },
];

function App() {
    const [currentView, setCurrentView] = useState<View>('inicio');
    const [loadingData, setLoadingData] = useState(false);

    const [address, setAddress] = useState<string | null>(null);
    const [demoMode, setDemoMode] = useState(false);

    const [loans, setLoans] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [pool, setPool] = useState<any>(null);
    const [myInvestment, setMyInvestment] = useState<any>(null);
    const [creditScore, setCreditScore] = useState<any>(null);

    const [amount, setAmount] = useState('');
    const [term, setTerm] = useState('12');
    const [collateral, setCollateral] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [formErrors, setFormErrors] = useState<{ amount?: string; collateral?: string }>({});
    const [loanPreview, setLoanPreview] = useState<{ monthly: number; total: number } | null>(null);

    const [investAmount, setInvestAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [investLoading, setInvestLoading] = useState(false);


    // ── Restaurar sesión guardada ────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem('logihtec_session');
        if (saved) {
            try {
                const session = JSON.parse(saved);
                if (session.address) {
                    setAddress(session.address);
                    if (session.demoMode) setDemoMode(true);
                }
            } catch { }
        }
    }, []);


    // ── Datos principales ────────────────────────────────────────────────────
    const refreshData = useCallback(async () => {
        if (!address) return;
        setLoadingData(true);
        try {
            const [loanData, moveData] = await Promise.all([fetchLoans(address), fetchMovements(address)]);
            setLoans(Array.isArray(loanData) ? loanData : []);
            setMovements(Array.isArray(moveData) ? moveData : []);
        } catch (e) { console.error('Error al cargar datos:', e); }
        finally { setLoadingData(false); }
    }, [address]);

    useEffect(() => { if (address) refreshData(); }, [address, refreshData]);


    const refreshInvestData = useCallback(async () => {
        const [poolData, invData] = await Promise.all([
            fetchPool(),
            address ? fetchMyInvestment(address) : Promise.resolve(null),
        ]);
        if (poolData) setPool(poolData);
        if (invData !== undefined) setMyInvestment(invData);
    }, [address]);

    useEffect(() => { refreshInvestData(); }, [refreshInvestData]);


    useEffect(() => {
        if (!address) return;
        fetchCreditScore(address).then(s => { if (s) setCreditScore(s); });
    }, [address]);


    // ── Preview de cuota ─────────────────────────────────────────────────────
    useEffect(() => {
        const num = Number(amount);
        const months = Number(term);
        if (!num || num < MIN_AMOUNT || num > MAX_AMOUNT || !months) { setLoanPreview(null); return; }
        const rate = 4.5 / 100 / 12;
        const monthly = (num * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
        setLoanPreview({ monthly: parseFloat(monthly.toFixed(4)), total: parseFloat((monthly * months).toFixed(4)) });
    }, [amount, term]);


    // ── Auth con Freighter ───────────────────────────────────────────────────
    const saveSession = (data: { address: string; demoMode?: boolean }) => {
        setAddress(data.address);
        setDemoMode(data.demoMode || false);
        localStorage.setItem('logihtec_session', JSON.stringify(data));
    };

    const handleWalletLogin = async () => {
        // En Freighter API v2, isConnected() devuelve { isConnected: boolean }
        const connResult: any = await isConnected();
        const connected = typeof connResult === 'object' ? connResult.isConnected : !!connResult;
        if (!connected) {
            throw new Error('Freighter no está conectado. Instala la extensión y vuelve a intentarlo.');
        }
        // requestAccess() pide permiso y devuelve { address } o { error }
        const result = await requestAccess();
        const pubKey = (result as any)?.address || (result as any)?.publicKey || result;
        if (!pubKey || typeof pubKey !== 'string' || pubKey.trim() === '') {
            throw new Error('No se obtuvo la clave pública. Desbloquea Freighter e intenta de nuevo.');
        }
        saveSession({ address: pubKey });
    };

    const handleLogout = () => {
        localStorage.removeItem('logihtec_session');
        setAddress(null); setDemoMode(false);
        setLoans([]); setMovements([]);
    };

    const handleDemoMode = () => {
        saveSession({ address: 'DEMO_LOGIHTEC_' + Date.now().toString(36).toUpperCase(), demoMode: true });
    };


    // ── Formulario préstamo ──────────────────────────────────────────────────
    const validateForm = (): boolean => {
        const errors: { amount?: string; collateral?: string } = {};
        const num = Number(amount);
        if (!amount || isNaN(num) || num < MIN_AMOUNT || num > MAX_AMOUNT)
            errors.amount = `El monto debe estar entre ${MIN_AMOUNT} y ${MAX_AMOUNT} XLM.`;
        if (!collateral.trim()) errors.collateral = 'El aval o garantía es obligatorio.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address || !validateForm()) return;
        setRequesting(true);
        try {
            const resp = await requestLoan(address, Number(amount), 4.5, Number(term), collateral);

            if (resp.errors) {
                alert('Error de validación:\n' + resp.errors.join('\n'));
                return;
            }
            if (resp.error) {
                alert('Error al solicitar préstamo:\n' + resp.error);
                return;
            }

            alert('¡Préstamo solicitado con éxito!');
            setAmount(''); setCollateral(''); setFormErrors({}); setLoanPreview(null);
            refreshData(); setCurrentView('mis-prestamos');
        } catch (e: any) {
            console.error('Error requesting loan:', e);
            alert('Error al conectar con el servidor. ¿Está corriendo el backend en el puerto 3001?');
        }
        finally { setRequesting(false); }
    };

    const handlePayment = async (loanId: number, installment: number) => {
        if (!address) return;
        if (!window.confirm(`¿Confirmas el pago de ${installment.toFixed(4)} XLM?`)) return;
        try {
            const resp = await payLoan(address, loanId, installment);
            if (resp.error) { alert('Error: ' + resp.error); return; }
            alert(resp.message || '¡Pago registrado exitosamente!');
            refreshData();
        } catch { alert('Error al registrar el pago. Verifica que el servidor esté activo.'); }
    };


    // ── Inversión ────────────────────────────────────────────────────────────
    const handleInvest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;
        const num = Number(investAmount);
        if (isNaN(num) || num < 10) { alert('Mínimo de inversión: 10 XLM.'); return; }
        setInvestLoading(true);
        try {
            const resp = await invest(address, num);
            if (resp.error) { alert('Error: ' + resp.error); return; }
            alert(resp.message || '¡Inversión registrada exitosamente!');
            setInvestAmount(''); await refreshInvestData();
        } catch { alert('Error al conectar con el servidor.'); }
        finally { setInvestLoading(false); }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;
        const num = Number(withdrawAmount);
        if (isNaN(num) || num <= 0) { alert('Ingresa un monto válido para retirar.'); return; }
        setInvestLoading(true);
        try {
            const resp = await withdrawInvestment(address, num);
            if (resp.error) { alert('Error: ' + resp.error); return; }
            alert(resp.message || '¡Retiro procesado!');
            setWithdrawAmount(''); await refreshInvestData();
        } catch { alert('Error al conectar con el servidor.'); }
        finally { setInvestLoading(false); }
    };


    // ── Cálculos de resumen ───────────────────────────────────────────────────
    const activeLoans = loans.filter(l => l.status === 'Active');
    const repaidLoans = loans.filter(l => l.status === 'Repaid');
    const totalDebt = activeLoans.reduce((a, c) => a + Number(c.amount) - Number(c.repaid_amount || 0), 0);
    const totalCobrado = loans.reduce((a, c) => a + Number(c.repaid_amount || 0), 0);


    // ── Pantalla de login ────────────────────────────────────────────────────
    if (!address) {
        return (
            <LoginView
                onWalletLogin={handleWalletLogin}
                onDemoMode={handleDemoMode}
            />
        );
    }



    const shortAddr = demoMode
        ? '🧪 Modo Demo'
        : `${address.slice(0, 6)}…${address.slice(-4)}`;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>

            {/* ─── Sidebar ─── */}
            <aside className="glass-sidebar" style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '1.5rem 0.875rem' }}>
                {/* Logo */}
                <div style={{ padding: '0.5rem 0.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', background: 'var(--grad-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', boxShadow: '0 0 15px rgba(124,58,237,0.4)' }}>💳</div>
                    <span style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>Logihtec</span>
                </div>

                {/* Nav */}
                {NAV_ITEMS.map(item => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setCurrentView(item.id);
                                if (item.id === 'mis-prestamos' || item.id === 'movimientos') refreshData();
                                if (item.id === 'invertir') refreshInvestData();
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem', borderRadius: '12px',
                                border: 'none', cursor: 'pointer', fontSize: '0.88rem',
                                fontWeight: isActive ? 600 : 400,
                                background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
                                color: isActive ? 'var(--neon-violet-light)' : 'var(--text-muted)',
                                textAlign: 'left', width: '100%',
                                transition: 'all 0.15s ease',
                                marginBottom: '0.125rem',
                                fontFamily: "'Inter', sans-serif",
                                boxShadow: isActive ? 'inset 0 0 0 1px rgba(124,58,237,0.3)' : 'none',
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {isActive && (
                                <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-violet-light)', boxShadow: '0 0 6px rgba(167,139,250,0.8)' }} />
                            )}
                        </button>
                    );
                })}

                <div style={{ flex: 1 }} />

                {/* Perfil Wallet */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '0.875rem', border: '1px solid var(--border-glass)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                            {demoMode ? '🧪' : '🪐'}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {demoMode ? 'Modo Demo' : 'Wallet Conectada'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {demoMode ? '🧪 Demo activo' : 'Freighter · Stellar'}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontFamily: 'monospace', wordBreak: 'break-all', letterSpacing: '0.03em' }}>
                        {shortAddr}
                    </div>
                </div>

                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', color: '#f87171', width: '100%', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}>
                    <span>🚪</span><span>Cerrar Sesión</span>
                </button>
            </aside>

            {/* ─── Contenido Principal ─── */}
            <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
                {currentView === 'inicio' && (
                    <InicioView
                        movements={movements}
                        activeLoans={activeLoans.length}
                        repaidLoans={repaidLoans.length}
                        totalDebt={totalDebt}
                        totalCobrado={totalCobrado}
                        onNavigate={setCurrentView}
                    />
                )}
                {currentView === 'solicitar' && (
                    <SolicitarView
                        amount={amount} setAmount={setAmount}
                        term={term} setTerm={setTerm}
                        collateral={collateral} setCollateral={setCollateral}
                        requesting={requesting}
                        formErrors={formErrors} setFormErrors={setFormErrors}
                        loanPreview={loanPreview}
                        onSubmit={handleRequest}
                    />
                )}
                {currentView === 'mis-prestamos' && (
                    <MisPrestamosView
                        loans={loans}
                        loading={loadingData}
                        onPayment={handlePayment}
                        onNavigate={setCurrentView}
                        onRefresh={refreshData}
                    />
                )}
                {currentView === 'movimientos' && (
                    <MovimientosView movements={movements} />
                )}
                {currentView === 'invertir' && (
                    <InvertirView
                        pool={pool} myInvestment={myInvestment} creditScore={creditScore}
                        investAmount={investAmount} setInvestAmount={setInvestAmount}
                        withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount}
                        investLoading={investLoading}
                        onInvest={handleInvest} onWithdraw={handleWithdraw}
                    />
                )}
                {currentView === 'debate' && (
                    <DebateView />
                )}
                {currentView === 'retiros' && (
                    <RetirosView />
                )}
                {currentView === 'ajustes' && (
                    <AjustesView
                        googleUser={null}
                        demoMode={demoMode}
                        address={address}
                        onLogout={handleLogout}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
