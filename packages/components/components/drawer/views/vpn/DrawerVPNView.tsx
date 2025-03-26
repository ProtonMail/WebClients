import { Suspense, lazy } from 'react';

import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DrawerView from '@proton/components/components/drawer/views/DrawerView';
import Loader from '@proton/components/components/loader/Loader';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import './DrawerVPNView.scss';

const VPNDrawerContainer = lazy(() => import(/* webpackChunkName: "VPNDrawerContainer" */ './VPNDrawerContainer'));

const DrawerVPNView = () => {
    const tab: SelectedDrawerOption = {
        text: VPN_APP_NAME,
        value: 'vpn',
    };

    return (
        <DrawerView tab={tab} id="drawer-app-vpn" className="drawer-vpn-view bg-lowered">
            <Suspense fallback={<Loader size="large" />}>
                <VPNDrawerContainer />
            </Suspense>
        </DrawerView>
    );
};

export default DrawerVPNView;
