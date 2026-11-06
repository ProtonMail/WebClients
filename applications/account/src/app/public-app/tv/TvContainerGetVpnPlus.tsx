import { useLocation } from 'react-router-dom';

import isDeepEqual from 'lodash/isEqual';

import { TvCheckout } from '@proton/vpn/components/tv/containers/TvCheckoutContainer';

import Layout from '../layout/Layout';
import Main from '../layout/Main';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { selectPaths } from '../state-machine/publicAppStateMachine';

export const TvContainerGetVpnPlus = () => {
    const location = useLocation();
    const paths = PublicAppContext.useSelector(selectPaths, isDeepEqual);
    const searchParams = new URLSearchParams(location.search);

    return (
        <Layout toApp="proton-vpn-settings" hasAppLogos hasFooter hasWelcome hasDecoration>
            <Main style={{ '--max-w-custom': '50rem' }}>
                <TvCheckout paths={paths} searchParams={searchParams} />
            </Main>
        </Layout>
    );
};
