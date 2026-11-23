import { Suspense, lazy } from 'react';

import { Loader } from '@proton/atoms/Loader/Loader';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import type { SelectedDrawerOption } from '../DrawerView';
import DrawerView from '../DrawerView';

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
