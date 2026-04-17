import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { getOsDownloadUrl } from '@proton/components/containers/vpn/ProtonVPNClientsSection/getOsDownloadUrl';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import desktopSuccess from '../assets/desktopSuccess.svg';
import mobileSuccess from '../assets/mobileSuccess.svg';

export const TvSignInCompleted = () => {
    return (
        <>
            <div className="flex flex-column items-center mb-8">
                <picture>
                    <source media="(min-width: 64em)" srcSet={desktopSuccess} />
                    <img src={mobileSuccess} alt="Success device for connection stablished" role="presentation" />
                </picture>
                <h1 className="text-center">{c('Info').t`Sign-in complete`}</h1>
                <span className="color-weak">{c('Info').t`You're now signed in on your TV.`}</span>
            </div>
            <hr className="w-full" />
            <div className="flex flex-column items-center gap-2 w-full mt-8">
                <span>{c('Info').t`Protect this device too?`}</span>
                <Href href={getOsDownloadUrl()} className="w-full">
                    <Button fullWidth color="norm" shape="solid">{c('Info').t`Download ${VPN_APP_NAME}`}</Button>
                </Href>
            </div>
        </>
    );
};
