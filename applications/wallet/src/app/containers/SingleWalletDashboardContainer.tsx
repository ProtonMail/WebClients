import React, { useMemo, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { BalanceOverview, DashboardSideContent } from '../components';
import { OnchainTransactionDetailsProps } from '../components/OnchainTransactionDetails';
import { OnchainTransactionDetailsModal } from '../components/OnchainTransactionDetailsModal';
import { TransactionList } from '../components/TransactionList';
import { useOnchainWalletContext } from '../contexts';

export const SingleWalletDashboardContainer = () => {
    const [modalData, setModalData] = useState<OnchainTransactionDetailsProps>();
    const { walletId } = useParams<{ walletId: string }>();

    const { wallets } = useOnchainWalletContext();
    const wallet = useMemo(() => wallets?.find(({ WalletID }) => WalletID === Number(walletId)), [walletId, wallets]);

    if (!wallet) {
        return <Redirect to={'/wallets'} />;
    }

    return (
        <>
            <div className="flex flex-row w-full h-full flex-nowrap">
                <div className="flex flex-column flex-1 p-8 flex-nowrap grow">
                    <BalanceOverview wallets={[wallet]} />
                    <TransactionList wallet={wallet} />
                </div>

                <div>
                    <div className="w-custom h-full" style={{ '--w-custom': '21rem' }}>
                        <DashboardSideContent walletId={wallet.WalletID} />
                    </div>
                </div>
            </div>

            <OnchainTransactionDetailsModal
                onClose={() => setModalData(undefined)}
                isOpen={!!modalData}
                data={modalData}
            />
        </>
    );
};
