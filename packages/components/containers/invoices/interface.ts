import { INVOICE_STATE } from 'proton-shared/lib/constants';

export interface Invoice {
    ID: string;
    Type: number;
    State: INVOICE_STATE;
    Currency: string;
    AmountDue: number;
    AmountCharged: number;
    CreateTime: number;
    ModifyTime: number;
    AttemptTime: number;
    Attempts: number;
}
