import { c, msgid } from 'ttag';

import { getFormattedCreateTime } from '@proton/account/delegatedAccess/emergencyContact/date';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcUsers } from '@proton/icons/icons/IcUsers';

interface Props {
    to: string;
}

const RecoveryContactsStatus = () => {
    const { items, loading } = useOutgoingItems();
    const contacts = items.recoveryContacts;
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loading || loadingIsSentinelUser) {
        return <SkeletonLoader width={'3rem'} />;
    }

    if (contacts.length === 0) {
        if (isSentinelUser) {
            return <span className="color-weak">{c('Status').t`No contact`}</span>;
        }
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Title').t`Add a recovery contact`} />;
    }

    const count = contacts.length;
    const latestDate = contacts.reduce<Date | null>((latest, contact) => {
        const date = contact.parsedOutgoingDelegatedAccess.createdAtDate;
        return latest === null || date > latest ? date : latest;
    }, null);
    const formattedDate = getFormattedCreateTime(latestDate);

    return (
        <span className="color-weak">
            <span>{c('Status').ngettext(msgid`${count} person`, `${count} people`, count)}</span>
            {formattedDate && <span> • {c('Status').t`Last changed ${formattedDate}`}</span>}
        </span>
    );
};

const RecoveryContacts = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcUsers}
            title={c('Title').t`Contact-assisted recovery`}
            tooltip={c('Tooltip').t`Allow trusted contacts to unlock your encrypted data after a password reset`}
        >
            <RecoveryContactsStatus />
        </SettingsNavItem>
    );
};

export default RecoveryContacts;
