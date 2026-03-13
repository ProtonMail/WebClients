import { Link, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import Layout from './Layout';
import Main from './Main';
import SupportDropdown from './SupportDropdown';
import tvLogo from './tv.svg';

export const TvContainerNotSignedIn = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    return (
        <Layout toApp="proton-vpn-settings" hasDecoration hasAppLogos={false} hasFooter={false}>
            <Main className="flex flex-column gap-4 p-4 w-auto" style={{ 'justify-self': 'center' }}>
                <img src={tvLogo} alt="tv image" />
                <span className="h3 text-bold text-center">{c('Title').t`Sign in on TV`}</span>
                <span className="color-weak text-center">
                    {c('Info').t`Complete the sign-in on this device to start using ${VPN_APP_NAME} on your TV.`}
                </span>
                <div className="flex flex-column gap-4 items-center">
                    <Link className="w-full" to={`/signup?${searchParams.toString()}`}>
                        <Button fullWidth color="norm" shape="solid">{c('Info').t`Create an account`}</Button>
                    </Link>
                    <Link className="w-full" to={`/login?${searchParams.toString()}`}>
                        <Button fullWidth shape="outline">{c('Info').t`Sign in`}</Button>
                    </Link>
                    <SupportDropdown
                        buttonClassName="mx-auto link link-focus"
                        content={c('Link').t`Trouble signing in?`}
                    >
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
                </div>
            </Main>
        </Layout>
    );
};
