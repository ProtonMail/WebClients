import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Alert } from '@proton/components/components';

import { BalanceOverview, ExploreProtonWalletSection, WalletSetupModal, YourWalletsSection } from '../components';
import { useBitcoinBlockchainContext } from '../contexts';

export const MultiWalletDashboardContainer = () => {
    const { decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const [isSetupModalOpenned, setIsSetupModalOpenned] = useState(false);

    useEffect(() => {
        if (decryptedApiWalletsData && !decryptedApiWalletsData.length) {
            setIsSetupModalOpenned(true);
        }
    }, [setIsSetupModalOpenned, decryptedApiWalletsData]);

    const firstWalletWithPassphraseNeed = useMemo(
        () => decryptedApiWalletsData?.find((wallet) => wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase),
        [decryptedApiWalletsData]
    );

    return (
        <>
            <div className="flex-1 p-8">
                {firstWalletWithPassphraseNeed && (
                    <Alert type="warning" className="mb-6">
                        <div>
                            <span>{c('Wallet dashboard')
                                .t`Your balance is inaccurate because some wallets requires a passphrase`}</span>
                            <ButtonLike
                                shape="underline"
                                className="ml-3"
                                as={Link}
                                to={`/wallets/${firstWalletWithPassphraseNeed.Wallet.ID}`}
                            >{c('Wallet dashbaord').t`Go to first wallet`}</ButtonLike>
                        </div>
                    </Alert>
                )}

                <BalanceOverview apiWalletsData={decryptedApiWalletsData ?? []} />
                <YourWalletsSection
                    onAddWallet={() => {
                        setIsSetupModalOpenned(true);
                    }}
                />
                <ExploreProtonWalletSection />
            </div>

            <WalletSetupModal
                isFirstSetup={!decryptedApiWalletsData?.length}
                isOpen={isSetupModalOpenned}
                onClose={() => {
                    if (decryptedApiWalletsData?.length) {
                        setIsSetupModalOpenned(false);
                    }
                }}
            />
        </>
    );
};
