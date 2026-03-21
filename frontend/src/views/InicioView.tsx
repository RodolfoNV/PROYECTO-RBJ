import React from 'react';
import type { View } from '../types';

interface InicioViewProps {
    movements: any[];
    activeLoans: number;
    repaidLoans: number;
    totalDebt: number;
    totalCobrado: number;
    onNavigate: (view: View) => void;
}

export function InicioView({ movements, activeLoans, repaidLoans, totalDebt, totalCobrado, onNavigate }: InicioViewProps) {
    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Resumen General
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Bienvenido 👋  Aquí tienes un resumen de tus créditos.
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {[
                    { label: 'Préstamos Activos', value: activeLoans, icon: '📊', color: 'var(--neon-violet-light)', grad: 'linear-gradient(135deg, var(--neon-violet) 0%, #4f46e5 100%)' },
                    { label: 'Deuda Pendiente', value: `${totalDebt.toFixed(2)} XLM`, icon: '💰', color: 'var(--warning)', grad: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' },
                    { label: 'Total Repagado', value: `${totalCobrado.toFixed(2)} XLM`, icon: '✅', color: 'var(--success)', grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
                    { label: 'Préstamos Pagados', value: repaidLoans, icon: '🏆', color: 'var(--neon-cyan-light)', grad: 'linear-gradient(135deg, var(--neon-cyan) 0%, #0891b2 100%)' },
                ].map(stat => (
                    <div key={stat.label} className="stat-card" style={{ borderTop: 'none' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                            background: stat.grad, borderRadius: '100px 100px 0 0'
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {stat.label}
                            </span>
                            <span style={{ fontSize: '1.3rem', filter: `drop-shadow(0 0 5px ${stat.color}44)` }}>{stat.icon}</span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actividad Reciente */}
            <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    Actividad Reciente
                </h2>
                {movements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                        <p>Sin movimientos todavía</p>
                        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => onNavigate('solicitar')}>
                            + Solicitar Préstamo
                        </button>
                    </div>
                ) : (
                    movements.slice(0, 6).map((m: any) => (
                        <div key={m.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.875rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: m.type === 'DISBURSEMENT' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                                    border: `1px solid ${m.type === 'DISBURSEMENT' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                }}>
                                    {m.type === 'DISBURSEMENT' ? '📥' : m.type === 'YIELD' ? '💹' : '📤'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                        {m.type === 'DISBURSEMENT' ? 'Préstamo Recibido' : m.type === 'YIELD' ? 'Rendimiento' : 'Pago Realizado'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(m.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                fontWeight: 700, fontSize: '0.9rem',
                                color: m.type === 'DISBURSEMENT' ? 'var(--warning)' : m.type === 'YIELD' ? 'var(--neon-cyan)' : 'var(--success)',
                            }}>
                                {m.type === 'DISBURSEMENT' ? '+' : m.type === 'YIELD' ? '+' : '-'}{Number(m.amount).toFixed(4)} XLM
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
