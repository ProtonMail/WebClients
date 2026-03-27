import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getOsDownloadUrl } from '@proton/components/containers/vpn/ProtonVPNClientsSection/getOsDownloadUrl';
import { forkSession } from '@proton/components/containers/vpn/tv/forkSession';
import { getChildClientId } from '@proton/components/containers/vpn/tv/getChildClientId';
import { Loader, useActiveBreakpoint, useApi } from '@proton/components/index';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';

import Layout from '../../public/Layout';
import Main from '../../public/Main';
import desktopFailure from '../../public/desktopFailure.svg';
import desktopSuccess from '../../public/desktopSuccess.svg';
import mobileFailure from '../../public/mobileFailure.svg';
import mobileSuccess from '../../public/mobileSuccess.svg';

enum ForkSessionStep {
    FETCHING_CODE,
    DEVICE_CONNECTED,
    DEVICE_CONNECTION_ERROR,
}

const childClientId = getChildClientId();

const SignInCompleted = ({ isDesktop }: { isDesktop: boolean }) => (
    <>
        <div className="flex flex-column items-center mb-8">
            <img src={isDesktop ? desktopSuccess : mobileSuccess} alt="Success device for connection stablished" />
            <h1>{c('Info').t`Sign-in complete`}</h1>
            <span className="color-weak">{c('Info').t`You're now signed in on your TV.`}</span>
        </div>
        <hr className="w-full" />
        <div className="flex flex-column items-center gap-2 w-full mt-8">
            <span>{c('Info').t`Protect this device too?`}</span>
            <Link to={getOsDownloadUrl()} className="w-full">
                <Button fullWidth color="norm" shape="solid">{c('Info').t`Download ${VPN_APP_NAME}`}</Button>
            </Link>
        </div>
    </>
);

const SignInFailed = ({ isDesktop }: { isDesktop: boolean }) => (
    <div className="flex flex-column items-center mb-8">
        <img src={isDesktop ? desktopFailure : mobileFailure} alt="Failure device for connection stablishment." />
        <h1>{c('Info').t`Code expired`}</h1>
        <span className="color-weak">{c('Info').t`Create a new code on your TV and try again.`}</span>
    </div>
);

export const TvContainerSignedIn = () => {
    const api = useApi();
    const [step, setStep] = useState<ForkSessionStep>(ForkSessionStep.FETCHING_CODE);
    const { viewportWidth } = useActiveBreakpoint();
    const { code } = useParams<{ code: string }>();

    useEffect(() => {
        if (code) {
            forkSession(api, childClientId, code)
                .then(() => setStep(ForkSessionStep.DEVICE_CONNECTED))
                .catch(() => setStep(ForkSessionStep.DEVICE_CONNECTION_ERROR));
        }
    }, []);

    const isDesktop = viewportWidth['>=large'];

    return (
        <Layout toApp={APPS.PROTONVPN_SETTINGS} hasDecoration hasFooter={false} hasAppLogos={false}>
            <Main className="flex flex-column items-center justify-center">
                {step === ForkSessionStep.FETCHING_CODE && <Loader />}
                {step === ForkSessionStep.DEVICE_CONNECTED && <SignInCompleted isDesktop={isDesktop} />}
                {step === ForkSessionStep.DEVICE_CONNECTION_ERROR && <SignInFailed isDesktop={isDesktop} />}
            </Main>
        </Layout>
    );
};
