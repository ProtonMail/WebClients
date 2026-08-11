import { c, msgid } from 'ttag';

import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcEmergencyAccess } from '@proton/icons/icons/IcEmergencyAccess';

import { LastChanged } from '../LastChanged';
import { NavItemStatus } from './NavItemStatus';

interface Props {
    to: string;
}

const EmergencyContactsStatus = () => {
    const {
        emergencyContacts: { items: contacts, hasUpsell, lastModifiedTime },
        loading,
    } = useOutgoingItems();

    if (loading) {
        return <SkeletonLoader width={'3rem'} />;
    }

    const count = contacts.length;

    if (count === 0 && hasUpsell) {
        return <StatusBadge status={StatusBadgeStatus.Upsell} text={c('emergency_access').t`Add emergency contact`} />;
    }

    return (
        <>
            {count === 0 ? (
                <StatusBadge status={StatusBadgeStatus.Warning} text={c('Title').t`Add an emergency contact`} />
            ) : (
                <span className="color-weak">
                    {c('Status').ngettext(msgid`${count} person`, `${count} people`, count)}
                </span>
            )}
            <LastChanged date={lastModifiedTime} data-testid="account:emergency-contacts:last-changed-date" />
        </>
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
            <NavItemStatus>
                <EmergencyContactsStatus />
            </NavItemStatus>
        </SettingsNavItem>
    );
};

export default EmergencyContacts;
