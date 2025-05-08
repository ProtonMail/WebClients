import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash/index';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    // Only admins can access to BYOE for now, this will change later
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail') && isAdmin(user);

    return (
        <SettingsSectionWide>
            {!organization || loadingOrganization ? (
                <Loader />
            ) : (
                <Addresses isOnlySelf={isOnlySelf} organization={organization} hasAccessToBYOE={hasAccessToBYOE} />
            )}
        </SettingsSectionWide>
    );
};

export default AddressesSection;
