import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { IcKey } from '@proton/icons/icons/IcKey';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { TvNotSignedIn } from '@proton/vpn/components/tv';

import Layout from '../../public/Layout';
import Main from '../../public/Main';
import SupportDropdown from '../../public/SupportDropdown';

export const TvContainerNotSignedIn = () => {
    return (
        <Layout toApp="proton-vpn-settings" hasDecoration hasAppLogos={false} hasFooter={false}>
            <Main className="flex flex-column gap-4 p-4 w-auto" style={{ 'justify-self': 'center' }}>
                <TvNotSignedIn />
                <SupportDropdown buttonClassName="mx-auto link link-focus" content={c('Link').t`Trouble signing in?`}>
                    <Link
                        to={'/reset-password'}
                        className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                    >
                        <IcKey />
                        {c('Link').t`Forgot password?`}
                    </Link>
                    <Link
                        to={'/forgot-username'}
                        className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                    >
                        <IcUserCircle />
                        {c('Link').t`Forgot username?`}
                    </Link>
                </SupportDropdown>
            </Main>
        </Layout>
    );
};
