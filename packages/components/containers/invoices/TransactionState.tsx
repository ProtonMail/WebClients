import { TransactionState } from '@proton/payments/core/constants';
import { getTransactionStateTitle } from '@proton/payments/core/transactions';

import { Badge } from '../../components/badge/Badge';

const TYPES = {
    [TransactionState.SUCCESS]: 'success',
    [TransactionState.VOIDED]: 'default',
    [TransactionState.FAILURE]: 'error',
    [TransactionState.TIMEOUT]: 'default',
    [TransactionState.NEEDS_ATTENTION]: 'default',
    [TransactionState.REFUNDED]: 'default',
    [TransactionState.CHARGEBACK]: 'default',
} as const;

interface Props {
    state: TransactionState;
}

const TransactionStateBadge = ({ state }: Props) => {
    return (
        <Badge type={TYPES[state] ?? 'default'} data-testid="transaction-state">
            {getTransactionStateTitle(state)}
        </Badge>
    );
};

export default TransactionStateBadge;
