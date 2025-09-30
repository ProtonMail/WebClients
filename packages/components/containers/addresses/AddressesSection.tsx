import { useOrganization } from '@proton/account/organization/hooks';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [organization, loadingOrganization] = useOrganization();
    const hasAccessToBYOE = useBYOEFeatureStatus();

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
