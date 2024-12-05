import { type TransactionType, getTransactionTypeTitle } from '@proton/payments';

interface Props {
    type: TransactionType;
}

const TransactionTypeText = ({ type }: Props) => {
    return <>{getTransactionTypeTitle(type)}</>;
};

export default TransactionTypeText;
