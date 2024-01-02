import { useMemo } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { PrivateHeader, QuickSettingsAppButton, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { useBlockchainContext } from '../../contexts';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    title?: string;
}

const WalletHeader = ({ isHeaderExpanded, toggleHeaderExpanded, title = c('Title').t`Wallet` }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const { syncingMetatadaByAccountId } = useBlockchainContext();

    const syncingText = useMemo(() => {
        const hasSyncingAccounts = Object.values(syncingMetatadaByAccountId).some((account) => account?.syncing);

        if (hasSyncingAccounts) {
            return 'Syncing wallets';
        }

        return null;
    }, [syncingMetatadaByAccountId]);

    return (
        <PrivateHeader
            userDropdown={<UserDropdown app={APPS.PROTONWALLET} />}
            title={title}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isSmallViewport={viewportWidth['<=small']}
            settingsButton={<QuickSettingsAppButton />}
            actionArea={
                <div className="flex h-full">
                    {syncingText && (
                        <div className="ml-2 flex flex-row items-center my-auto">
                            <span className="color-hint text-sm">{syncingText}</span>
                            <CircleLoader size="small" className="ml-2 color-primary" />
                        </div>
                    )}
                </div>
            }
        />
    );
};

export default WalletHeader;
