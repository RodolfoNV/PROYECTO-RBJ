import React from 'react';

const MIN_AMOUNT = 10;
const MAX_AMOUNT = 10000;

interface SolicitarViewProps {
    amount: string;
    setAmount: (v: string) => void;
    term: string;
    setTerm: (v: string) => void;
    collateral: string;
    setCollateral: (v: string) => void;
    requesting: boolean;
    formErrors: { amount?: string; collateral?: string };
    setFormErrors: (fn: (prev: any) => any) => void;
    loanPreview: { monthly: number; total: number } | null;
    onSubmit: (e: React.FormEvent) => void;
}

export function SolicitarView({
    amount, setAmount, term, setTerm,
    collateral, setCollateral, requesting,
    formErrors, setFormErrors, loanPreview, onSubmit,
}: SolicitarViewProps) {
    return (
        <div className="fade-in" style={{ maxWidth: '560px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Nuevo Préstamo
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Completa el formulario para solicitar tu crédito estudiantil.
            </p>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <form onSubmit={onSubmit}>
                    {/* Monto */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            💰 Monto a solicitar (XLM)
                        </label>
                        <input
                            type="number"
                            className={`input-web3 ${formErrors.amount ? 'error' : ''}`}
                            value={amount}
                            onChange={e => { setAmount(e.target.value); setFormErrors((p: any) => ({ ...p, amount: undefined })); }}
                            placeholder={`Entre ${MIN_AMOUNT} y ${MAX_AMOUNT} XLM`}
                            min={MIN_AMOUNT} max={MAX_AMOUNT} step="0.01" required
                        />
                        {formErrors.amount && <p className="field-error">⚠️ {formErrors.amount}</p>}
                    </div>

                    {/* Garantía */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🔒 Garantía / Aval
                        </label>
                        <input
                            type="text"
                            className={`input-web3 ${formErrors.collateral ? 'error' : ''}`}
                            value={collateral}
                            onChange={e => { setCollateral(e.target.value); setFormErrors((p: any) => ({ ...p, collateral: undefined })); }}
                            placeholder="Ej: Firma de tutor, documentos, etc."
                            required
                        />
                        {formErrors.collateral && <p className="field-error">⚠️ {formErrors.collateral}</p>}
                    </div>

                    {/* Plazo */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📅 Plazo de pago
                        </label>
                        <select className="input-web3" value={term} onChange={e => setTerm(e.target.value)}>
                            <option value="3">3 Meses</option>
                            <option value="6">6 Meses</option>
                            <option value="12">12 Meses</option>
                            <option value="24">24 Meses</option>
                        </select>
                    </div>

                    {/* Preview */}
                    {loanPreview && (
                        <div style={{
                            background: 'rgba(171, 51, 111, 0.06)',
                            border: '1px solid rgba(236,72,153,0.2)',
                            borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
                            boxShadow: '0 0 30px rgba(137, 29, 83, 0.05)',
                        }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--neon-pink-light)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                📊 Resumen del Crédito (Tasa: 4.5% anual)
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cuota mensual</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#451772ff', fontFamily: "'Syne', sans-serif" }}>
                                        {loanPreview.monthly} XLM
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total a pagar</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--warning)', fontFamily: "'Syne', sans-serif" }}>
                                        {loanPreview.total} XLM
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={requesting} style={{ width: '100%' }}>
                        {requesting ? '⏳ Procesando...' : '✅ Confirmar Préstamo'}
                    </button>
                </form>
            </div>
        </div>
    );
}
