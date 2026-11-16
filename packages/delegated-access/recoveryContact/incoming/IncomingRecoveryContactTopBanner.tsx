import { c } from 'ttag';

import { getIsIncomingDelegatedAccessAvailable } from '@proton/account/delegatedAccess/available';
import { getHelpRecoveryContactRecoverRoute } from '@proton/account/delegatedAccess/routes';
import { getMetaIncomingDelegatedAccess } from '@proton/account/delegatedAccess/shared/incoming/helper';
import { useIncomingItems } from '@proton/account/delegatedAccess/shared/incoming/useIncomingItems';
import { useUser } from '@proton/account/user/hooks';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';

const InnerIncomingRecoveryContactTopBanner = () => {
    const { items } = useIncomingItems();

    const now = Date.now();
    const parsedItems = items.recoveryContacts.map((item) => {
        return {
            meta: getMetaIncomingDelegatedAccess({ now, value: item }),
            item,
        };
    });

    const firstRecoveryContactAskingForHelp = parsedItems.find((value) => value.meta.canRecover);

    if (!firstRecoveryContactAskingForHelp) {
        return null;
    }

    const name = firstRecoveryContactAskingForHelp.item.parsedIncomingDelegatedAccess.contact.formatted;

    return (
        <TopBanner className="bg-warning">
            {c('emergency_access').t`Your recovery contact ${name} is asking for help to recover their data.`}{' '}
            <SettingsLink
                path={getHelpRecoveryContactRecoverRoute(
                    firstRecoveryContactAskingForHelp.item.incomingDelegatedAccess.DelegatedAccessID
                )}
                className="color-inherit"
            >
                {c('emergency_access').t`See request`}
            </SettingsLink>
        </TopBanner>
    );
};

export const IncomingRecoveryContactTopBanner = () => {
    const [user] = useUser();
    if (!getIsIncomingDelegatedAccessAvailable(user)) {
        return null;
    }
    return <InnerIncomingRecoveryContactTopBanner />;
};
