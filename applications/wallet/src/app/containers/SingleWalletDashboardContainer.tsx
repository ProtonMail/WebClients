import React, { useMemo } from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { BalanceOverview } from '../components';
import { YourAccountsSection } from '../components/YourAccountsSection';
import { useOnchainWalletContext } from '../contexts';

export const SingleWalletDashboardContainer = () => {
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
                    <BalanceOverview wallet={wallet} />
                    <YourAccountsSection wallet={wallet} />
                </div>
            </div>
        </>
    );
};
