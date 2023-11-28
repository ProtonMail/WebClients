import React, { useEffect, useState } from 'react';

import {
    BalanceOverview,
    DashboardSideContent,
    ExploreProtonWalletSection,
    WalletSetupModal,
    YourWalletsSection,
} from '../components';
import { transactions, wallets } from '../tests';

export const MultiWalletDashboardContainer = () => {
    const [isSetupModalOpenned, setIsSetupModalOpenned] = useState(false);

    useEffect(() => {
        if (!wallets.length) {
            setIsSetupModalOpenned(true);
        }
    }, [setIsSetupModalOpenned]);

    return (
        <>
            <div className="flex flex-row w-full h-full flex-nowrap flex-item-grow">
                <div className="flex-item-fluid p-8">
                    <BalanceOverview wallets={wallets} transactions={transactions} />
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
