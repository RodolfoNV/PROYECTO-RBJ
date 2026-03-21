import React from 'react';
import type { View } from '../types';

interface MisPrestamosViewProps {
    loans: any[];
    loading?: boolean;
    onPayment: (loanId: number, installment: number) => void;
    onNavigate: (view: View) => void;
    onRefresh?: () => void;
}

export function MisPrestamosView({ loans, loading, onPayment, onNavigate, onRefresh }: MisPrestamosViewProps) {
    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', margin: 0 }}>
                    Mis Préstamos
                </h1>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        style={{
                            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                            borderRadius: '10px', padding: '0.5rem 1rem', color: 'var(--neon-violet-light)',
                            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
                    </button>
                )}
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Consulta y gestiona tus créditos estudiantiles.
            </p>

            {loans.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="float">📂</div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', margin: 0 }}>Sin préstamos aún</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        Solicita tu primer crédito estudiantil.
                    </p>
                    <button className="btn-primary" onClick={() => onNavigate('solicitar')}>
                        + Solicitar Ahora
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {loans.map((loan: any) => {
                        const progress = Math.min(100, (Number(loan.repaid_amount || 0) / Number(loan.amount)) * 100);
                        const installment = Number(loan.amount) / (loan.months || 12);
                        const pendiente = Number(loan.amount) - Number(loan.repaid_amount || 0);
                        const isRepaid = loan.status === 'Repaid';

                        return (
                            <div key={loan.id} className="glass-card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--neon-pink-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        CRÉDITO #{loan.id}
                                    </span>
                                    <span className={isRepaid ? 'badge-repaid' : loan.status === 'Default' ? 'badge-default' : 'badge-active'}>
                                        {isRepaid ? 'Pagado' : loan.status === 'Default' ? 'Default' : 'Activo'}
                                    </span>
                                </div>

                                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#fff', fontFamily: "'Syne', sans-serif", marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
                                    {Number(loan.amount).toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>XLM</span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    Garantía: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{loan.collateral}</span>
                                    &nbsp;·&nbsp; {loan.months || 12} meses
                                </div>

                                {/* Progreso */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Progreso de pago</span>
                                        <span style={{ fontWeight: 800, color: 'var(--neon-pink)' }}>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="progress-track" style={{ height: '8px' }}>
                                        <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--grad-primary)' }} />
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Pagado: <b style={{ color: 'var(--success)' }}>{Number(loan.repaid_amount || 0).toFixed(2)}</b></span>
                                    <span>Pendiente: <b style={{ color: 'var(--warning)' }}>{pendiente.toFixed(2)}</b></span>
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={() => onPayment(loan.id, installment)}
                                    disabled={isRepaid || pendiente <= 0}
                                    style={{
                                        width: '100%',
                                        opacity: isRepaid ? 0.4 : 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isRepaid ? '🏆 Liquidado' : (
                                        <>
                                            <span style={{ fontSize: '1.1rem' }}>💳</span>
                                            Pagar {installment.toFixed(4)} XLM
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
