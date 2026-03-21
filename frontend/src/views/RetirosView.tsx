import React, { useState } from 'react';

export function RetirosView() {
    const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);

    const ANCHORS = [
        {
            id: 'bitso',
            name: 'Bitso (México)',
            icon: '🇲🇽',
            description: 'Retira tus XLM directamente a cualquier cuenta bancaria en México vía SPEI.',
            accent: '#00e5ff',
            features: ['Transferencia instantánea', 'Pesos Mexicanos (MXN)', 'Cero comisiones Stellar']
        },
        {
            id: 'moneygram',
            name: 'MoneyGram (Efectivo)',
            icon: '🏦',
            description: 'Retira efectivo físico en más de 350,000 sucursales globales sin necesidad de cuenta bancaria.',
            accent: '#ff007f',
            features: ['Efectivo en mano', 'Sin bancos', 'Verificación por QR']
        },
        {
            id: 'coinbase',
            name: 'Coinbase / USDC',
            icon: '🇺🇸',
            description: 'Convierte a Dólar Digital (USDC) y retira a cuentas internacionales o tarjetas.',
            accent: '#bc13fe',
            features: ['Estabilidad en USD', 'Alcance global', 'Integración directa']
        }
    ];

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Retiros y Cajeros
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                Convierte tus Lumens en dinero real de forma instantánea a través de Stellar Anchors.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {ANCHORS.map(anchor => (
                    <div key={anchor.id} className="glass-card" style={{
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        borderTop: `4px solid ${anchor.accent}`,
                        boxShadow: `0 10px 30px ${anchor.accent}15`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 10px ${anchor.accent}44)` }}>{anchor.icon}</div>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: '1.3rem' }}>{anchor.name}</h3>
                                <span style={{ fontSize: '0.75rem', color: anchor.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Anchor Oficial</span>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            {anchor.description}
                        </p>

                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {anchor.features.map(f => (
                                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#fff' }}>
                                    <span style={{ color: 'var(--success)' }}>✓</span> {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            className="btn-primary"
                            style={{
                                marginTop: 'auto',
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${anchor.accent}44`,
                                color: '#fff',
                                boxShadow: 'none'
                            }}
                            onClick={() => setSelectedAnchor(anchor.id)}
                        >
                            Configurar Retiro
                        </button>
                    </div>
                ))}
            </div>

            {selectedAnchor && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(2,2,5,0.9)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '2rem'
                }} onClick={() => setSelectedAnchor(null)}>
                    <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '3rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
                            {ANCHORS.find(a => a.id === selectedAnchor)?.icon}
                        </div>
                        <h2 style={{ fontFamily: "'Syne', sans-serif", color: '#fff', marginBottom: '1rem' }}>
                            Simulación de Retiro: {ANCHORS.find(a => a.id === selectedAnchor)?.name}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            En una red principal, aquí se abriría una ventana segura del partner (SEP-24) para procesar tu retiro a través de un puente regulado.
                        </p>

                        {selectedAnchor === 'moneygram' && (
                            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '2rem' }}>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=StellarCashOutExample" alt="QR Code Mock" />
                                <div style={{ color: '#000', fontWeight: 800, fontSize: '0.7rem', marginTop: '0.5rem' }}>CÓDIGO DE RETIRO CAJERO</div>
                            </div>
                        )}

                        <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSelectedAnchor(null)}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ℹ️ Esta sección demuestra la capacidad de interoperabilidad de Stellar. Los retiros reales requieren verificación de identidad (KYC) procesada directamente por el Anchor.
            </div>
        </div>
    );
}
