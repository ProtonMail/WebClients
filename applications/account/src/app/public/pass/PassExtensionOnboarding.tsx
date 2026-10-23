import { type FC, useEffect, useState } from 'react';

import { useFlagsStatus } from '@unleash/proxy-client-react';
import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import {
    ProbeState,
    getLoginUrl,
    getSignupForkUrl,
    useExtensionProbe,
} from '@proton/pass/components/Onboarding/useExtensionProbe';
import { TelemetryMeasurementGroups, TelemetryPassExtensionEvents } from '@proton/shared/lib/api/telemetry';
import { ACCOUNT_APP_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isSafari, replaceUrl } from '@proton/shared/lib/helpers/browser';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { PassExtensionOnboardingPinStep } from './PassExtensionOnboardingPinStep';
import connectIllustration from './pass-extension-onboarding-connect-illustration.svg';

/** The old onboarding ends signup on the extension install step: only the
 * signup fork gets the new account signed in to the extension.
 * Apple store rules: Safari signups stay on the free plan. */
const getSignupUrl = (newOnboarding: boolean) => {
    if (!newOnboarding) {
        return getSignupForkUrl();
    }
    return isSafari() ? '/pass/signup?plan=free' : '/pass/signup?mode=ctx';
};

const PassExtensionOnboardingContent: FC = () => {
    const api = useApi();
    const { state, link, pinned } = useExtensionProbe();
    const newOnboardingFlag = useFlag('PassAccountNewOnboarding');
    const [pinStepDone, setPinStepDone] = useState(false);

    const isAuth = state === ProbeState.AUTH && link;
    /** Installed but signed out — the probe `link` is the sign-in URL,
     * email-prefilled when the signup email is known (`AUTO_LOGIN`). */
    const isUnauth = (state === ProbeState.UNAUTH || state === ProbeState.AUTO_LOGIN) && link;

    const buttonProps = {
        as: 'a',
        target: '_blank',
        size: 'large',
        color: 'norm',
        fullWidth: false,
        className: 'w-fit-content px-12',
    } as const;

    useEffect(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: TelemetryPassExtensionEvents.pass_extension_installed,
            dimensions: { onboarding: newOnboardingFlag ? 'new' : 'old' },
            delay: false,
        }).catch(noop);
    }, []);

    // Show pin step if not new onboarding and not already pinned
    const showPinStep = !newOnboardingFlag && !pinStepDone && pinned !== 'pinned';

    useEffect(() => {
        if (showPinStep) {
            return;
        }
        if (state === ProbeState.AUTO_LOGIN && link) {
            replaceUrl(link);
        }
    }, [state, showPinStep]);

    const handlePinStepContinue = () => setPinStepDone(true);

    if (showPinStep) {
        return <PassExtensionOnboardingPinStep onContinue={handlePinStepContinue} />;
    }

    return (
        <Layout>
            <div className="flex flex-column gap-8 items-center">
                <img src={connectIllustration} alt="" className="mt-20" width="200" />
                <h1 className="h2 text-semibold">{c('Title').t`Connect your ${ACCOUNT_APP_NAME}`}</h1>
                <div className="flex flex-column gap-4 items-center">
                    {isAuth ? (
                        <OnboardingButton {...buttonProps} href={link}>
                            {c('Action').t`Start using ${PASS_APP_NAME}`}
                        </OnboardingButton>
                    ) : (
                        <OnboardingButton {...buttonProps} href={isUnauth ? link : getLoginUrl(null)}>
                            {c('Action').t`Sign in to ${PASS_APP_NAME}`}
                        </OnboardingButton>
                    )}
                    <OnboardingButton
                        {...buttonProps}
                        variant="outline"
                        shape="outline"
                        href={getSignupUrl(newOnboardingFlag)}
                    >
                        {c('Action').t`Create a ${ACCOUNT_APP_NAME}`}
                    </OnboardingButton>
                </div>
            </div>
        </Layout>
    );
};

export const PassExtensionOnboarding: FC = () => {
    const { flagsReady } = useFlagsStatus();

    if (!flagsReady) {
        return (
            <Layout>
                <CircleLoader size="large" className="color-primary" />
            </Layout>
        );
    }

    return <PassExtensionOnboardingContent />;
};
