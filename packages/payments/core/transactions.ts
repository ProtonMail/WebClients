import { c } from 'ttag';

import { TransactionState, TransactionType } from './constants';

export function displayTransactionType(type: TransactionType): boolean {
    const hiddenTransactionTypes = new Set([
        TransactionType.AUTHORIZATION,
        TransactionType.PAYMENT_REVERSAL,
        TransactionType.CURRENCY_CONVERSION,
        TransactionType.CREDIT,
        TransactionType.CHARGEBACK,
        TransactionType.MIGRATION,
        TransactionType.ADJUSTMENT_CREDIT,
    ]);

    return !hiddenTransactionTypes.has(type);
}

export function getTransactionTypeTitle(type: TransactionType, complete = false): string {
    if (!displayTransactionType(type) && !complete) {
        return '';
    }

    switch (type) {
        case TransactionType.AUTHORIZATION:
            return c('Transaction type display as badge').t`Authorization`;
        case TransactionType.PAYMENT:
            return c('Transaction type display as badge').t`Payment`;
        case TransactionType.REFUND:
            return c('Transaction type display as badge').t`Refund`;
        case TransactionType.PAYMENT_REVERSAL:
            return c('Transaction type display as badge').t`Payment reversal`;
        case TransactionType.CURRENCY_CONVERSION:
            return c('Transaction type display as badge').t`Currency conversion`;
        case TransactionType.CREDIT:
            return c('Transaction type display as badge').t`Credit`;
        case TransactionType.GIFT_CARD:
            return c('Transaction type display as badge').t`Gift card`;
        case TransactionType.BANK_TRANSFER:
            return c('Transaction type display as badge').t`Bank transfer`;
        case TransactionType.BITCOIN:
            return c('Transaction type display as badge').t`Bitcoin`;
        case TransactionType.CASH:
            return c('Transaction type display as badge').t`Cash`;
        case TransactionType.CHARGEBACK:
            return c('Transaction type display as badge').t`Chargeback`;
        case TransactionType.CREDIT_TRANSFER:
            return c('Transaction type display as badge').t`Credit transfer`;
        case TransactionType.MIGRATION:
            return c('Transaction type display as badge').t`Migration`;
        case TransactionType.ADJUSTMENT_CREDIT:
            return c('Transaction type display as badge').t`Adjustment credit`;
        default:
            return '';
    }
}

export function displayTransactionState(state: TransactionState): boolean {
    const hiddenTransactionStates = new Set([TransactionState.NEEDS_ATTENTION]);
    return !hiddenTransactionStates.has(state);
}

export function getTransactionStateTitle(state: TransactionState, complete = false): string {
    if (!displayTransactionState(state) && !complete) {
        return '';
    }

    switch (state) {
        case TransactionState.SUCCESS:
            return c('Transaction state display as badge').t`Success`;
        case TransactionState.VOIDED:
            return c('Transaction state display as badge').t`Voided`;
        case TransactionState.FAILURE:
            return c('Transaction state display as badge').t`Failed`;
        case TransactionState.TIMEOUT:
            return c('Transaction state display as badge').t`Timeout`;
        case TransactionState.NEEDS_ATTENTION:
            return c('Transaction state display as badge').t`Needs attention`;
        case TransactionState.REFUNDED:
            return c('Transaction state display as badge').t`Refunded`;
        case TransactionState.CHARGEBACK:
            return c('Transaction state display as badge').t`Chargeback`;
        default:
            return '';
    }
}
