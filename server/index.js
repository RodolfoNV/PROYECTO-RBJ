const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://69c013f96e22424a12af1458--boisterous-yeot-12efc6.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

const dbConfig = process.env.DATABASE_URL ? process.env.DATABASE_URL : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'logihtec_db',
    port: process.env.DB_PORT || 3306
};

const pool = mysql.createPool({
    ...(typeof dbConfig === 'string' ? { uri: dbConfig } : dbConfig),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ─── Constantes ───────────────────────────────────────────────────────────
const VALID_MONTHS = [3, 6, 12, 24];
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 10000;
const MIN_SCORE = 450;          // Score mínimo para recibir préstamo
const INVESTOR_RATE = 3.0 / 100;   // 3% anual para inversores
const BACKSTOP_RATE = 1.0 / 100;   // 1% anual para reserva
const PLATFORM_FEE = 0.5 / 100;   // 0.5% anual para plataforma

// ─── Helper: Upsert usuario ───────────────────────────────────────────────
async function upsertUser(conn, { address, name, email, google_sub }) {
    await conn.execute(
        `INSERT INTO users (wallet_address, name, email, google_sub)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
             name       = COALESCE(VALUES(name), name),
             email      = COALESCE(VALUES(email), email),
             google_sub = COALESCE(VALUES(google_sub), google_sub)`,
        [address, name || `Usuario ${address.slice(0, 6)}`, email || null, google_sub || null]
    );
}

// ─── Helper: Calcular y guardar score crediticio ──────────────────────────
async function computeCreditScore(conn, address) {
    const [rows] = await conn.execute(
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

    // Bonificaciones
    if (loansDefaulted === 0 && rows.length > 0) score += 100;
    score += loansCompleted * 50;
    score -= loansDefaulted * 150;
    if (paymentRatio > 80) score += 25;
    if (paymentRatio < 30 && rows.length > 0) score -= 25;

    // Clamp 200–850
    score = Math.max(200, Math.min(850, score));

    await conn.execute(
        `INSERT INTO credit_scores (user_address, score, loans_completed, loans_defaulted, payment_ratio)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
             score = VALUES(score),
             loans_completed = VALUES(loans_completed),
             loans_defaulted = VALUES(loans_defaulted),
             payment_ratio   = VALUES(payment_ratio)`,
        [address, score, loansCompleted, loansDefaulted, paymentRatio.toFixed(2)]
    );

    return { score, loansCompleted, loansDefaulted, paymentRatio: Number(paymentRatio.toFixed(2)) };
}

// ─── Validar préstamo ─────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS DE USUARIO
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/user', async (req, res) => {
    const { address, name, email, google_sub } = req.body;
    if (!address) return res.status(400).json({ error: 'address requerido' });
    const conn = await pool.getConnection();
    try {
        await upsertUser(conn, { address, name, email, google_sub });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

app.get('/api/user/:address', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE wallet_address = ?', [req.params.address]);
        if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS DE PRÉSTAMOS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/loans', async (req, res) => {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address requerido' });
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM loans WHERE user_address = ? ORDER BY created_at DESC', [address]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/loans', async (req, res) => {
    const { address, amount, interest, months, collateral, name, email, google_sub } = req.body;

    const errors = validateLoan({ address, amount, months, collateral });
    if (errors.length) return res.status(400).json({ errors });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Upsert usuario
        await upsertUser(conn, { address, name, email, google_sub });

        // Calcular score crediticio
        const scoreData = await computeCreditScore(conn, address);
        if (scoreData.score < MIN_SCORE) {
            await conn.rollback();
            return res.status(403).json({
                error: `Score crediticio insuficiente (${scoreData.score}/850). Mínimo requerido: ${MIN_SCORE}.`,
                score: scoreData.score,
                required: MIN_SCORE
            });
        }

        // Verificar que el pool tenga liquidez suficiente (DESHABILITADO TEMPORALMENTE PARA DESARROLLO)
        const [[poolRow]] = await conn.execute('SELECT * FROM investment_pool WHERE id = 1');
        const available = Number(poolRow.total_deposited) - Number(poolRow.total_borrowed);
        /* 
        if (available < Number(amount)) {
            await conn.rollback();
            return res.status(400).json({
                error: `Liquidez insuficiente en el pool. Disponible: ${available.toFixed(2)} XLM.`,
                available: available.toFixed(2)
            });
        }
        */

        // Crear préstamo
        const [result] = await conn.execute(
            `INSERT INTO loans
             (user_address, amount, interest_rate, months, collateral, credit_score_at_request, next_payment_date)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
            [address, Number(amount), Number(interest) || 4.5, Number(months), collateral.trim(), scoreData.score]
        );

        // Actualizar pool: aumentar borrowed
        await conn.execute(
            'UPDATE investment_pool SET total_borrowed = total_borrowed + ? WHERE id = 1',
            [Number(amount)]
        );

        // Movimiento de desembolso
        await conn.execute(
            'INSERT INTO movements (loan_id, user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?, ?)',
            [result.insertId, address, Number(amount), 'DISBURSEMENT', `STELLAR_LOAN_${Date.now()}`]
        );

        await conn.commit();
        res.status(201).json({ id: result.insertId, score: scoreData.score, message: 'Préstamo aprobado.' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

app.post('/api/pay', async (req, res) => {
    const { address, loanId, amount } = req.body;
    if (!address || !loanId || !amount) return res.status(400).json({ error: 'Faltan campos.' });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Monto inválido.' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [[loan]] = await conn.execute(
            'SELECT * FROM loans WHERE id = ? AND user_address = ?', [loanId, address]);
        if (!loan) { await conn.rollback(); return res.status(404).json({ error: 'Préstamo no encontrado.' }); }
        if (loan.status !== 'Active') { await conn.rollback(); return res.status(400).json({ error: `El préstamo está ${loan.status}.` }); }

        const pendiente = Number(loan.amount) - Number(loan.repaid_amount || 0);
        const pagoReal = Math.min(numAmount, pendiente);

        // Actualizar préstamo
        await conn.execute(
            `UPDATE loans SET repaid_amount = repaid_amount + ?,
             status = IF(repaid_amount + ? >= amount, 'Repaid', 'Active')
             WHERE id = ? AND user_address = ?`,
            [pagoReal, pagoReal, loanId, address]
        );

        // ── Distribuir rendimientos ──────────────────────────────────
        // Cada pago contiene capital + interés proporcional al plazo
        // Tasa mensual sobre el monto original del préstamo
        const monthlyRate = (Number(loan.interest_rate) / 100) / 12;
        // Interés generado en este pago (proporcional al pago vs deuda total)
        const interestOnPayment = Number(loan.amount) * monthlyRate * (pagoReal / Number(loan.amount));

        // Las tasas ya están definidas como fracción anual. Distribuimos el interés generado:
        // INVESTOR_RATE=3%, BACKSTOP_RATE=1%, PLATFORM_FEE=0.5% → total 4.5%
        const totalRate = INVESTOR_RATE + BACKSTOP_RATE + PLATFORM_FEE; // 0.045
        const investorYield = parseFloat((interestOnPayment * (INVESTOR_RATE / totalRate)).toFixed(4));  // ~66.7%
        const backstopYield = parseFloat((interestOnPayment * (BACKSTOP_RATE / totalRate)).toFixed(4));  // ~22.2%
        const platformYield = parseFloat((interestOnPayment * (PLATFORM_FEE / totalRate)).toFixed(4));   // ~11.1%

        // Guardar distribución
        await conn.execute(
            `INSERT INTO yield_distributions (loan_id, payment_amount, investor_yield, backstop_yield, platform_fee)
             VALUES (?, ?, ?, ?, ?)`,
            [loanId, pagoReal, investorYield, backstopYield, platformYield]
        );

        // Actualizar pool
        await conn.execute(
            `UPDATE investment_pool
             SET total_borrowed = GREATEST(0, total_borrowed - ?),
                 total_yield    = total_yield + ?,
                 backstop       = backstop + ?
             WHERE id = 1`,
            [pagoReal, investorYield, backstopYield]
        );

        // Distribuir yield entre inversores activos de forma proporcional
        const [investors] = await conn.execute(
            "SELECT * FROM investments WHERE status = 'active' AND amount_deposited > 0");
        if (investors.length > 0) {
            const [[poolRow]] = await conn.execute('SELECT total_deposited FROM investment_pool WHERE id = 1');
            const totalDeposited = Number(poolRow.total_deposited);
            for (const inv of investors) {
                const share = totalDeposited > 0 ? Number(inv.amount_deposited) / totalDeposited : 0;
                const myYield = parseFloat((investorYield * share).toFixed(4));
                if (myYield > 0) {
                    await conn.execute(
                        'UPDATE investments SET yield_earned = yield_earned + ? WHERE id = ?',
                        [myYield, inv.id]
                    );
                    await conn.execute(
                        'INSERT INTO movements (user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?)',
                        [inv.investor_address, myYield, 'YIELD', `YIELD_${Date.now()}_${inv.id}`]
                    );
                }
            }
        }

        // Registrar pago del estudiante
        await conn.execute(
            'INSERT INTO movements (loan_id, user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?, ?)',
            [loanId, address, pagoReal, 'PAYMENT', `STELLAR_PAY_${Date.now()}`]
        );

        // Recalcular score del estudiante
        await computeCreditScore(conn, address);

        await conn.commit();
        res.json({ success: true, pago_aplicado: pagoReal, investor_yield: investorYield, message: 'Pago exitoso.' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS DE POOL DE INVERSIÓN
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/pool', async (req, res) => {
    try {
        const [[row]] = await pool.execute('SELECT * FROM investment_pool WHERE id = 1');
        const [[invCount]] = await pool.execute("SELECT COUNT(*) as c FROM investments WHERE status='active'");
        const available = Number(row.total_deposited) - Number(row.total_borrowed);
        const utilization = row.total_deposited > 0
            ? ((Number(row.total_borrowed) / Number(row.total_deposited)) * 100).toFixed(1)
            : '0.0';
        // APY estimado: basado en utilización del pool
        const apyEstimate = (3.0 * (Number(utilization) / 100) * 0.8 + 0.5).toFixed(2);

        res.json({
            total_deposited: Number(row.total_deposited).toFixed(4),
            total_borrowed: Number(row.total_borrowed).toFixed(4),
            total_yield: Number(row.total_yield).toFixed(4),
            backstop: Number(row.backstop).toFixed(4),
            available: Math.max(0, available).toFixed(4),
            utilization: utilization,
            apy_estimate: apyEstimate,
            investors: invCount.c
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/invest', async (req, res) => {
    const { address, amount, name, email, google_sub } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'address y amount requeridos.' });
    const num = Number(amount);
    if (isNaN(num) || num < 10) return res.status(400).json({ error: 'Mínimo de inversión: 10 XLM.' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await upsertUser(conn, { address, name, email, google_sub });

        // Upsert inversión (usa uk_investor_active sobre investor_address)
        await conn.execute(
            `INSERT INTO investments (investor_address, amount_deposited)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
                 amount_deposited = amount_deposited + VALUES(amount_deposited),
                 status = 'active'`,
            [address, num]
        );

        // Actualizar pool
        await conn.execute(
            'UPDATE investment_pool SET total_deposited = total_deposited + ? WHERE id = 1', [num]);

        // Movimiento
        await conn.execute(
            'INSERT INTO movements (user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?)',
            [address, num, 'INVESTMENT', `INVEST_${Date.now()}`]
        );

        await conn.commit();
        res.json({ success: true, message: `Inversión de ${num} XLM registrada.` });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

app.post('/api/withdraw-investment', async (req, res) => {
    const { address, amount } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'address y amount requeridos.' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[inv]] = await conn.execute(
            "SELECT * FROM investments WHERE investor_address = ? AND status = 'active'", [address]);
        if (!inv) { await conn.rollback(); return res.status(404).json({ error: 'No tienes inversión activa.' }); }

        const maxRetiro = Number(inv.amount_deposited) + Number(inv.yield_earned) - Number(inv.amount_withdrawn);
        const retiro = Math.min(Number(amount), maxRetiro);
        if (retiro <= 0) { await conn.rollback(); return res.status(400).json({ error: 'Saldo insuficiente.' }); }

        // Verificar liquidez en pool
        const [[poolRow]] = await conn.execute('SELECT * FROM investment_pool WHERE id = 1');
        const available = Number(poolRow.total_deposited) - Number(poolRow.total_borrowed);
        if (retiro > available) {
            await conn.rollback();
            return res.status(400).json({ error: `Fondos en uso por préstamos. Disponible: ${available.toFixed(2)} XLM.` });
        }

        await conn.execute(
            'UPDATE investments SET amount_withdrawn = amount_withdrawn + ? WHERE investor_address = ?',
            [retiro, address]
        );
        await conn.execute(
            'UPDATE investment_pool SET total_deposited = GREATEST(0, total_deposited - ?) WHERE id = 1', [retiro]);
        await conn.execute(
            'INSERT INTO movements (user_address, amount, type, tx_hash) VALUES (?, ?, ?, ?)',
            [address, retiro, 'WITHDRAWAL', `WITHDRAW_${Date.now()}`]
        );

        await conn.commit();
        res.json({ success: true, retirado: retiro, message: `Retiro de ${retiro} XLM procesado.` });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

app.get('/api/investments/:address', async (req, res) => {
    try {
        const [[inv]] = await pool.execute(
            "SELECT * FROM investments WHERE investor_address = ? AND status = 'active'",
            [req.params.address]);
        if (!inv) return res.json(null);
        const balance = Number(inv.amount_deposited) + Number(inv.yield_earned) - Number(inv.amount_withdrawn);
        res.json({ ...inv, balance: balance.toFixed(4) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCORE CREDITICIO
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/credit-score/:address', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        // Asegurarse de que el usuario existe
        await conn.execute(
            `INSERT IGNORE INTO users (wallet_address, name) VALUES (?, ?)`,
            [req.params.address, `Usuario ${req.params.address.slice(0, 6)}`]
        );
        const scoreData = await computeCreditScore(conn, req.params.address);
        const level =
            scoreData.score >= 700 ? 'Excelente' :
                scoreData.score >= 550 ? 'Bueno' :
                    scoreData.score >= 450 ? 'Regular' : 'Insuficiente';
        const color =
            scoreData.score >= 700 ? '#10b981' :
                scoreData.score >= 550 ? '#3b82f6' :
                    scoreData.score >= 450 ? '#f59e0b' : '#ef4444';
        res.json({ ...scoreData, level, color, min_required: MIN_SCORE, max: 850 });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { conn.release(); }
});

// ═══════════════════════════════════════════════════════════════════════════
// MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/movements', async (req, res) => {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address requerido' });
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM movements WHERE user_address = ? ORDER BY timestamp DESC', [address]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ═══════════════════════════════════════════════════════════════════════════
// ARRANQUE DEL SERVIDOR
// ═══════════════════════════════════════════════════════════════════════════

async function startServer() {
    try {
        // Garantizar que el registro del pool (id=1) siempre exista
        const conn = await pool.getConnection();
        try {
            await conn.execute(`INSERT IGNORE INTO investment_pool (id, total_deposited) VALUES (1, 0)`);
            console.log('✅ Pool de inversión verificado.');
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('⚠️  No se pudo verificar el pool de inversión:', err.message);
        console.error('   Asegúrate de correr: node setup_db.js');
    }

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`✅ Backend Logihtec v3 corriendo en puerto ${PORT}`));
}

startServer();
