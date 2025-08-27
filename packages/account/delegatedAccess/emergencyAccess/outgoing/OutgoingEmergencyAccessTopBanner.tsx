import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';

import { getViewTrustedContactRoute } from '../../available';
import { getMetaOutgoingDelegatedAccess } from './helper';
import { useOutgoingItems } from './useOutgoingItems';

const OutgoingEmergencyAccessTopBanner = () => {
    const { items } = useOutgoingItems();

    const now = Date.now();
    const parsedItems = items.map((item) => {
        return {
            meta: getMetaOutgoingDelegatedAccess({ now, value: item }),
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
                path={getViewTrustedContactRoute(firstAccessRequested.item.outgoingDelegatedAccess.DelegatedAccessID)}
                className="color-inherit"
            >
                {c('emergency_access').t`View request`}
            </SettingsLink>
        </TopBanner>
    );
};

export default OutgoingEmergencyAccessTopBanner;
