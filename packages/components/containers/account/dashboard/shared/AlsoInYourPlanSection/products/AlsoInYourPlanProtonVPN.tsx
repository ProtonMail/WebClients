import { useContext } from 'react';

import { c } from 'ttag';

import VpnLogo from '@proton/components/components/logo/VpnLogo';
import {
    getVPNLightningFastSpeedFeature,
    getVPNPaidCountriesFeature,
    getVPNPaidServersFeature,
} from '@proton/components/containers/payments/features/vpn';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { AlsoInYourPlanSectionContext } from '../AlsoInYourPlanSection';
import AlsoInYourPlanSectionCard from '../AlsoInYourPlanSectionCard';
import vpn from '../illustrations/vpn.jpg';

const AlsoInYourPlanProtonVPN = () => {
    const planSectionContext = useContext(AlsoInYourPlanSectionContext);
    const [vpnServerCount] = useVPNServersCount();

    if (!planSectionContext || !vpnServerCount) {
        return null;
    }

    const { app, isBundlePlan } = planSectionContext;

    const cardConfig = {
        app: APPS.PROTONVPN_SETTINGS,
        copy: () => c('Dashboard').t`Experience true freedom online and safeguard your privacy.`,
        image: vpn,
        buttonCopy: () => goToPlanOrAppNameText(VPN_APP_NAME),
        logo: <VpnLogo />,
        features: [
            getVPNPaidCountriesFeature(vpnServerCount),
            getVPNPaidServersFeature(vpnServerCount),
            getVPNLightningFastSpeedFeature(),
        ],
    };

    return <AlsoInYourPlanSectionCard app={app} config={cardConfig} shouldDisplayAllFeatures={isBundlePlan} />;
};

export default AlsoInYourPlanProtonVPN;
