import type { TransactionType } from '@proton/payments';
import { getTransactionTypeTitle } from '@proton/payments/core/transactions';

interface Props {
    type: TransactionType;
}

const TransactionTypeText = ({ type }: Props) => {
    return <>{getTransactionTypeTitle(type)}</>;
};

export default TransactionTypeText;
