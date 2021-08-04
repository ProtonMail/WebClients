import { Loader } from '../../components';
import { useOrganization } from '../../hooks';
import { SettingsSectionWide } from '../account';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [organization, loadingOrganization] = useOrganization();

    return (
        <SettingsSectionWide>
            {loadingOrganization ? <Loader /> : <Addresses isOnlySelf={isOnlySelf} organization={organization} />}
        </SettingsSectionWide>
    );
};

export default AddressesSection;
