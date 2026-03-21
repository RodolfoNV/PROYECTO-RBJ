import * as StellarSdk from "@stellar/stellar-sdk";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";


void StellarSdk;


export const requestLoan = async (
    address: string,
    amount: number,
    interest: number,
    months: number,
    collateral: string,
    name?: string,
    email?: string,
    google_sub?: string,
) => {
    const res = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount, interest, months, collateral, name, email, google_sub })
    });
    return res.json();
};

export const payLoan = async (address: string, loanId: number, amount: number) => {
    const res = await fetch(`${API_BASE}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, loanId, amount })
    });
    return res.json();
};

export const fetchLoans = async (address: string) => {
    try {
        const res = await fetch(`${API_BASE}/loans?address=${encodeURIComponent(address)}`);
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
};

export const fetchMovements = async (address: string) => {
    try {
        const res = await fetch(`${API_BASE}/movements?address=${encodeURIComponent(address)}`);
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
};

// ─── Pool de Inversión ────────────────────────────────────────────────────
export const fetchPool = async () => {
    try {
        const res = await fetch(`${API_BASE}/pool`);
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
};

export const invest = async (address: string, amount: number, name?: string, email?: string, google_sub?: string) => {
    const res = await fetch(`${API_BASE}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount, name, email, google_sub })
    });
    return res.json();
};

export const withdrawInvestment = async (address: string, amount: number) => {
    const res = await fetch(`${API_BASE}/withdraw-investment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount })
    });
    return res.json();
};

export const fetchMyInvestment = async (address: string) => {
    try {
        const res = await fetch(`${API_BASE}/investments/${encodeURIComponent(address)}`);
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
};

// ─── Score Crediticio ─────────────────────────────────────────────────────
export const fetchCreditScore = async (address: string) => {
    try {
        const res = await fetch(`${API_BASE}/credit-score/${encodeURIComponent(address)}`);
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
};
