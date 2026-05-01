import { c, msgid } from 'ttag';

import { getFormattedCreateTime } from '@proton/account/delegatedAccess/emergencyContact/date';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { useUser } from '@proton/account/user/hooks';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcEmergencyAccess } from '@proton/icons/icons/IcEmergencyAccess';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';

interface Props {
    to: string;
}

const EmergencyContactsStatus = () => {
    const { items, loading } = useOutgoingItems();
    const contacts = items.emergencyContacts;
    const [user] = useUser();
    const hasEmergencyContactAccess = user.isPaid || hasPaidPass(user);
    const hasUpsell = user.canPay && !hasEmergencyContactAccess;
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loading || loadingIsSentinelUser) {
        return <SkeletonLoader width={'3rem'} />;
    }

    if (contacts.length === 0) {
        if (isSentinelUser) {
            return <span className="color-weak">{c('Status').t`No contact`}</span>;
        }
        if (hasUpsell) {
            return (
                <StatusBadge status={StatusBadgeStatus.Upsell} text={c('emergency_access').t`Add emergency contact`} />
            );
        }
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Title').t`Add an emergency contact`} />;
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

const EmergencyContacts = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcEmergencyAccess}
            title={c('Title').t`Emergency access`}
            tooltip={c('Tooltip').t`Allow trusted contacts to request access to your account`}
        >
            <EmergencyContactsStatus />
        </SettingsNavItem>
    );
};

export default EmergencyContacts;
