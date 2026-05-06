import { c, msgid } from 'ttag';

import { getFormattedCreateTime } from '@proton/account/delegatedAccess/emergencyContact/date';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcContactAssistedRecovery } from '@proton/icons/icons/IcContactAssistedRecovery';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';

interface Props {
    to: string;
}

const RecoveryContactsStatus = () => {
    const {
        recoveryContacts: { items: contacts },
        loading,
    } = useOutgoingItems();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loading || loadingIsSentinelUser) {
        return <SkeletonLoader width={'3rem'} />;
    }

    const count = contacts.length;
    if (count === 0) {
        if (isSentinelUser) {
            return <span className="color-weak text-sm">{c('Status').t`No contact`}</span>;
        }
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Title').t`Add a recovery contact`} />;
    }

    if (isSentinelUser && count > 0) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable contact-assisted recovery`}
                icon={IcShieldExclamationFilled}
            />
        );
    }

    const latestDate = contacts.reduce<Date | null>((latest, contact) => {
        const date = contact.parsedOutgoingDelegatedAccess.createdAtDate;
        return latest === null || date > latest ? date : latest;
    }, null);
    const formattedDate = getFormattedCreateTime(latestDate);

    return (
        <span className="color-weak text-sm">
            <span>{c('Status').ngettext(msgid`${count} person`, `${count} people`, count)}</span>
            {formattedDate && (
                <span data-testid="account:recovery-contacts:last-changed-date">
                    {' '}
                    • {c('Status').t`Last changed ${formattedDate}`}
                </span>
            )}
        </span>
    );
};

const RecoveryContacts = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcContactAssistedRecovery}
            title={c('Title').t`Contact-assisted recovery`}
            tooltip={c('Tooltip').t`Allow trusted contacts to unlock your encrypted data after a password reset`}
        >
            <RecoveryContactsStatus />
        </SettingsNavItem>
    );
};

export default RecoveryContacts;
