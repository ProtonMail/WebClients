import React from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { BalanceOverview, DashboardSideContent, ExploreProtonWalletSection } from '../components';
import { wallets } from '../tests';
import { Transaction } from '../types';

// TODO: replace by transactions fetched with PWC when wallet API is done
const transactions: Transaction[] = [
    { id: '1', value: 950918, timestamp: 1700159117000 },
    { id: '3', value: 354970, timestamp: 1700402779000 },
    { id: '5', value: -763580, timestamp: 1700286123000 },
    { id: '6', value: 679892, timestamp: 1700402923000 },
    { id: '7', value: 98291, timestamp: 1700224823000 },
    { id: '8', value: 724192, timestamp: 1700339971000 },
    { id: '11', value: -102097, timestamp: 1700591072000 },
    { id: '12', value: 871157, timestamp: 1700316013000 },
    { id: '13', value: 601852, timestamp: 1700306255000 },
    { id: '16', value: -478480, timestamp: 1700418812000 },
    { id: '18', value: -906759, timestamp: 1700629366000 },
    { id: '20', value: -161112, timestamp: 1700222245000 },
    { id: '21', value: -10061112, timestamp: 1700222245000 },
];

export const SingleWalletDashboardContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();

    const wallet = wallets.find(({ id }) => id === walletId);

    if (!wallet) {
        return <Redirect to={'/wallets'} />;
    }

    return (
        <div className="flex flex-row w-full h-full flex-nowrap flex-item-grow">
            <div className="flex-item-fluid p-8">
                <BalanceOverview wallets={[wallet]} transactions={transactions} />
                <ExploreProtonWalletSection />
            </div>

            <div>
                <div className="w-custom h-full" style={{ '--w-custom': '21rem' }}>
                    <DashboardSideContent walletId={wallet.id} transactions={transactions} />
                </div>
            </div>
        </div>
    );
};
