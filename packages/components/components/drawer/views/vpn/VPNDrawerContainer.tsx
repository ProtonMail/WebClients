import { useEffect } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';
import useStateRef from '@proton/hooks/useStateRef';
import {
    type ConnectionInformationResult,
    getConnectionInformation,
} from '@proton/shared/lib/api/core/connection-information';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MINUTE } from '@proton/shared/lib/constants';
import { VPN_HUB_URL } from '@proton/shared/lib/vpn/constants';

import DrawerAppScrollContainer from '../shared/DrawerAppScrollContainer';
import DrawerAppSection from '../shared/DrawerAppSection';
import GetVPNApp from './GetVPNApp';
import VPNFAQ from './VPNFAQ';
import VPNStatusDrawerApp from './VPNStatusDrawerApp';
import useVPNDrawerTelemetry from './useVPNDrawerTelemetry';

const EVERY_MINUTE = MINUTE;

const VPNDrawerContainer = () => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const [connectionInformation, setConnectionInformation, connectionInformationRef] =
        useStateRef<ConnectionInformationResult>();
    const { downloadIsClicked, statusChanged } = useVPNDrawerTelemetry();

    const downloadProtonVPN = () => {
        downloadIsClicked();
        window.open(VPN_HUB_URL, '_blank');
    };

    const fetchConnectionInformation = async () => {
        const result = await silentApi<ConnectionInformationResult>(getConnectionInformation());

        if (
            connectionInformationRef.current &&
            connectionInformationRef.current.IsVpnConnection !== result.IsVpnConnection
        ) {
            statusChanged();
        }

        setConnectionInformation(result);
    };

    useEffect(() => {
        const interval = setInterval(fetchConnectionInformation, EVERY_MINUTE);

        window.addEventListener('focus', fetchConnectionInformation);
        window.addEventListener('online', fetchConnectionInformation);

        void withLoading(fetchConnectionInformation());

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchConnectionInformation);
            window.removeEventListener('online', fetchConnectionInformation);
        };
    }, []);

    if (loading) {
        return <Loader />;
    }

    if (!connectionInformation) {
        return (
            <DrawerAppScrollContainer>
                <DrawerAppSection>
                    <p className="my-2">{c('Error')
                        .t`Unable to load VPN dashboard. Please check your connection and try again.`}</p>
                    <Button fullWidth className="mb-2" onClick={() => withLoading(fetchConnectionInformation())}>
                        {c('Action').t`Try again`}
                    </Button>
                </DrawerAppSection>
            </DrawerAppScrollContainer>
        );
    }

    return (
        <DrawerAppScrollContainer>
            <VPNStatusDrawerApp userSettings={userSettings} connectionInformation={connectionInformation} />
            <GetVPNApp onDownload={downloadProtonVPN} isVpnConnection={connectionInformation.IsVpnConnection} />
            <VPNFAQ isVpnConnection={connectionInformation.IsVpnConnection} />
        </DrawerAppScrollContainer>
    );
};

export default VPNDrawerContainer;
