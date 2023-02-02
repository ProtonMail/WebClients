import { INVOICE_STATE } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

export interface Invoice {
    ID: string;
    Type: number;
    State: INVOICE_STATE;
    Currency: Currency;
    AmountDue: number;
    AmountCharged: number;
    CreateTime: number;
    ModifyTime: number;
    AttemptTime: number;
    Attempts: number;
}

export interface InvoiceResponse {
    Code: number;
    Invoices: Invoice[];
    Total: number;
}
