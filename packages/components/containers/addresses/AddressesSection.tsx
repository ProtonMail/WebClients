import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
    app?: APP_NAMES;
}

const AddressesSection = ({ isOnlySelf, app }: Props) => {
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    // Only admins can access to BYOE for now, this will change later
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail') && isAdmin(user);

    return (
        <SettingsSectionWide>
            {!organization || loadingOrganization ? (
                <Loader />
            ) : (
                <Addresses
                    isOnlySelf={isOnlySelf}
                    organization={organization}
                    hasAccessToBYOE={hasAccessToBYOE}
                    app={app}
                />
            )}
        </SettingsSectionWide>
    );
};

export default AddressesSection;
