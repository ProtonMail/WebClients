import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';

import { useUser } from '../../../user/hooks';
import { getIsOutgoingDelegatedAccessAvailable } from '../../available';
import { getViewEmergencyAccessRoute } from '../../routes';
import { getMetaOutgoingDelegatedAccess } from '../../shared/outgoing/helper';
import { useOutgoingItems } from '../../shared/outgoing/useOutgoingItems';

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
