import { c } from 'ttag';

import { getIsOutgoingDelegatedAccessAvailable } from '@proton/account/delegatedAccess/available';
import { getViewEmergencyAccessRoute } from '@proton/account/delegatedAccess/routes';
import { getMetaOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/helper';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { useUser } from '@proton/account/user/hooks';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';

const InnerOutgoingEmergencyAccessTopBanner = () => {
    const { emergencyContacts, hasKeysToReactivate } = useOutgoingItems();

    const now = Date.now();
    const parsedItems = emergencyContacts.items.map((item) => {
        return {
            meta: getMetaOutgoingDelegatedAccess({ now, value: item, hasKeysToReactivate }),
            item,
        };
    });

    const firstAccessRequested = parsedItems.find((value) => value.meta.hasRequestedAccess);

    if (!firstAccessRequested) {
        return;
    }

    const name = firstAccessRequested.item.parsedOutgoingDelegatedAccess.contact.formatted;

    return (
        <TopBanner className="bg-warning">
            {c('emergency_access').t`Your emergency contact ${name} is requesting access to your account.`}{' '}
            <SettingsLink
                path={getViewEmergencyAccessRoute(firstAccessRequested.item.outgoingDelegatedAccess.DelegatedAccessID)}
                className="color-inherit"
            >
                {c('emergency_access').t`View request`}
            </SettingsLink>
        </TopBanner>
    );
};

export const OutgoingEmergencyContactTopBanner = () => {
    const [user] = useUser();
    if (!getIsOutgoingDelegatedAccessAvailable(user)) {
        return null;
    }
    return <InnerOutgoingEmergencyAccessTopBanner />;
};
