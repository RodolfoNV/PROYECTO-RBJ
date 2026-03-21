import React, { useState } from 'react';

interface LoginViewProps {
    onWalletLogin: () => Promise<void>;
    onDemoMode: () => void;
}

export function LoginView({ onWalletLogin, onDemoMode }: LoginViewProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleWallet = async () => {
        setError(null);
        setLoading(true);
        try {
            await onWalletLogin();
        } catch (e: any) {
            setError(e?.message || 'No se pudo conectar la wallet. ¿Tienes Freighter instalado?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Orbes de fondo */}
            <div style={{
                position: 'absolute', width: '600px', height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
                top: '-150px', left: '-150px', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', width: '500px', height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
                bottom: '-100px', right: '-100px', pointerEvents: 'none',
            }} />

            <div className="glass-card slide-up" style={{
                width: '100%', maxWidth: '420px',
                padding: '2.5rem 2.25rem',
                textAlign: 'center',
                position: 'relative',
            }}>
                {/* Logo */}
                <div style={{
                    width: '80px', height: '80px',
                    background: 'var(--grad-primary)',
                    borderRadius: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.75rem',
                    fontSize: '2.25rem',
                    boxShadow: '0 0 30px rgba(124,58,237,0.5)',
                    animation: 'pulse-glow 3s ease-in-out infinite',
                }}>💳</div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '2.25rem', fontWeight: 800,
                    marginBottom: '0.5rem',
                    background: 'var(--grad-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>Logihtec</h1>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                    Gestión descentralizada de créditos estudiantiles.<br />
                    <span style={{ color: 'var(--neon-violet-light)', fontSize: '0.8rem' }}>Powered by Stellar Blockchain</span>
                </p>

                {/* Chips */}
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    {['🔐 Seguro', '⛓ Blockchain', '🌐 Web 3.0', '🚀 Descentralizado'].map(label => (
                        <span key={label} className="neon-chip">{label}</span>
                    ))}
                </div>

                {/* Botón Freighter */}
                <button
                    id="btn-connect-wallet"
                    onClick={handleWallet}
                    disabled={loading}
                    style={{
                        width: '100%',
                        marginBottom: '0.75rem',
                        padding: '0.9rem 1.25rem',
                        borderRadius: '14px',
                        border: '1px solid rgba(124,58,237,0.5)',
                        background: loading
                            ? 'rgba(124,58,237,0.15)'
                            : 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%)',
                        color: 'white',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.65rem',
                        transition: 'all 0.2s ease',
                        boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.25)',
                    }}
                >
                    {loading ? (
                        <>
                            <span style={{
                                width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: 'white', borderRadius: '50%',
                                display: 'inline-block', animation: 'spin 0.8s linear infinite',
                            }} />
                            Conectando…
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '1.15rem' }}>🪐</span>
                            Conectar Wallet Freighter
                        </>
                    )}
                </button>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.8rem',
                        color: '#f87171',
                        textAlign: 'left',
                        lineHeight: 1.6,
                    }}>
                        ⚠️ {error}
                        <br />
                        <a
                            href="https://www.freighter.app/"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--neon-violet-light)', fontSize: '0.75rem' }}
                        >
                            Descargar Freighter →
                        </a>
                    </div>
                )}

                <div className="divider">
                    <div className="divider-line" />
                    <span className="divider-text">o continúa sin cuenta</span>
                    <div className="divider-line" />
                </div>

                <button className="btn-demo" onClick={onDemoMode}>
                    🧪 Explorar en Modo Demo
                </button>

                <p style={{ marginTop: '2rem', fontSize: '0.72rem', color: 'var(--text-subtle)', lineHeight: 1.6 }}>
                    Al conectar tu wallet aceptas los términos de servicio.<br />
                    Tu clave privada nunca sale de tu dispositivo. No custodial.
                </p>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                #btn-connect-wallet:hover:not(:disabled) {
                    border-color: rgba(124,58,237,0.8);
                    box-shadow: 0 0 28px rgba(124,58,237,0.4);
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
}
