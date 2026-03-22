const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://69c013f96e22424a12af1458--boisterous-yeot-12efc6.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// ─── Base de Datos SQLite ───────────────────────────────────────────────────
const dbPath = path.resolve(__dirname, 'logihtec.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al abrir la base de datos SQLite:', err.message);
    else console.log('✅ Conectado a la base de datos SQLite:', dbPath);
});

// Helper para promesas en sqlite3
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
});
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
});

// ─── Constantes ───────────────────────────────────────────────────────────
const VALID_MONTHS = [3, 6, 12, 24];
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 10000;
const MIN_SCORE = 450;
const INVESTOR_RATE = 3.0 / 100;
const BACKSTOP_RATE = 1.0 / 100;
const PLATFORM_FEE = 0.5 / 100;

// ─── Inicialización de Tablas ──────────────────────────────────────────────
async function initDB() {
    await dbRun("PRAGMA foreign_keys = ON");

    await dbRun(`CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        name           TEXT,
        email          TEXT,
        google_sub     TEXT,
        role           TEXT DEFAULT 'student',
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS loans (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address      TEXT,
        amount            REAL NOT NULL,
        interest_rate     REAL DEFAULT 4.50,
        months            INTEGER DEFAULT 12,
        collateral        TEXT,
        credit_score_at_request INTEGER DEFAULT 500,
        status            TEXT DEFAULT 'Active',
        repaid_amount     REAL DEFAULT 0,
        next_payment_date DATE,
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS movements (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id      INTEGER,
        user_address TEXT,
        amount       REAL,
        type         TEXT,
        tx_hash      TEXT,
        timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id)      REFERENCES loans(id) ON DELETE SET NULL,
        FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS investment_pool (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        total_deposited REAL DEFAULT 0,
        total_borrowed  REAL DEFAULT 0,
        total_yield     REAL DEFAULT 0,
        backstop        REAL DEFAULT 0,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await dbRun(`INSERT OR IGNORE INTO investment_pool (id, total_deposited) VALUES (1, 0)`);

    await dbRun(`CREATE TABLE IF NOT EXISTS investments (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        investor_address TEXT NOT NULL,
        amount_deposited REAL DEFAULT 0,
        yield_earned    REAL DEFAULT 0,
        amount_withdrawn REAL DEFAULT 0,
        status          TEXT DEFAULT 'active',
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (investor_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
        UNIQUE (investor_address)
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS credit_scores (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address    TEXT NOT NULL,
        score           INTEGER DEFAULT 500,
        loans_completed INTEGER DEFAULT 0,
        loans_defaulted INTEGER DEFAULT 0,
        payment_ratio   REAL DEFAULT 0,
        last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
        UNIQUE (user_address)
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS yield_distributions (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id          INTEGER,
        payment_amount   REAL,
        investor_yield   REAL,
        backstop_yield   REAL,
        platform_fee     REAL,
        distributed_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
    )`);

    console.log('✅ Tablas inicializadas o verificadas en SQLite.');
}

// ─── Helpers de Negocio ───────────────────────────────────────────────────
async function upsertUser({ address, name, email, google_sub }) {
    await dbRun(
        `INSERT INTO users (wallet_address, name, email, google_sub)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(wallet_address) DO UPDATE SET
             name = COALESCE(excluded.name, name),
             email = COALESCE(excluded.email, email),
             google_sub = COALESCE(excluded.google_sub, google_sub)`,
        [address, name || `Usuario ${address.slice(0, 6)}`, email || null, google_sub || null]
    );
}

async function computeCreditScore(address) {
    const rows = await dbAll(
        'SELECT status, amount, repaid_amount FROM loans WHERE user_address = ?',
        [address]
    );

    let score = 500;
    let loansCompleted = 0;
    let loansDefaulted = 0;
    let totalOwed = 0;
    let totalPaid = 0;

    for (const loan of rows) {
        totalOwed += Number(loan.amount);
        totalPaid += Number(loan.repaid_amount || 0);
        if (loan.status === 'Repaid') loansCompleted++;
        if (loan.status === 'Default') loansDefaulted++;
    }

    const paymentRatio = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
    if (loansDefaulted === 0 && rows.length > 0) score += 100;
    score += loansCompleted * 50;
    score -= loansDefaulted * 150;
    if (paymentRatio > 80) score += 25;
    if (paymentRatio < 30 && rows.length > 0) score -= 25;
    score = Math.max(200, Math.min(850, score));

    await dbRun(
        `INSERT INTO credit_scores (user_address, score, loans_completed, loans_defaulted, payment_ratio)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_address) DO UPDATE SET
             score = excluded.score,
             loans_completed = excluded.loans_completed,
             loans_defaulted = excluded.loans_defaulted,
             payment_ratio = excluded.payment_ratio,
             last_calculated = CURRENT_TIMESTAMP`,
        [address, score, loansCompleted, loansDefaulted, paymentRatio.toFixed(2)]
    );

    return { score, loansCompleted, loansDefaulted, paymentRatio: Number(paymentRatio.toFixed(2)) };
}

function validateLoan({ address, amount, months, collateral }) {
    const errors = [];
    if (!address || !address.trim()) errors.push('La dirección es obligatoria.');
    const num = Number(amount);
    if (isNaN(num) || num < MIN_AMOUNT || num > MAX_AMOUNT)
        errors.push(`El monto debe estar entre ${MIN_AMOUNT} y ${MAX_AMOUNT} XLM.`);
    if (!VALID_MONTHS.includes(Number(months)))
        errors.push(`El plazo debe ser: ${VALID_MONTHS.join(', ')} meses.`);
    if (!collateral || !collateral.trim()) errors.push('La garantía es obligatoria.');
    return errors;
}

// ─── Endpoints ────────────────────────────────────────────────────────────
app.post('/api/user', async (req, res) => {
    const { address, name, email, google_sub } = req.body;
    if (!address) return res.status(400).json({ error: 'address requerido' });
    try {
        await upsertUser({ address, name, email, google_sub });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/:address', async (req, res) => {
    try {
        const row = await dbGet('SELECT * FROM users WHERE wallet_address = ?', [req.params.address]);
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(row);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/loans', async (req, res) => {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address requerido' });
    try {
        const rows = await dbAll('SELECT * FROM loans WHERE user_address = ? ORDER BY created_at DESC', [address]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/loans', async (req, res) => {
    const { address, amount, interest, months, collateral, name, email, google_sub } = req.body;
    const errors = validateLoan({ address, amount, months, collateral });
    if (errors.length) return res.status(400).json({ errors });

    try {
        await upsertUser({ address, name, email, google_sub });
        const scoreData = await computeCreditScore(address);
        if (scoreData.score < MIN_SCORE) {
            return res.status(403).json({ error: `Score insuficiente (${scoreData.score}). Mínimo: ${MIN_SCORE}` });
        }

        const resLoan = await dbRun(
            `INSERT INTO loans (user_address, amount, interest_rate, months, collateral, credit_score_at_request, next_payment_date)
             VALUES (?, ?, ?, ?, ?, ?, date('now', '+1 month'))`,
            [address, Number(amount), Number(interest) || 4.5, Number(months), collateral.trim(), scoreData.score]
        );

        await dbRun('UPDATE investment_pool SET total_borrowed = total_borrowed + ? WHERE id = 1', [Number(amount)]);

        await dbRun(
            'INSERT INTO movements (loan_id, user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?, ?)',
            [resLoan.lastID, address, Number(amount), 'DISBURSEMENT', `STELLAR_LOAN_${Date.now()}`]
        );

        res.status(201).json({ id: resLoan.lastID, score: scoreData.score, message: 'Préstamo aprobado.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pay', async (req, res) => {
    const { address, loanId, amount } = req.body;
    const numAmount = Number(amount);
    if (!address || !loanId || isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Faltan campos o monto inválido.' });

    try {
        const loan = await dbGet('SELECT * FROM loans WHERE id = ? AND user_address = ?', [loanId, address]);
        if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });
        if (loan.status !== 'Active') return res.status(400).json({ error: `El préstamo está ${loan.status}.` });

        const pendiente = Number(loan.amount) - Number(loan.repaid_amount || 0);
        const pagoReal = Math.min(numAmount, pendiente);

        await dbRun(
            `UPDATE loans SET repaid_amount = repaid_amount + ?,
             status = CASE WHEN (repaid_amount + ?) >= amount THEN 'Repaid' ELSE 'Active' END
             WHERE id = ?`,
            [pagoReal, pagoReal, loanId]
        );

        // Distribución (Cálculo simplificado igual al anterior)
        const monthlyRate = (Number(loan.interest_rate) / 100) / 12;
        const interestOnPayment = Number(loan.amount) * monthlyRate * (pagoReal / Number(loan.amount));
        const totalRate = INVESTOR_RATE + BACKSTOP_RATE + PLATFORM_FEE;
        const investorYield = interestOnPayment * (INVESTOR_RATE / totalRate);
        const backstopYield = interestOnPayment * (BACKSTOP_RATE / totalRate);
        const platformYield = interestOnPayment * (PLATFORM_FEE / totalRate);

        await dbRun(
            `INSERT INTO yield_distributions (loan_id, payment_amount, investor_yield, backstop_yield, platform_fee)
             VALUES (?, ?, ?, ?, ?)`,
            [loanId, pagoReal, investorYield, backstopYield, platformYield]
        );

        await dbRun(
            `UPDATE investment_pool SET total_borrowed = MAX(0, total_borrowed - ?), total_yield = total_yield + ?, backstop = backstop + ? WHERE id = 1`,
            [pagoReal, investorYield, backstopYield]
        );

        const investors = await dbAll("SELECT * FROM investments WHERE status = 'active' AND amount_deposited > 0");
        if (investors.length > 0) {
            const poolRow = await dbGet('SELECT total_deposited FROM investment_pool WHERE id = 1');
            const totalDep = Number(poolRow.total_deposited);
            for (const inv of investors) {
                const share = totalDep > 0 ? Number(inv.amount_deposited) / totalDep : 0;
                const myYield = investorYield * share;
                if (myYield > 0.0001) {
                    await dbRun('UPDATE investments SET yield_earned = yield_earned + ? WHERE id = ?', [myYield, inv.id]);
                }
            }
        }

        await dbRun('INSERT INTO movements (loan_id, user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?, ?)', [loanId, address, pagoReal, 'PAYMENT', `STELLAR_PAY_${Date.now()}`]);
        await computeCreditScore(address);

        res.json({ success: true, pago_aplicado: pagoReal });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/pool', async (req, res) => {
    try {
        const row = await dbGet('SELECT * FROM investment_pool WHERE id = 1');
        const invCount = await dbGet("SELECT COUNT(*) as c FROM investments WHERE status='active'");
        const available = Number(row.total_deposited) - Number(row.total_borrowed);
        const utilization = row.total_deposited > 0 ? ((Number(row.total_borrowed) / Number(row.total_deposited)) * 100).toFixed(1) : '0.0';
        const apy = (3.0 * (Number(utilization) / 100) * 0.8 + 0.5).toFixed(2);

        res.json({
            total_deposited: Number(row.total_deposited).toFixed(4),
            total_borrowed: Number(row.total_borrowed).toFixed(4),
            total_yield: Number(row.total_yield).toFixed(4),
            available: Math.max(0, available).toFixed(4),
            utilization,
            apy_estimate: apy,
            investors: invCount.c
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/invest', async (req, res) => {
    const { address, amount, name, email, google_sub } = req.body;
    const num = Number(amount);
    if (!address || isNaN(num) || num < 10) return res.status(400).json({ error: 'Mínimo 10 XLM.' });

    try {
        await upsertUser({ address, name, email, google_sub });
        await dbRun(
            `INSERT INTO investments (investor_address, amount_deposited) VALUES (?, ?)
             ON CONFLICT(investor_address) DO UPDATE SET amount_deposited = amount_deposited + excluded.amount_deposited, status = 'active'`,
            [address, num]
        );
        await dbRun('UPDATE investment_pool SET total_deposited = total_deposited + ? WHERE id = 1', [num]);
        await dbRun('INSERT INTO movements (user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?)', [address, num, 'INVESTMENT', `INVEST_${Date.now()}`]);
        res.json({ success: true, message: `Inversión de ${num} XLM registrada.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/withdraw-investment', async (req, res) => {
    const { address, amount } = req.body;
    const num = Number(amount);
    try {
        const inv = await dbGet("SELECT * FROM investments WHERE investor_address = ? AND status = 'active'", [address]);
        if (!inv) return res.status(404).json({ error: 'No tienes inversión activa.' });
        const maxRetiro = Number(inv.amount_deposited) + Number(inv.yield_earned) - Number(inv.amount_withdrawn);
        if (num > maxRetiro) return res.status(400).json({ error: 'Saldo insuficiente.' });

        const poolRow = await dbGet('SELECT * FROM investment_pool WHERE id = 1');
        const available = Number(poolRow.total_deposited) - Number(poolRow.total_borrowed);
        if (num > available) return res.status(400).json({ error: 'Fondos en uso por préstamos.' });

        await dbRun('UPDATE investments SET amount_withdrawn = amount_withdrawn + ? WHERE investor_address = ?', [num, address]);
        await dbRun('UPDATE investment_pool SET total_deposited = total_deposited - ? WHERE id = 1', [num]);
        await dbRun('INSERT INTO movements (user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?)', [address, num, 'WITHDRAWAL', `WITHDRAW_${Date.now()}`]);
        res.json({ success: true, retirado: num });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/investments/:address', async (req, res) => {
    try {
        const inv = await dbGet("SELECT * FROM investments WHERE investor_address = ? AND status = 'active'", [req.params.address]);
        if (!inv) return res.json(null);
        const balance = Number(inv.amount_deposited) + Number(inv.yield_earned) - Number(inv.amount_withdrawn);
        res.json({ ...inv, balance: balance.toFixed(4) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/credit-score/:address', async (req, res) => {
    try {
        await upsertUser({ address: req.params.address });
        const scoreData = await computeCreditScore(req.params.address);
        const level = scoreData.score >= 700 ? 'Excelente' : scoreData.score >= 550 ? 'Bueno' : scoreData.score >= 450 ? 'Regular' : 'Insuficiente';
        res.json({ ...scoreData, level, min_required: MIN_SCORE, max: 850 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/movements', async (req, res) => {
    const { address } = req.query;
    try {
        const rows = await dbAll('SELECT * FROM movements WHERE user_address = ? ORDER BY timestamp DESC', [address]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: new Date().toISOString(), db: 'sqlite' }));

async function startServer() {
    await initDB();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`✅ Backend Logihtec v3 (SQLite) corriendo en puerto ${PORT}`));
}

startServer();
