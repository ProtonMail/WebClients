import { c } from 'ttag';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { IcRecoveryPhrase } from '@proton/icons/icons/IcRecoveryPhrase';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import SettingsNavItem from '../../layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '../../layout/StatusBadge';
import { LastChanged } from '../LastChanged';
import { NavItemStatus } from './NavItemStatus';

interface Props {
    to: string;
}

const RecoveryPhraseBadge = () => {
    const { hasOutdatedMnemonic, isMnemonicSet } = useSelector(selectMnemonicData);

    if (hasOutdatedMnemonic) {
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Outdated`} />;
    }

    if (isMnemonicSet) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }

    return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Generate a recovery phrase`} />;
};

const RecoveryPhrase = ({ to }: Props) => {
    const { updateTime } = useSelector(selectMnemonicData);

    return (
        <SettingsNavItem
            to={to}
            icon={IcRecoveryPhrase}
            title={c('Title').t`Recovery phrase`}
            tooltip={c('Tooltip')
                .t`Save 12-word long phrase to unlock your account and your encrypted data instantly if you forgot your password`}
        >
            <NavItemStatus>
                <RecoveryPhraseBadge />
                <LastChanged date={updateTime} data-testid="account:recovery-phrase:last-changed-date" />
            </NavItemStatus>
        </SettingsNavItem>
    );
};

export default RecoveryPhrase;
