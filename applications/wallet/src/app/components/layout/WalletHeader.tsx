import { c } from 'ttag';

import { PrivateHeader, QuickSettingsAppButton, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    title?: string;
}

const WalletHeader = ({ isHeaderExpanded, toggleHeaderExpanded, title = c('Title').t`Wallet` }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <PrivateHeader
            userDropdown={<UserDropdown app={APPS.PROTONWALLET} />}
            title={title}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            settingsButton={<QuickSettingsAppButton />}
        />
    );
};

export default WalletHeader;
