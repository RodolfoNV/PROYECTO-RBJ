import React from 'react';

interface MovimientosViewProps {
    movements: any[];
}

export function MovimientosView({ movements }: MovimientosViewProps) {
    const typeLabel = (type: string) => {
        if (type === 'DISBURSEMENT') return 'Desembolso';
        if (type === 'PAYMENT') return 'Abono';
        if (type === 'INVESTMENT') return 'Inversión';
        if (type === 'WITHDRAWAL') return 'Retiro';
        if (type === 'YIELD') return 'Rendimiento';
        return type;
    };
    const typeIcon = (type: string) => {
        if (type === 'DISBURSEMENT') return '📥';
        if (type === 'PAYMENT') return '📤';
        if (type === 'INVESTMENT') return '💰';
        if (type === 'WITHDRAWAL') return '🏧';
        if (type === 'YIELD') return '💹';
        return '📋';
    };
    const typeColor = (type: string) => {
        if (type === 'DISBURSEMENT') return 'var(--warning)';
        if (type === 'PAYMENT') return 'var(--success)';
        if (type === 'INVESTMENT') return 'var(--neon-violet-light)';
        if (type === 'WITHDRAWAL') return '#f87171';
        if (type === 'YIELD') return 'var(--neon-cyan)';
        return 'var(--text-primary)';
    };
    const typeSign = (type: string) => ['DISBURSEMENT', 'INVESTMENT', 'WITHDRAWAL'].includes(type) ? '+' : type === 'PAYMENT' ? '-' : '+';

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                Movimientos
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.92rem' }}>
                Historial completo de transacciones en la red Stellar.
            </p>

            <div className="glass-card" style={{ overflow: 'hidden', padding: 0, border: '1px solid var(--border-glass)' }}>
                <table className="table-web3">
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                            {['Tipo de Operación', 'Fecha', 'Monto (XLM)', 'Stellar TX Hash'].map(h => (
                                <th key={h} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '1.25rem' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {movements.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
                                <p>Sin movimientos registrados aún</p>
                            </td></tr>
                        ) : movements.map((m: any) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.03)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            {typeIcon(m.type)}
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{typeLabel(m.type)}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1.25rem' }}>
                                    {new Date(m.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ fontWeight: 900, color: typeColor(m.type), fontSize: '0.95rem', padding: '1.25rem' }}>
                                    {typeSign(m.type)}{Number(m.amount).toFixed(4)}
                                </td>
                                <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'monospace', padding: '1.25rem' }}>
                                    {m.tx_hash ? (
                                        <a href={`https://stellar.expert/explorer/testnet/tx/${m.tx_hash}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {m.tx_hash.slice(0, 8)}...{m.tx_hash.slice(-8)} 🔗
                                        </a>
                                    ) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
