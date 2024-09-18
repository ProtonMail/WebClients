import { useEffect, useMemo } from 'react';
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
import { useWalletPassphrase } from '../../hooks/useWalletPassphrase';
import { PassphraseInputModal } from '../PassphraseInputModal';

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
    const [passphraseInputModal, setPassphraseInputModal, renderPassphraseInputModal] = useModalState();

    const { apiWalletsData } = useBitcoinBlockchainContext();

    const { walletId } = useParams<{ walletId?: string }>();
    const wallet = useMemo(
        () => apiWalletsData?.find(({ Wallet }) => Wallet.ID === walletId),
        [walletId, apiWalletsData]
    );

    const { needPassphrase, wrongFingerprint } = useWalletPassphrase(wallet);

    useEffect(() => {
        setPassphraseInputModal(needPassphrase);
    }, [setPassphraseInputModal, needPassphrase]);

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

                        if (needPassphrase || wrongFingerprint) {
                            return (
                                <TopBanner className="h-full bg-primary color-invert">
                                    <div className="w-full h-full flex flex-row justify-center items-center">
                                        <Icon name="exclamation-circle" className="mr-2" size={4} />
                                        <span className="block text-semibold mr-1">
                                            {needPassphrase
                                                ? c('Wallet header').t`This wallet needs a passphrase to be used.`
                                                : c('Wallet header')
                                                      .t`The current fingerprint doesn't match stored one.`}
                                        </span>

                                        <CoreButton
                                            shape="underline"
                                            onClick={() => {
                                                setPassphraseInputModal(true);
                                            }}
                                        >{c('Action').t`Input passphrase`}</CoreButton>
                                    </div>
                                </TopBanner>
                            );
                        }

                        return null;
                    })()}
                </div>
            </Header>

            {renderPassphraseInputModal && wallet && <PassphraseInputModal wallet={wallet} {...passphraseInputModal} />}

            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} />}
        </>
    );
};

export default WalletHeader;
