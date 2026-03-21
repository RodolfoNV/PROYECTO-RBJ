export interface Movement {
    id: string;
    loanId: number;
    userAddress: string;
    amount: number;
    type: 'DISBURSEMENT' | 'PAYMENT';
    timestamp: string;
    txHash: string;
}

export interface Loan {
    id: number;
    student: string;
    amount: number;
    interest: number;
    months: number;
    collateral: string;
    status: 'Active' | 'Repaid';
    repaid: number;
    createdAt: string;
    nextPaymentDate: string | null;
}

export interface UserProfile {
    address: string;
    name: string;
    createdAt: string;
}

class Database {
    private STORAGE_KEY = 'logihtec_db';

    private getData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : { users: [], loans: [], movements: [] };
    }

    private saveData(data: any) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // USERS
    getOrCreateUser(address: string): UserProfile {
        const data = this.getData();
        let user = data.users.find((u: any) => u.address === address);
        if (!user) {
            user = { address, name: `Estudiante ${address.slice(0, 4)}`, createdAt: new Date().toISOString() };
            data.users.push(user);
            this.saveData(data);
        }
        return user;
    }

    // LOANS
    getLoans(address: string): Loan[] {
        const data = this.getData();
        return data.loans.filter((l: any) => l.student === address);
    }

    addLoan(loan: Loan) {
        const data = this.getData();
        data.loans.push(loan);

        // Registrar movimiento de desembolso
        const movement: Movement = {
            id: `MOV_${Math.random().toString(36).substr(2, 9)}`,
            loanId: loan.id,
            userAddress: loan.student,
            amount: loan.amount,
            type: 'DISBURSEMENT',
            timestamp: loan.createdAt,
            txHash: `TX_INIT_${Date.now()}`
        };
        data.movements.push(movement);

        this.saveData(data);
    }

    updateLoan(address: string, loanId: number, paymentAmount: number) {
        const data = this.getData();
        const loan = data.loans.find((l: any) => l.id === loanId && l.student === address);

        if (loan) {
            loan.repaid += paymentAmount;
            if (loan.repaid >= loan.amount) {
                loan.repaid = loan.amount;
                loan.status = 'Repaid';
                loan.nextPaymentDate = null;
            } else {
                loan.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            }

            // Registrar movimiento de pago
            const movement: Movement = {
                id: `MOV_${Math.random().toString(36).substr(2, 9)}`,
                loanId: loanId,
                userAddress: address,
                amount: paymentAmount,
                type: 'PAYMENT',
                timestamp: new Date().toISOString(),
                txHash: `TX_PAY_${Date.now()}`
            };
            data.movements.push(movement);

            this.saveData(data);
            return true;
        }
        return false;
    }

    // MOVEMENTS
    getMovements(address: string): Movement[] {
        const data = this.getData();
        return data.movements
            .filter((m: any) => m.userAddress === address)
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}

export const db = new Database();
