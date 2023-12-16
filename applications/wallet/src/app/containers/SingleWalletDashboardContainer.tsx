import React from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { BalanceOverview, DashboardSideContent, ExploreProtonWalletSection } from '../components';
import { useBlockchainContext } from '../contexts';

export const SingleWalletDashboardContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();

    const { wallets } = useBlockchainContext();
    const wallet = wallets?.find(({ WalletID }) => WalletID === Number(walletId));

    if (!wallet) {
        return <Redirect to={'/wallets'} />;
    }

    return (
        <div className="flex flex-row w-full h-full flex-nowrap grow">
            <div className="flex-1 p-8">
                <BalanceOverview wallets={[wallet]} />
                <ExploreProtonWalletSection />
            </div>

            <div>
                <div className="w-custom h-full" style={{ '--w-custom': '21rem' }}>
                    <DashboardSideContent
                        walletId={wallet.WalletID}
                        transactions={wallet.accounts.flatMap(({ transactions }) => transactions)}
                    />
                </div>
            </div>
        </div>
    );
};
