export interface Beneficiary {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: string;
  beneficiary: string;
  date: string;
}

let beneficiaries: Beneficiary[] = [
  { id: "b1", name: "Jane Doe" },
  { id: "b2", name: "Acme Corp" },
];

let transactions: Transaction[] = [
  { id: "t1", amount: "250.00", beneficiary: "Jane Doe", date: "2026-08-20" },
  { id: "t2", amount: "1,200.00", beneficiary: "Acme Corp", date: "2026-08-15" },
];

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function nextId(prefix: string): string {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

export const bankStore = {
  getBeneficiaries: () => beneficiaries,
  getTransactions: () => transactions,

  addBeneficiary(name: string): Beneficiary {
    const beneficiary: Beneficiary = { id: nextId("b"), name };
    beneficiaries = [...beneficiaries, beneficiary];
    emit();
    return beneficiary;
  },

  addTransaction(amount: string, beneficiary: string): Transaction {
    const transaction: Transaction = {
      id: nextId("t"),
      amount,
      beneficiary,
      date: new Date().toISOString().slice(0, 10),
    };
    transactions = [transaction, ...transactions];
    emit();
    return transaction;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
