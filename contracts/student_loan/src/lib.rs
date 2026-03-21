#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Pending,
    Active,
    Repaid,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub id: u32,
    pub student: Address,
    pub amount: i128,
    pub interest_rate_bps: u32, // in basis points (1/100th of 1%)
    pub term_months: u32,
    pub status: LoanStatus,
    pub amount_repaid: i128,
}

#[contract]
pub struct StudentLoanContract;

#[contractimpl]
impl StudentLoanContract {
    /// Initialize the contract with an admin (optional)
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&symbol_short!("admin"), &admin);
    }

    /// Request a new loan
    pub fn request_loan(
        env: Env,
        student: Address,
        amount: i128,
        interest_rate_bps: u32,
        term_months: u32,
    ) -> u32 {
        student.require_auth();

        let mut loan_count: u32 = env.storage().instance().get(&symbol_short!("count")).unwrap_or(0);
        loan_count += 1;

        let loan = Loan {
            id: loan_count,
            student: student.clone(),
            amount,
            interest_rate_bps,
            term_months,
            status: LoanStatus::Pending,
            amount_repaid: 0,
        };

        env.storage().persistent().set(&loan_count, &loan);
        env.storage().instance().set(&symbol_short!("count"), &loan_count);

        loan_count
    }

    /// Fund a loan request (Lender funds the student)
    pub fn fund_loan(env: Env, lender: Address, loan_id: u32) {
        lender.require_auth();

        let mut loan: Loan = env.storage().persistent().get(&loan_id).expect("Loan not found");
        assert_eq!(loan.status, LoanStatus::Pending, "Loan is not pending");

        // Here we would normally transfer tokens from lender to student
        // For simplicity, we just change the status in this demo
        loan.status = LoanStatus::Active;
        env.storage().persistent().set(&loan_id, &loan);
    }

    /// Repay part of the loan
    pub fn repay_loan(env: Env, loan_id: u32, amount: i128) {
        let mut loan: Loan = env.storage().persistent().get(&loan_id).expect("Loan not found");
        loan.student.require_auth();

        assert_eq!(loan.status, LoanStatus::Active, "Loan is not active");
        
        loan.amount_repaid += amount;
        
        // Simple logic: if repaid amount >= principal, mark as repaid
        // (Ignoring interest calculation for this base version)
        if loan.amount_repaid >= loan.amount {
            loan.status = LoanStatus::Repaid;
        }

        env.storage().persistent().set(&loan_id, &loan);
    }

    /// Query loan details
    pub fn get_loan(env: Env, loan_id: u32) -> Loan {
        env.storage().persistent().get(&loan_id).expect("Loan not found")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_loan_flow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, StudentLoanContract);
        let client = StudentLoanContractClient::new(&env, &contract_id);

        let student = Address::generate(&env);
        let lender = Address::generate(&env);

        env.mock_all_auths();

        // 1. Request Loan
        let loan_id = client.request_loan(&student, &1000, &500, &12);
        assert_eq!(loan_id, 1);

        let loan = client.get_loan(&loan_id);
        assert_eq!(loan.amount, 1000);
        assert_eq!(loan.status, LoanStatus::Pending);

        // 2. Fund Loan
        client.fund_loan(&lender, &loan_id);
        let loan = client.get_loan(&loan_id);
        assert_eq!(loan.status, LoanStatus::Active);

        // 3. Repay Loan
        client.repay_loan(&loan_id, &1000);
        let loan = client.get_loan(&loan_id);
        assert_eq!(loan.status, LoanStatus::Repaid);
        assert_eq!(loan.amount_repaid, 1000);
    }
}
