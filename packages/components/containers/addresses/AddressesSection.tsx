import { useOrganization } from '@proton/account/organization/hooks';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
    app?: APP_NAMES;
}

const AddressesSection = ({ isOnlySelf, app }: Props) => {
    const [organization, loadingOrganization] = useOrganization();
    const hasAccessToBYOE = useBYOEFeatureStatus();

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
