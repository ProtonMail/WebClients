import { useOrganization } from '@proton/account/organization/hooks';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [organization, loadingOrganization] = useOrganization();

    return (
        <SettingsSectionWide>
            {!organization || loadingOrganization ? (
                <Loader />
            ) : (
                <Addresses isOnlySelf={isOnlySelf} organization={organization} />
            )}
        </SettingsSectionWide>
    );
};

export default AddressesSection;
