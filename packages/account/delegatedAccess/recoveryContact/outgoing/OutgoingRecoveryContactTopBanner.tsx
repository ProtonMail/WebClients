import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';

import { useUser } from '../../../user/hooks';
import { getIsOutgoingDelegatedAccessAvailable } from '../../available';
import { getViewRecoveryContactRecoverRoute } from '../../routes';
import { getMetaOutgoingDelegatedAccess } from '../../shared/outgoing/helper';
import { useOutgoingItems } from '../../shared/outgoing/useOutgoingItems';

const InnerOutgoingRecoveryContactTopBanner = () => {
    const { hasKeysToReactivate, recoveryContacts } = useOutgoingItems();

    if (!hasKeysToReactivate) {
        return null;
    }

    const now = Date.now();
    const parsedItems = recoveryContacts.items.map((item) => {
        return {
            meta: getMetaOutgoingDelegatedAccess({ now, value: item, hasKeysToReactivate }),
            item,
        };
    });

    const firstRecoveryContactWithToken = parsedItems.find((value) => value.meta.canRecoverStep2);

    if (!firstRecoveryContactWithToken) {
        return null;
    }

    const name = firstRecoveryContactWithToken.item.parsedOutgoingDelegatedAccess.contact.formatted;

    return (
        <TopBanner className="bg-info">
            {c('emergency_access')
                .t`Your recovery contact ${name} approved your request to unlock your encrypted data.`}{' '}
            <SettingsLink
                path={getViewRecoveryContactRecoverRoute(
                    firstRecoveryContactWithToken.item.outgoingDelegatedAccess.DelegatedAccessID
                )}
                className="color-inherit"
            >
                {c('emergency_access').t`Recover data now`}
            </SettingsLink>
        </TopBanner>
    );
};

export const OutgoingRecoveryContactTopBanner = () => {
    const [user] = useUser();
    if (!getIsOutgoingDelegatedAccessAvailable(user)) {
        return null;
    }
    return <InnerOutgoingRecoveryContactTopBanner />;
};
