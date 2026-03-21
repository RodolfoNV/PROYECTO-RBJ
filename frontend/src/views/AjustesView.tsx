import React from 'react';

interface AjustesViewProps {
    googleUser: null;
    demoMode: boolean;
    address: string | null;
    onLogout: () => void;
}

export function AjustesView({ googleUser, demoMode, address, onLogout }: AjustesViewProps) {
    const rows = [
        { label: 'Clave Pública', value: address || '—', monospace: true },
        { label: 'Modo', value: demoMode ? '🧪 Demo' : '🪐 Freighter Wallet' },
        { label: 'Red', value: '⛓ Stellar Testnet' },
        { label: 'Contrato Soroban', value: 'student_loan_v1.0' },
    ];

    return (
        <div className="fade-in" style={{ maxWidth: '560px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>
                Ajustes del Sistema
            </h1>

            <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--border-glass)' }}>
                {rows.map((row, i) => (
                    <div key={row.label} style={{
                        padding: '1.25rem 0',
                        borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            {row.label}
                        </div>
                        <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 600, wordBreak: 'break-all', fontFamily: (row as any).monospace ? 'monospace' : 'inherit' }}>
                            {row.value}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2.5rem' }}>
                <button
                    className="btn-primary"
                    style={{
                        width: '100%',
                        background: 'rgba(244,63,94,0.1)',
                        boxShadow: 'none',
                        border: '1px solid rgba(244,63,94,0.3)',
                        color: '#fb7185',
                        fontWeight: 800
                    }}
                    onClick={onLogout}
                >
                    🚪 Finalizar Sesión Segura
                </button>
            </div>
        </div>
    );
}
