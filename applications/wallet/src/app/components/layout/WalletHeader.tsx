import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { c } from 'ttag';

import {
    AuthenticatedBugModal,
    Hamburger,
    Header,
    Icon,
    TopBanner,
    useActiveBreakpoint,
    useModalState,
} from '@proton/components';

import { CoreButton } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    title?: string;
    syncingError?: string | null;
}

const WalletHeader = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    syncingError,
    title = c('Title').t`Wallet`,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewport = viewportWidth['<=small'];

    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();

    const { apiWalletsData, walletsChainData } = useBitcoinBlockchainContext();

    const { walletId } = useParams<{ walletId?: string }>();
    const wallet = useMemo(
        () => apiWalletsData?.find(({ Wallet }) => Wallet.ID === walletId),
        [walletId, apiWalletsData]
    );

    const needPassphrase = Boolean(wallet?.Wallet.HasPassphrase && !wallet?.Wallet.Passphrase);
    const wrongFingerprint =
        needPassphrase &&
        wallet?.Wallet.ID &&
        wallet?.Wallet.Fingerprint !== walletsChainData[wallet.Wallet.ID]?.wallet.getFingerprint();

    return (
        <>
            <Header className="p-0 h-auto" title={title}>
                {isSmallViewport && (
                    <div className="p-1 flex">
                        <Hamburger
                            className="p-2 my-auto"
                            expanded={isHeaderExpanded}
                            onToggle={toggleHeaderExpanded}
                        />
                    </div>
                )}

                {/* Handle actionArea in components itself rather than here */}
                <div className="flex-1">
                    {(() => {
                        if (syncingError) {
                            return (
                                <TopBanner className="bg-danger">
                                    <div className="flex flex-row items-center justify-center gap-2">
                                        <Icon name="exclamation-circle" />
                                        <span className="block">{syncingError}</span>
                                        <CoreButton
                                            shape="underline"
                                            onClick={() => {
                                                setBugReportModal(true);
                                            }}
                                        >{c('Action').t`Need help?`}</CoreButton>
                                    </div>
                                </TopBanner>
                            );
                        }

                        if (wrongFingerprint) {
                            return (
                                <TopBanner className="h-full bg-primary color-invert">
                                    <div className="w-full h-full flex flex-row justify-center items-center">
                                        <Icon name="exclamation-circle" className="mr-2" size={4} />
                                        <span className="block text-semibold">{c('Wallet header')
                                            .t`The current fingerprint doesn't match stored one`}</span>
                                    </div>
                                </TopBanner>
                            );
                        }

                        return null;
                    })()}
                </div>
            </Header>

            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} />}
        </>
    );
};

export default WalletHeader;
