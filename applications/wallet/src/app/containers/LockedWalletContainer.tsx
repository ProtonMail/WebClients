import { useMemo } from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Alert, Icon, useModalState } from '@proton/components';

import { CoreButton } from '../atoms';
import { WalletDeletionModal } from '../components/WalletDeletionModal';
import { useBitcoinBlockchainContext } from '../contexts';

export const LockedWalletContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();

    const [walletDeletionModalState, setWalletDeletionModalState] = useModalState();

    const { decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const wallet = useMemo(
        () => decryptedApiWalletsData?.find(({ Wallet }) => Wallet.ID === walletId),
        [walletId, decryptedApiWalletsData]
    );

    if (!decryptedApiWalletsData) {
        return <CircleLoader />;
    }

    if (!wallet) {
        return <Redirect to={'/'} />;
    }

    // TODO: add a reactivation modal similar to calendar's one
    if (!wallet.IsNotDecryptable) {
        return <Redirect to={`/wallets/${wallet.Wallet.ID}`} />;
    }

    return (
        <>
            <div className="flex flex-row w-full min-h-full flex-nowrap">
                <div className="flex flex-column flex-1 p-8 pt-0 flex-nowrap grow">
                    <div className="flex flex-row m-4 items-center">
                        <h1 className="mr-4 text-semibold">{wallet.Wallet.Name}</h1>

                        <CoreButton
                            icon
                            size="medium"
                            shape="ghost"
                            color="weak"
                            className="ml-2 rounded-full bg-weak"
                            onClick={() => {
                                setWalletDeletionModalState(true);
                            }}
                        >
                            <Icon name="pass-trash" className="color-hint" alt={c('Action').t`Delete`} size={5} />
                        </CoreButton>
                    </div>

                    <Alert type="warning">{c('Wallet setup')
                        .t`This wallet is not decryptable anymore. To get it decryptable again, you need to recover the keys used during its creation in your account. Else you can also remove it to free one wallet space.`}</Alert>

                    <WalletDeletionModal wallet={wallet} {...walletDeletionModalState} />
                </div>
            </div>
        </>
    );
};
