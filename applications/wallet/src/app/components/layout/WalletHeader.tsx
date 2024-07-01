import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Hamburger, Header, Icon, TopBanner, useActiveBreakpoint } from '@proton/components';

import { useBitcoinBlockchainContext } from '../../contexts';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    title?: string;
}

const WalletHeader = ({ isHeaderExpanded, toggleHeaderExpanded, title = c('Title').t`Wallet` }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewport = viewportWidth['<=small'];

    const { decryptedApiWalletsData, walletsChainData } = useBitcoinBlockchainContext();

    const { walletId } = useParams<{ walletId?: string }>();
    const wallet = useMemo(
        () => decryptedApiWalletsData?.find(({ Wallet }) => Wallet.ID === walletId),
        [walletId, decryptedApiWalletsData]
    );

    const needPassphrase = Boolean(wallet?.Wallet.HasPassphrase && !wallet?.Wallet.Passphrase);
    const wrongFingerprint =
        needPassphrase &&
        wallet?.Wallet.ID &&
        wallet?.Wallet.Fingerprint !== walletsChainData[wallet.Wallet.ID]?.wallet.getFingerprint();

    return (
        <Header className="p-0" title={title}>
            {isSmallViewport && (
                <div className="p-1 flex">
                    <Hamburger className="p-2 my-auto" expanded={isHeaderExpanded} onToggle={toggleHeaderExpanded} />
                </div>
            )}

            {/* Handle actionArea in components itself rather than here */}
            <div className="flex-1">
                {wrongFingerprint && (
                    <TopBanner className="h-full bg-primary color-invert">
                        <div className="w-full h-full flex flex-row justify-center items-center">
                            <Icon name="exclamation-circle" className="mr-2" size={4} />
                            <span className="block text-semibold">{c('Wallet dashboard')
                                .t`The current fingerprint doesn't match stored one`}</span>
                        </div>
                    </TopBanner>
                )}
            </div>
        </Header>
    );
};

export default WalletHeader;
