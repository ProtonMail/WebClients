import { c, msgid } from 'ttag';

import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcContactAssistedRecovery } from '@proton/icons/icons/IcContactAssistedRecovery';

import { LastChanged } from '../LastChanged';
import { NavItemStatus } from './NavItemStatus';

interface Props {
    to: string;
}

const RecoveryContactsStatus = () => {
    const {
        recoveryContacts: { items: contacts, lastModifiedTime },
        loading,
    } = useOutgoingItems();

    if (loading) {
        return <SkeletonLoader width={'3rem'} />;
    }

    const count = contacts.length;

    return (
        <>
            {count === 0 ? (
                <StatusBadge status={StatusBadgeStatus.Warning} text={c('Title').t`Add a recovery contact`} />
            ) : (
                <span className="color-weak">
                    {c('Status').ngettext(msgid`${count} person`, `${count} people`, count)}
                </span>
            )}
            <LastChanged date={lastModifiedTime} data-testid="account:recovery-contacts:last-changed-date" />
        </>
    );
};

const RecoveryContacts = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcContactAssistedRecovery}
            title={c('Title').t`Data recovery contacts`}
            tooltip={c('Tooltip').t`Allow trusted contacts to unlock your encrypted data after a password reset`}
        >
            <NavItemStatus>
                <RecoveryContactsStatus />
            </NavItemStatus>
        </SettingsNavItem>
    );
};

export default RecoveryContacts;
