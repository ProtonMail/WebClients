export interface Transaction {
    id: string;
    note?: string;
    value: number;
    timestamp: number;
}

export interface Recipient {
    address: string;
    amount: number;
}
