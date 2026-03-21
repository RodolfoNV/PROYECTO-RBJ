// ─── Tipos compartidos entre componentes ─────────────────────────────────────

export type View = 'inicio' | 'solicitar' | 'mis-prestamos' | 'movimientos' | 'invertir' | 'ajustes' | 'debate' | 'retiros';

export interface WalletUser {
    publicKey: string;
}
