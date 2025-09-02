import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import { useLoading } from '@proton/hooks';
import type { Transaction } from '@proton/payments';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    transaction: Transaction;
    onPreview?: (transaction: Transaction) => void;
    onDownload: (transaction: Transaction) => void;
}

const TransactionActions = ({ transaction, onPreview, onDownload }: Props) => {
    const [downloadLoading, withDownloadLoading] = useLoading();
    const [viewLoading, withViewLoading] = useLoading();

    const list = [
        {
            text: c('Action').t`View`,
            'data-testid': 'viewTransaction',
            onClick: async () => {
                const handler = async () => {
                    onPreview?.(transaction);
                };
                await withViewLoading(handler());
            },
            loading: viewLoading,
        },
        {
            text: c('Action').t`Download`,
            'data-testid': 'downloadTransaction',
            onClick: async () => {
                const handler = async () => {
                    onDownload(transaction);
                };
                await withDownloadLoading(handler());
            },
            loading: downloadLoading,
        },
    ].filter(isTruthy);

    return <DropdownActions loading={Boolean(downloadLoading || viewLoading)} list={list} size="small" />;
};

export default TransactionActions;
