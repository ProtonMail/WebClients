import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import useLoading from '@proton/hooks/useLoading';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import signOutOfAllDevices from '@proton/styles/assets/img/illustrations/sign-out-devices.svg';
import signedOutOfAllDevices from '@proton/styles/assets/img/illustrations/signed-out-devices.svg';
import noop from '@proton/utils/noop';

import { signOutAllExternalSessions } from './api';

const STEPS = {
    INIT: 'INIT',
    SIGNED_OUT: 'SIGNED_OUT',
};

const providerName = BRAND_NAME;
function SignedOutSection() {
    const [user] = useUser();
    return (
        <div className="flex flex-column items-center justify-center gap-6">
            <img src={signedOutOfAllDevices} width="172" height="124" alt="" />
            <h1 className="text-bold text-2xl">{c('Title').t`Other devices signed out`}</h1>
            <p className="m-0 text-center">
                {c('Description').t`Your other sessions have been ended. You can now sign in on this device.`}
                <br />
                <br />
                {user.canPay && c('Description').t`Upgrade anytime to stay signed in on multiple devices.`}
            </p>
            <div className="flex gap-2">
                <ButtonLike color="norm" fullWidth as={Href} href={SSO_PATHS.LOGIN} target={'_self'}>{c('Action')
                    .t`Sign in to ${providerName}`}</ButtonLike>
                {user.canPay && (
                    <ButtonLike as={Href} href={'/lite?action=subscribe-account'} target={'_self'} fullWidth>{c(
                        'Action'
                    ).t`Upgrade to 2 devices or more`}</ButtonLike>
                )}
            </div>
        </div>
    );
}

interface SignOutContentProps {
    onSignOut: () => void;
    submitting: boolean;
}
function SignOutSection({ onSignOut, submitting }: SignOutContentProps) {
    const [user] = useUser();

    return (
        <div className="flex flex-column items-center justify-center gap-6">
            <img src={signOutOfAllDevices} width="172" height="124" alt="" />
            <h1 className="text-bold text-2xl">{c('Title').t`Sign out on all devices?`}</h1>
            <p className="m-0 text-center">
                {c('Description')
                    .t`Too many devices are connected to your account. To use ${BRAND_NAME} on a new device or browser, end all existing sessions. You'll be signed out on every device.`}
                <br />
                <br />
                {user.canPay && c('Description').t`To stay signed in everywhere, upgrade your plan instead.`}
            </p>
            <div className="flex gap-2">
                <Button color="norm" loading={submitting} fullWidth onClick={onSignOut}>{c('Action')
                    .t`Sign out on all devices`}</Button>
                {user.canPay && (
                    <ButtonLike as={Href} href={'/lite?action=subscribe-account'} target={'_self'} fullWidth>{c(
                        'Action'
                    ).t`Upgrade to 2 devices or more`}</ButtonLike>
                )}
            </div>
        </div>
    );
}

interface Props {
    initialHashParams: URLSearchParams;
}
export function SignOutContent({ initialHashParams }: Props) {
    const [step, setStep] = useState(STEPS.INIT);
    const [loading, withLoading] = useLoading();

    const api = useApi();
    const { createNotification } = useNotifications();

    const handleSignOut = async () => {
        const jwt = initialHashParams.get(ForkSearchParameters.Token);
        if (!jwt) {
            createNotification({ type: 'error', text: c('Error').t`Something went wrong, please try again` });
            return;
        }
        // Errors from `api` already surface a notification through the api listener
        await api(signOutAllExternalSessions(jwt));
        setStep(STEPS.SIGNED_OUT);
    };

    return (
        <div className="border p-11 rounded-xl">
            {step === STEPS.INIT && (
                <SignOutSection submitting={loading} onSignOut={() => withLoading(handleSignOut).catch(noop)} />
            )}
            {step === STEPS.SIGNED_OUT && <SignedOutSection />}
        </div>
    );
}
