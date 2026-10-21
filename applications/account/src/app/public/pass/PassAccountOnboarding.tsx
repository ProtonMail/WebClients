import { type FC, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { IcPassShieldOk } from '@proton/icons/icons/IcPassShieldOk';
import { clients } from '@proton/pass/clients';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { TwoColumns } from '@proton/pass/components/Onboarding/Layout/TwoColumns';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { ProbeState, useExtensionProbe } from '@proton/pass/components/Onboarding/useExtensionProbe';
import { getBrowserClient } from '@proton/pass/lib/extension/utils/browser';
import type { Maybe } from '@proton/pass/types/utils';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { PASS_WEB_APP_URL } from '@proton/shared/lib/pass/constants';

import { Footer } from '../../signupCtx/flows/pass/components/Footer';
import { getSignupFlow, measureSignupCtx } from '../../signupCtx/flows/pass/measure';
import { getTelemetryClientType } from '../../single-signup-v2/measure';
import { useMetaTags } from '../../useMetaTags';
import loginPng from './pass-account-onboarding-login.png';

export const PassAccountOnboarding: FC = () => {
    useMetaTags({
        title: c('Title').t`${PASS_APP_NAME}: Welcome`,
        description: c('Title').t`Unlock the power of autofill with ${PASS_APP_NAME} in your browser`,
    });

    const api = useApi();
    /** The signup email travels in the history state: kept out of the URL,
     * browser history sync and server logs */
    const location = useLocation<Maybe<{ email?: string }>>();
    const flow = useMemo(() => getSignupFlow(new URLSearchParams(location.search).get('flow')), [location.search]);

    const browserType = useMemo(getBrowserClient, []);
    const browser = browserType ? clients[browserType] : null;
    const browserName = browser?.title;

    const { state, link } = useExtensionProbe(location.state?.email ?? null);

    useEffect(() => {
        void measureSignupCtx(api, {
            flow,
            event: TelemetryAccountSignupEvents.onboardFinish,
            dimensions: { onboarding: 'new' },
        });
    }, []);

    const handleExtensionDownload = () => {
        const telemetryClientType = browserType ? getTelemetryClientType(browserType) : 'unknown';

        void measureSignupCtx(api, {
            flow,
            event: TelemetryAccountSignupEvents.interactDownload,
            dimensions: { click: `download_${telemetryClientType}`, onboarding: 'new' },
        });
    };

    const isAuth = state === ProbeState.AUTH && link;
    /** `AUTO_LOGIN` also means the extension is installed but signed out — its
     * `link` is the email-prefilled login. Without it here the extension is
     * reachable yet we'd fall through to `shouldInstall` and ask the user to
     * install what they already have. */
    const isUnauth = (state === ProbeState.UNAUTH || state === ProbeState.AUTO_LOGIN) && link;
    const shouldInstall = !isAuth && !isUnauth && browser;
    const buttonProps = {
        as: 'a',
        target: '_blank',
        size: 'large',
        color: 'norm',
        fullWidth: false,
        className: 'w-fit-content px-12',
    } as const;

    return (
        <Layout footer={<Footer />}>
            <TwoColumns>
                <div className="flex flex-column lg:flex-1 gap-8">
                    <h1 className="h2 text-semibold">
                        {c('Title').t`Unlock the power of autofill with ${PASS_APP_NAME} in your browser`}
                    </h1>
                    <div className="color-success bg-norm flex flex-row items-center gap-2 px-4 py-2 rounded-full w-fit-content text-xl">
                        <IcCheckmarkCircleFilled />
                        <span>{c('Title').t`Over 95% of users love our extension`}</span>
                    </div>
                    {isAuth && (
                        <OnboardingButton {...buttonProps} href={link}>
                            {c('Action').t`Start using ${PASS_APP_NAME}`}
                        </OnboardingButton>
                    )}
                    {isUnauth && (
                        <OnboardingButton {...buttonProps} href={link}>
                            {c('Action').t`Sign in to ${PASS_APP_NAME}`}
                        </OnboardingButton>
                    )}
                    {shouldInstall && (
                        <OnboardingButton {...buttonProps} href={browser.link} onClick={handleExtensionDownload}>
                            {browserName
                                ? c('Title').t`Add ${PASS_APP_NAME} to ${browserName}`
                                : c('Title').t`Add ${PASS_APP_NAME} to your browser`}
                        </OnboardingButton>
                    )}
                    <div className="flex flex-column gap-4 color-weak text-xl">
                        <p className="my-0 flex flex-row gap-2 items-center">
                            <IcClock />
                            <strong>{c('Title').t`Save time:`}</strong>
                            <span>{c('Description').t`Autofill logins instantly on any site`}</span>
                        </p>
                        <p className="my-0 flex flex-row gap-2 items-center">
                            <IcPassShieldOk />
                            <strong>{c('Title').t`Stay safe:`}</strong>
                            <span>{c('Description').t`Create strong password with one click`}</span>
                        </p>
                        <p className="my-0 flex flex-row gap-2 items-center">
                            <IcDesktop />
                            <strong>{c('Title').t`Stay connected:`}</strong>
                            <span>{c('Description').t`Access your passwords on all your devices`}</span>
                        </p>
                    </div>
                    <a href={PASS_WEB_APP_URL} target="_blank" className="color-weak text-xl w-fit-content">
                        {c('Title').t`Skip for now`}
                    </a>
                </div>
                <div className="lg:flex-1 flex justify-center items-center">
                    <img src={loginPng} alt="" width="482" />
                </div>
            </TwoColumns>
        </Layout>
    );
};
