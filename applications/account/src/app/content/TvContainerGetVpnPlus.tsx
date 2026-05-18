import { TvCheckout } from '@proton/vpn/components/tv';

import Layout from '../public/Layout';
import Main from '../public/Main';
import type { Paths } from './helper';

export const TvContainerGetVpnPlus = ({ searchParams, paths }: { searchParams: URLSearchParams; paths: Paths }) => {
    return (
        <Layout toApp="proton-vpn-settings" hasAppLogos hasFooter hasWelcome hasDecoration>
            <Main style={{ '--max-w-custom': '50rem' }}>
                <TvCheckout paths={paths} searchParams={searchParams} />
            </Main>
        </Layout>
    );
};
