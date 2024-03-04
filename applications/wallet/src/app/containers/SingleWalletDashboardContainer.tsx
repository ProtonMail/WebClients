import React, { useMemo } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Alert } from '@proton/components/components';

import { BalanceOverview } from '../components';
import { PassphraseInputModal } from '../components/PassphraseInputModal';
import { YourAccountsSection } from '../components/YourAccountsSection';
import { useBitcoinBlockchainContext } from '../contexts';

export const SingleWalletDashboardContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();
    const history = useHistory();

    const { decryptedApiWalletsData, setPassphrase, walletsChainData, syncSingleWallet } =
        useBitcoinBlockchainContext();

    const wallet = useMemo(
        () => decryptedApiWalletsData?.find(({ Wallet }) => Wallet.ID === walletId),
        [walletId, decryptedApiWalletsData]
    );

    if (!decryptedApiWalletsData) {
        return <CircleLoader />;
    }

    if (!wallet) {
        return <Redirect to={'/wallets'} />;
    }

    const needPassphrase = Boolean(wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase);

    const wrongFingerprint =
        !needPassphrase && wallet.Wallet.Fingerprint !== walletsChainData[wallet.Wallet.ID]?.wallet.getFingerprint();

    return (
        <>
            <div className="flex flex-row w-full h-full flex-nowrap">
                <div className="flex flex-column flex-1 p-8 flex-nowrap grow">
                    {wrongFingerprint && (
                        <Alert type="warning" className="mb-6">
                            <div>
                                <span>{c('Wallet dashboard').t`The current fingerprint doesn't match stored one`}</span>
                            </div>
                        </Alert>
                    )}

                    <BalanceOverview apiWalletData={wallet} />
                    <YourAccountsSection apiWalletData={wallet} />
                    <PassphraseInputModal
                        wallet={wallet}
                        isOpen={needPassphrase}
                        onClose={history.goBack}
                        onConfirmPassphrase={(passphrase) => {
                            setPassphrase(wallet.Wallet.ID, passphrase);
                            void syncSingleWallet(wallet.Wallet.ID);
                        }}
                    />
                </div>
            </div>
        </>
    );
};
