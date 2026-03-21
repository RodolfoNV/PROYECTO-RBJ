import React from 'react';

interface InvertirViewProps {
    pool: any;
    myInvestment: any;
    creditScore: any;
    investAmount: string;
    setInvestAmount: (v: string) => void;
    withdrawAmount: string;
    setWithdrawAmount: (v: string) => void;
    investLoading: boolean;
    onInvest: (e: React.FormEvent) => void;
    onWithdraw: (e: React.FormEvent) => void;
}

export function InvertirView({
    pool, myInvestment, creditScore,
    investAmount, setInvestAmount,
    withdrawAmount, setWithdrawAmount,
    investLoading, onInvest, onWithdraw,
}: InvertirViewProps) {
    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                📈 Pool de Inversión
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Deposita XLM en el pool y genera rendimientos con los intereses de los préstamos estudiantiles.
            </p>

            {/* Stats del Pool */}
            {pool && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'TVL (Depósitos)', value: `${Number(pool.total_deposited).toFixed(2)} XLM`, icon: '🏦', color: 'var(--neon-pink-light)', grad: 'linear-gradient(135deg, var(--neon-pink) 0%, #be185d 100%)' },
                        { label: 'APY Estimado', value: `${pool.apy_estimate}%`, icon: '💹', color: 'var(--success)', grad: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)' },
                        { label: 'Utilización', value: `${pool.utilization}%`, icon: '📊', color: 'var(--warning)', grad: 'linear-gradient(135deg, #facc15 0%, #b45309 100%)' },
                        { label: 'Backstop', value: `${Number(pool.backstop).toFixed(2)} XLM`, icon: '🛡️', color: 'var(--neon-cyan-light)', grad: 'linear-gradient(135deg, var(--neon-cyan) 0%, #0e7490 100%)' },
                        { label: 'Liquidación', value: `${Number(pool.available).toFixed(2)} XLM`, icon: '💧', color: '#60a5fa', grad: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
                        { label: 'Inversores', value: pool.investors, icon: '👥', color: '#fff', grad: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' },
                    ].map(stat => (
                        <div key={stat.label} className="stat-card" style={{ borderTop: 'none' }}>
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                background: stat.grad, borderRadius: '100px 100px 0 0'
                            }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {stat.label}
                                </span>
                                <span style={{ fontSize: '1.2rem', filter: `drop-shadow(0 0 5px ${stat.color}44)` }}>{stat.icon}</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', fontFamily: "'Syne', sans-serif" }}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Mi Inversión */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        💰 Mi Inversión
                    </h2>
                    {myInvestment ? (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(236,72,153,0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(236,72,153,0.15)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Depositado</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--neon-pink)', fontFamily: "'Syne', sans-serif" }}>
                                        {Number(myInvestment.amount_deposited).toFixed(2)} <span style={{ fontSize: '0.8rem' }}>XLM</span>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(16,185,129,0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Rendimientos</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)', fontFamily: "'Syne', sans-serif" }}>
                                        +{Number(myInvestment.yield_earned).toFixed(4)}
                                    </div>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(6,182,212,0.04)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(6,182,212,0.15)', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Balance Total</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--neon-cyan)', fontFamily: "'Syne', sans-serif" }}>
                                    {Number(myInvestment.balance).toFixed(4)} XLM
                                </div>
                            </div>

                            {/* Retirar */}
                            <form onSubmit={onWithdraw}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                        📤 Retirar XLM
                                    </label>
                                    <input
                                        type="number"
                                        className="input-web3"
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        placeholder={`Máx: ${Number(myInvestment.balance).toFixed(2)} XLM`}
                                        min="1" step="0.01"
                                    />
                                </div>
                                <button type="submit" className="btn-primary" disabled={investLoading}
                                    style={{ width: '100%', background: 'rgba(6,182,212,0.1)', boxShadow: 'none', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--neon-cyan)' }}
                                >
                                    {investLoading ? '⏳ Procesando...' : '📤 Retirar del Pool'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="float">📊</div>
                            <p style={{ fontSize: '0.9rem' }}>No tienes inversión activa todavía.</p>
                        </div>
                    )}
                </div>

                {/* Depositar al pool */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ➕ Depositar Capital
                    </h2>

                    <div style={{ background: 'rgba(139,92,246,0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(139,92,246,0.15)', marginBottom: '1.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--neon-violet-light)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>¿Cómo funciona?</p>
                        <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <li>🚀 Préstamos con 4.5% interés anual</li>
                            <li>💹 <strong style={{ color: 'var(--success)' }}>66.7%</strong> para inversores (≈3% APY)</li>
                            <li>🛡️ <strong style={{ color: 'var(--neon-cyan)' }}>22.2%</strong> fondo de reserva (Backstop)</li>
                        </ul>
                    </div>

                    <form onSubmit={onInvest}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                💰 Monto a depositar (XLM)
                            </label>
                            <input
                                type="number"
                                className="input-web3"
                                value={investAmount}
                                onChange={e => setInvestAmount(e.target.value)}
                                placeholder="Mínimo 10 XLM"
                                min="10" step="0.01" required
                            />
                        </div>

                        {Number(investAmount) >= 10 && pool && (
                            <div style={{ background: 'rgba(16,185,129,0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>💹 Rendimiento Estimado</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>APY actual:</span>
                                    <span style={{ fontWeight: 800, color: 'var(--success)' }}>{pool.apy_estimate}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Rendimiento anual:</span>
                                    <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                                        {(Number(investAmount) * Number(pool.apy_estimate) / 100).toFixed(4)} XLM
                                    </span>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={investLoading} style={{ width: '100%' }}>
                            {investLoading ? '⏳ Procesando...' : '🚀 Invertir en el Pool'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Score crediticio */}
            {creditScore && (
                <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🏅 Tu Score Crediticio Logihtec
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '100px', height: '100px', background: creditScore.color, opacity: 0.1,
                                borderRadius: '50%', filter: 'blur(30px)'
                            }} />
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: creditScore.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
                                {creditScore.score}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: creditScore.color, textTransform: 'uppercase', marginTop: '0.5rem' }}>{creditScore.level}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Puntos acumulados</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div className="progress-track" style={{ height: '10px', marginBottom: '1rem' }}>
                                <div className="progress-fill" style={{ width: `${(creditScore.score / 850) * 100}%`, background: creditScore.color }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                                <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(255,255,255,1%)' }}>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Completados:</span>
                                    <b style={{ color: 'var(--success)' }}>{creditScore.loans_completed}</b>
                                </div>
                                <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(255,255,255,1%)' }}>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Defaults:</span>
                                    <b style={{ color: 'var(--danger)' }}>{creditScore.loans_defaulted}</b>
                                </div>
                                <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(255,255,255,1%)' }}>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Relación Pago:</span>
                                    <b style={{ color: 'var(--neon-cyan)' }}>{creditScore.payment_ratio}%</b>
                                </div>
                                <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(255,255,255,1%)' }}>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Min Requerido:</span>
                                    <b>{creditScore.min_required}</b>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
