import { useOrganization } from '@proton/account/organization/hooks';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';

import Loader from '../../components/loader/Loader';
import SettingsSectionWide from '../account/SettingsSectionWide';
import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [organization, loadingOrganization] = useOrganization();
    const [hasAccessToBYOE] = useBYOEFeatureStatus();

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
