import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import { useUser } from '@proton/account/user/hooks';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcNote } from '@proton/icons/icons/IcNote';
import { dateLocale } from '@proton/shared/lib/i18n';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

interface Props {
    to: string;
}

const RecoveryPhraseBadge = () => {
    const [user] = useUser();

    if (user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED) {
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Outdated`} />;
    }

    if (user.MnemonicStatus === MNEMONIC_STATUS.SET) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }

    return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Generate a recovery phrase`} />;
};

const RecoveryPhrase = ({ to }: Props) => {
    const [userSettings] = useUserSettings();
    const updateTime = userSettings.Mnemonic.UpdateTime;
    const formattedUpdateDate =
        updateTime != null && updateTime > 0 ? format(fromUnixTime(updateTime), 'PP', { locale: dateLocale }) : null;

    return (
        <SettingsNavItem
            to={to}
            icon={IcNote}
            title={c('Title').t`Recovery phrase`}
            tooltip={c('Tooltip')
                .t`Save 12-word long phrase to unlock your account and your encrypted data instantly if you forgot your password`}
        >
            <span className="flex items-center gap-2">
                <RecoveryPhraseBadge />
                {formattedUpdateDate && (
                    <span className="text-sm color-weak">{c('Status').t`Last updated ${formattedUpdateDate}`}</span>
                )}
            </span>
        </SettingsNavItem>
    );
};

export default RecoveryPhrase;
