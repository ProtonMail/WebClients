import type { INVOICE_STATE, INVOICE_TYPE } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

export interface Invoice {
    ID: string;
    Type: INVOICE_TYPE;
    State: INVOICE_STATE;
    Currency: Currency;
    AmountDue: number;
    AmountCharged: number;
    CreateTime: number;
    ModifyTime: number;
    AttemptTime: number;
    Attempts: number;
    IsExternal: boolean;
}

export interface InvoiceResponse {
    Code: number;
    Invoices: Invoice[];
    Total: number;
}
