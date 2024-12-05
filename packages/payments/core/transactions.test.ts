import { TransactionState, TransactionType } from './constants';
import { getTransactionStateTitle, getTransactionTypeTitle } from './transactions';

describe('transactions', () => {
    describe('getTransactionTypeTitle', () => {
        it.each([
            [TransactionType.PAYMENT, false, 'Payment'],
            [TransactionType.REFUND, false, 'Refund'],
            [TransactionType.GIFT_CARD, false, 'Gift card'],
            [TransactionType.BANK_TRANSFER, false, 'Bank transfer'],
            [TransactionType.BITCOIN, false, 'Bitcoin'],
            [TransactionType.CASH, false, 'Cash'],
            // Hidden transaction types
            [TransactionType.AUTHORIZATION, false, ''],
            [TransactionType.PAYMENT_REVERSAL, false, ''],
            [TransactionType.CURRENCY_CONVERSION, false, ''],
            [TransactionType.CREDIT, false, ''],
            [TransactionType.CHARGEBACK, false, ''],
            [TransactionType.MIGRATION, false, ''],
            [TransactionType.ADJUSTMENT_CREDIT, false, ''],
            // Show hidden types when complete=true
            [TransactionType.AUTHORIZATION, true, 'Authorization'],
            [TransactionType.PAYMENT_REVERSAL, true, 'Payment reversal'],
            [TransactionType.CURRENCY_CONVERSION, true, 'Currency conversion'],
            [TransactionType.CREDIT, true, 'Credit'],
            [TransactionType.CHARGEBACK, true, 'Chargeback'],
            [TransactionType.MIGRATION, true, 'Migration'],
            [TransactionType.ADJUSTMENT_CREDIT, true, 'Adjustment credit'],
            ['INVALID_TYPE' as any as TransactionType, false, ''],
        ])('should return correct title for transaction type %s with complete=%s', (type, complete, expectedTitle) => {
            expect(getTransactionTypeTitle(type, complete)).toBe(expectedTitle);
        });
    });

    describe('getTransactionStateTitle', () => {
        it.each([
            [TransactionState.SUCCESS, false, 'Success'],
            [TransactionState.VOIDED, false, 'Voided'],
            [TransactionState.FAILURE, false, 'Failed'],
            [TransactionState.TIMEOUT, false, 'Timeout'],
            [TransactionState.REFUNDED, false, 'Refunded'],
            [TransactionState.CHARGEBACK, false, 'Chargeback'],
            // Hidden states
            [TransactionState.NEEDS_ATTENTION, false, ''],
            // Show hidden states when complete=true
            [TransactionState.NEEDS_ATTENTION, true, 'Needs attention'],
            ['INVALID_STATE' as any, false, ''],
        ])('should return correct title for state %s with complete=%s', (state, complete, expectedTitle) => {
            expect(getTransactionStateTitle(state, complete)).toBe(expectedTitle);
        });
    });
});
