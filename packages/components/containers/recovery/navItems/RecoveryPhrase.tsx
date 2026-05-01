import { format } from 'date-fns';
import { c } from 'ttag';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcRecoveryPhrase } from '@proton/icons/icons/IcRecoveryPhrase';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { dateLocale } from '@proton/shared/lib/i18n';

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
    const formattedUpdateDate = updateTime !== null ? format(updateTime, 'PP', { locale: dateLocale }) : null;

    return (
        <SettingsNavItem
            to={to}
            icon={IcRecoveryPhrase}
            title={c('Title').t`Recovery phrase`}
            tooltip={c('Tooltip')
                .t`Save 12-word long phrase to unlock your account and your encrypted data instantly if you forgot your password`}
        >
            <span className="flex items-center gap-2">
                <RecoveryPhraseBadge />
                {formattedUpdateDate && (
                    <span className="text-sm color-weak" data-testid="account:recovery-phrase:last-changed-date">{c(
                        'Status'
                    ).t`Last updated ${formattedUpdateDate}`}</span>
                )}
            </span>
        </SettingsNavItem>
    );
};

export default RecoveryPhrase;
