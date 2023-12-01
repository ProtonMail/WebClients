import React, { useEffect, useState } from 'react';

import {
    BalanceOverview,
    DashboardSideContent,
    ExploreProtonWalletSection,
    WalletSetupModal,
    YourWalletsSection,
} from '../components';
import { WalletWithAccountsWithBalanceAndTxs } from '../types';

interface Props {
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

export const MultiWalletDashboardContainer = ({ wallets }: Props) => {
    const [isSetupModalOpenned, setIsSetupModalOpenned] = useState(false);
    const accounts = wallets.flatMap(({ accounts }) => accounts);
    const transactions = accounts.flatMap(({ transactions }) => transactions);

    useEffect(() => {
        setIsSetupModalOpenned(!wallets.length);
    }, [setIsSetupModalOpenned, wallets.length]);

    return (
        <>
            <div className="flex flex-row w-full h-full flex-nowrap flex-item-grow">
                <div className="flex-item-fluid p-8">
                    <BalanceOverview wallets={wallets} />
                    <YourWalletsSection wallets={wallets} />
                    <ExploreProtonWalletSection />
                </div>

                <div>
                    <div className="w-custom h-full" style={{ '--w-custom': '21rem' }}>
                        <DashboardSideContent transactions={transactions} />
                    </div>
                </div>
            </div>
            <WalletSetupModal isOpen={isSetupModalOpenned} onClose={() => setIsSetupModalOpenned(false)} />
        </>
    );
};
