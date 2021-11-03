import { c } from 'ttag';
import { ProtonVPNClientsSection, SettingsPropsShared } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';
import VpnUpgradeSection from './VpnUpgradeSection';

export const getDownloadsPage = () => {
    return {
        text: c('Title').t`VPN apps`,
        to: '/vpn/vpn-apps',
        icon: 'arrow-down-to-rectangle',
        subsections: [
            {
                text: '',
                id: '',
            },
            {
                text: c('Title').t`ProtonVPN`,
                id: 'protonvpn-clients',
            },
        ],
    };
};

const VpnDownloadSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDownloadsPage()}
            setActiveSection={setActiveSection}
        >
            <VpnUpgradeSection />
            <ProtonVPNClientsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default VpnDownloadSettings;
