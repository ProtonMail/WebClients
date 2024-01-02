import React, { useEffect, useState } from 'react';

import {
    BalanceOverview,
    DashboardSideContent,
    ExploreProtonWalletSection,
    WalletSetupModal,
    YourWalletsSection,
} from '../components';
import { useOnchainWalletContext } from '../contexts';

export const MultiWalletDashboardContainer = () => {
    const { wallets } = useOnchainWalletContext();

    const [isSetupModalOpenned, setIsSetupModalOpenned] = useState(false);
    const accounts = wallets?.flatMap(({ accounts }) => accounts) ?? [];
    const transactions = accounts.flatMap(({ transactions }) => transactions);

    useEffect(() => {
        setIsSetupModalOpenned(!wallets?.length);
    }, [setIsSetupModalOpenned, wallets?.length]);

    return (
        <>
            <div className="flex flex-row w-full h-full flex-nowrap grow">
                <div className="flex-1 p-8">
                    <BalanceOverview wallets={wallets} />
                    <YourWalletsSection
                        onAddWallet={() => {
                            setIsSetupModalOpenned(true);
                        }}
                    />
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
