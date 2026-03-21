-- Base de Datos Logihtec v3 — Con Inversión DeFi + Score Crediticio
CREATE DATABASE IF NOT EXISTS logihtec_db;
USE logihtec_db;

-- ─── Usuarios ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(100) PRIMARY KEY,
    name           VARCHAR(100),
    email          VARCHAR(255),
    google_sub     VARCHAR(100),
    role           ENUM('student', 'investor', 'both') DEFAULT 'student',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_google_sub (google_sub),
    INDEX idx_email (email)
);

-- ─── Préstamos ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_address      VARCHAR(100),
    amount            DECIMAL(18, 4) NOT NULL,
    interest_rate     DECIMAL(5, 2)  DEFAULT 4.50,
    months            INT            DEFAULT 12,
    collateral        VARCHAR(255),
    credit_score_at_request INT      DEFAULT 500,
    status            ENUM('Active', 'Repaid', 'Default') DEFAULT 'Active',
    repaid_amount     DECIMAL(18, 4) DEFAULT 0,
    next_payment_date DATE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_user_address (user_address)
);

-- ─── Movimientos ──────────────────────────────────────────────────────────
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
);

-- ─── Pool de Inversión ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investment_pool (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    total_deposited DECIMAL(18, 4) DEFAULT 0,   -- Total invertido por todos
    total_borrowed  DECIMAL(18, 4) DEFAULT 0,   -- Total prestado a estudiantes
    total_yield     DECIMAL(18, 4) DEFAULT 0,   -- Rendimientos acumulados totales
    backstop        DECIMAL(18, 4) DEFAULT 0,   -- Reserva de riesgo
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Registro inicial del pool
INSERT IGNORE INTO investment_pool (id, total_deposited) VALUES (1, 0);

-- ─── Inversiones Individuales ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    investor_address VARCHAR(100) NOT NULL,
    amount_deposited DECIMAL(18, 4) DEFAULT 0,   -- Principal depositado
    yield_earned    DECIMAL(18, 4) DEFAULT 0,    -- Rendimientos acumulados
    amount_withdrawn DECIMAL(18, 4) DEFAULT 0,   -- Lo que ya retiró
    status          ENUM('active', 'withdrawn') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
    UNIQUE KEY uk_investor_active (investor_address),
    INDEX idx_investor (investor_address),
    INDEX idx_status (status)
);

-- ─── Score Crediticio ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_scores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_address    VARCHAR(100) NOT NULL,
    score           INT DEFAULT 500,             -- 200-850
    loans_completed INT DEFAULT 0,
    loans_defaulted INT DEFAULT 0,
    payment_ratio   DECIMAL(5, 2) DEFAULT 0,     -- % de pagos al corriente
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
    UNIQUE KEY uk_user (user_address)
);

-- ─── Distribución de Rendimientos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yield_distributions (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    loan_id          INT,
    payment_amount   DECIMAL(18, 4),    -- Pago total del estudiante
    investor_yield   DECIMAL(18, 4),    -- 3.0% → inversores
    backstop_yield   DECIMAL(18, 4),    -- 1.0% → reserva
    platform_fee     DECIMAL(18, 4),    -- 0.5% → plataforma
    distributed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
);
