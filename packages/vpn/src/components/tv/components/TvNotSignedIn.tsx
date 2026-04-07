import { Link, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import tvLogo from '../assets/tv.svg';

export const TvNotSignedIn = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    return (
        <>
            <img src={tvLogo} alt="tv image" role="presentation" />
            <span className="h3 text-bold text-center">{c('Title').t`Sign in on TV`}</span>
            <span className="color-weak text-center">
                {c('Info').t`Complete the sign-in on this device to start using ${VPN_APP_NAME} on your TV.`}
            </span>
            <div className="flex flex-column gap-4 items-center">
                <Link className="w-full" to={`/vpn/signup?${searchParams.toString()}`}>
                    <Button fullWidth color="norm" shape="solid">{c('Info').t`Create an account`}</Button>
                </Link>
                <Link className="w-full" to={`/login?${searchParams.toString()}`}>
                    <Button fullWidth shape="outline">{c('Info').t`Sign in`}</Button>
                </Link>
            </div>
        </>
    );
};
