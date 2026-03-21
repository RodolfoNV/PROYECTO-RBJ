const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    // First connect without DB to create it if needed
    const rootConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    await rootConn.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'logihtec_db'}\``);
    await rootConn.end();

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'logihtec_db',
        multipleStatements: true,
    });

    console.log('Conectado a MySQL. Creando tablas...');

    // ─── Usuarios ──────────────────────────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
            wallet_address VARCHAR(100) PRIMARY KEY,
            name           VARCHAR(100),
            email          VARCHAR(255),
            google_sub     VARCHAR(100),
            role           ENUM('student', 'investor', 'both') DEFAULT 'student',
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migraciones: agregar columnas que pueden faltar en schemas viejos
    const migrations = [
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(100)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('student','investor','both') DEFAULT 'student'`,
        `ALTER TABLE loans ADD COLUMN IF NOT EXISTS credit_score_at_request INT DEFAULT 500`,
        `ALTER TABLE movements MODIFY COLUMN IF EXISTS type ENUM('DISBURSEMENT','PAYMENT','INVESTMENT','WITHDRAWAL','YIELD')`,
    ];
    for (const sql of migrations) {
        try { await connection.execute(sql); } catch (_) { /* columna ya existe, ignorar */ }
    }
    console.log('✅ Tabla users lista.');

    // ─── Préstamos ─────────────────────────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS loans (
            id                      INT AUTO_INCREMENT PRIMARY KEY,
            user_address            VARCHAR(100),
            amount                  DECIMAL(18, 4) NOT NULL,
            interest_rate           DECIMAL(5, 2)  DEFAULT 4.50,
            months                  INT            DEFAULT 12,
            collateral              VARCHAR(255),
            credit_score_at_request INT            DEFAULT 500,
            status                  ENUM('Active', 'Repaid', 'Default') DEFAULT 'Active',
            repaid_amount           DECIMAL(18, 4) DEFAULT 0,
            next_payment_date       DATE,
            created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
            INDEX idx_status (status),
            INDEX idx_user_address (user_address)
        )
    `);
    console.log('✅ Tabla loans lista.');

    // ─── Movimientos ───────────────────────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS movements (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            loan_id      INT,
            user_address VARCHAR(100),
            amount       DECIMAL(18, 4),
            type         ENUM('DISBURSEMENT', 'PAYMENT', 'INVESTMENT', 'WITHDRAWAL', 'YIELD'),
            tx_hash      VARCHAR(128),
            timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loan_id)      REFERENCES loans(id) ON DELETE SET NULL,
            FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
            INDEX idx_user_ts (user_address, timestamp)
        )
    `);
    console.log('✅ Tabla movements lista.');

    // ─── Pool de Inversión ─────────────────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS investment_pool (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            total_deposited DECIMAL(18, 4) DEFAULT 0,
            total_borrowed  DECIMAL(18, 4) DEFAULT 0,
            total_yield     DECIMAL(18, 4) DEFAULT 0,
            backstop        DECIMAL(18, 4) DEFAULT 0,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    // Garantizar que siempre haya un registro en id=1
    await connection.execute(`INSERT IGNORE INTO investment_pool (id, total_deposited) VALUES (1, 0)`);
    console.log('✅ Tabla investment_pool lista.');

    // ─── Inversiones Individuales ─────────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS investments (
            id               INT AUTO_INCREMENT PRIMARY KEY,
            investor_address VARCHAR(100) NOT NULL,
            amount_deposited DECIMAL(18, 4) DEFAULT 0,
            yield_earned     DECIMAL(18, 4) DEFAULT 0,
            amount_withdrawn DECIMAL(18, 4) DEFAULT 0,
            status           ENUM('active', 'withdrawn') DEFAULT 'active',
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (investor_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
            UNIQUE KEY uk_investor_active (investor_address),
            INDEX idx_investor (investor_address),
            INDEX idx_status (status)
        )
    `);
    console.log('✅ Tabla investments lista.');

    // ─── Score Crediticio ──────────────────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS credit_scores (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            user_address    VARCHAR(100) NOT NULL,
            score           INT DEFAULT 500,
            loans_completed INT DEFAULT 0,
            loans_defaulted INT DEFAULT 0,
            payment_ratio   DECIMAL(5, 2) DEFAULT 0,
            last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
            UNIQUE KEY uk_user (user_address)
        )
    `);
    console.log('✅ Tabla credit_scores lista.');

    // ─── Distribución de Rendimientos ────────────────────────────────────────
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS yield_distributions (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            loan_id         INT,
            payment_amount  DECIMAL(18, 4),
            investor_yield  DECIMAL(18, 4),
            backstop_yield  DECIMAL(18, 4),
            platform_fee    DECIMAL(18, 4),
            distributed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
        )
    `);
    console.log('✅ Tabla yield_distributions lista.');

    console.log('\n🎉 ¡Base de datos Logihtec configurada exitosamente!');
    await connection.end();
    process.exit(0);
}

setup().catch(err => {
    console.error('❌ Error al configurar la base de datos:', err.message);
    process.exit(1);
});
