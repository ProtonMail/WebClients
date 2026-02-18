import type { FC, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import { PassLogo, useApi, useNotifications } from '@proton/components';
import { TelemetryMeasurementGroups, TelemetryPassExtensionEvents } from '@proton/shared/lib/api/telemetry';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS, BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import passIconIcon from '@proton/styles/assets/img/pass/protonpass-icon.svg';
import noop from '@proton/utils/noop';

import { SetTheme } from '../../content/theme/SetTheme';
import Layout from '../Layout';
import Main from '../Main';
import connectIllustration from './pass-extension-onboarding-connect-illustration.svg';
import extensionMenuIcon from './pass-extension-onboarding-menu.svg';
import pinTutorialGif from './pass-extension-onboarding-pin-tutorial.gif';
import extensionPinIcon from './pass-extension-onboarding-pin.svg';

import './PassExtensionOnboarding.scss';

const getSteps = () => [
    {
        key: 'open',
        icon: extensionMenuIcon,
        description: c('Info').t`Open the Extensions menu`,
    },
    {
        key: 'pin',
        icon: extensionPinIcon,
        description: c('Info').t`Pin ${PASS_APP_NAME} to your toolbar`,
    },
    {
        key: 'access',
        icon: passIconIcon,
        description: c('Info').t`Click the icon to open it anytime.`,
    },
];

const PassThemeLayout: FC<PropsWithChildren> = ({ children }) => (
    <>
        <SetTheme theme={ThemeTypes.PassDark} />
        <Layout toApp={APPS.PROTONPASS}>
            <Main>{children}</Main>
        </Layout>
    </>
);

const PassExtensionOnboarding: FC = () => {
    const api = useApi();
    const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null);
    const [currentStep, setCurrentStep] = useState<'pinning' | 'authentication'>(
        isSafari() ? 'authentication' : 'pinning'
    );
    const { createNotification } = useNotifications();

    // Get fork URLs passed by Pass extension.
    const searchParams = new URLSearchParams(window.location.search);
    const loginUrl = searchParams.get('loginUrl');
    const signupUrl = searchParams.get('signupUrl');

    const helpUrl = (() => {
        if (isSafari()) {
            return 'https://proton.me/support/pass-setup#Safari';
        }
        if (isFirefox()) {
            return 'https://proton.me/support/pass-setup#How-to-install-Proton-Pass-for-Firefox';
        }
        return 'https://proton.me/support/pass-setup';
    })();

    useEffect(() => {
        sendExtensionMessage({ type: 'pass-installed' }, { app: APPS.PROTONPASSBROWSEREXTENSION, maxTimeout: 2000 })
            .then((response) => {
                setExtensionDetected(response.type === 'success');
            })
            .catch(() => {
                setExtensionDetected(false);
            });

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: TelemetryPassExtensionEvents.pass_extension_installed,
            delay: false,
        }).catch(noop);
    }, []);

    const handleContinue = () => {
        setCurrentStep('authentication');
    };

    const handleSignIn = () => {
        if (loginUrl) {
            window.location.href = loginUrl;
        } else {
            // Should not happen unless user manually removed the url params
            createNotification({
                text: c('Warning')
                    .t`Could not login. Please open ${PASS_APP_NAME} browser extension and login from there.`,
                type: 'warning',
            });
        }
    };

    const handleSignUp = () => {
        if (signupUrl) {
            window.location.href = signupUrl;
        } else {
            createNotification({
                text: c('Warning')
                    .t`Could not sign up. Please open ${PASS_APP_NAME} browser extension and sign up from there.`,
                type: 'warning',
            });
        }
    };

    const steps = getSteps();

    if (extensionDetected === null) {
        return (
            <PassThemeLayout>
                <div className="text-center">
                    <CircleLoader size="large" />
                    <div className="text-lg mt-4 text-bold">{c('Info')
                        .t`Verifying ${PASS_APP_NAME} browser extension...`}</div>
                </div>
            </PassThemeLayout>
        );
    }

    // Could not communicate with extension.
    // May happen on Safari or Firefox if permission was not granted.
    if (extensionDetected === false) {
        return (
            <PassThemeLayout>
                <h1 className="h3 text-bold mb-4">{c('Title').t`${PASS_APP_NAME} is missing permissions`}</h1>
                <div className="text-lg mb-6">
                    {c('Info')
                        .t`Please open your browser extension settings and allow ${PASS_APP_NAME} extension to access website data. Then, reload this page.`}{' '}
                    <Href href={helpUrl} className="text-underline text-no-cut" key="learn-more-link">
                        {c('Link').t`Learn more`}
                    </Href>
                </div>
                <div className="flex justify-center">
                    <Button color="norm" size="large" onClick={() => location.reload()}>
                        {c('Action').t`Reload page`}
                    </Button>
                </div>
            </PassThemeLayout>
        );
    }

    return (
        <>
            <SetTheme theme={ThemeTypes.PassDark} />
            <div className="pass-onboarding ui-prominent w-full min-h-custom mw" style={{ '--min-h-custom': '100vh' }}>
                <div className="m-auto p-14 color-norm flex justify-center">
                    <div className="pass-onboarding--gradient"></div>
                    <div className="flex flex-column">
                        <div className="flex flex-column">
                            <PassLogo />
                            <h1 className="pass-onboarding--white-text mt-4 mb-8 text-semibold">
                                {c('Title').jt`Welcome to your new password manager!`}
                            </h1>
                        </div>

                        {!isSafari() && (
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-bold">
                                    {currentStep === 'pinning' ? c('Info').t`Step 1 of 2` : c('Info').t`Step 2 of 2`}
                                </span>
                                <hr className="pass-onboarding--white-separator my-2 flex flex-auto" />
                            </div>
                        )}

                        <div className="mx-auto flex justify-center flex-nowrap flex-column lg:flex-row gap-12">
                            {currentStep === 'pinning' && (
                                <>
                                    <div className="flex flex-nowrap flex-column">
                                        <h2 className="text-3xl pass-onboarding--white-text mb-4 text-bold">
                                            {c('Title').jt`Pin the extension`}
                                        </h2>
                                        <h2 className="text-xl mb-5">
                                            {c('Info').t`For easy access to your passwords and more.`}
                                        </h2>

                                        <div className="mb-1">
                                            <ol className="unstyled m-0">
                                                {steps.map(({ key, icon, description }, idx) => (
                                                    <li key={key} className="flex mb-5 items-center">
                                                        <div
                                                            className="pass-onboarding--dot rounded-50 text-center mr-3 relative"
                                                            aria-hidden="true"
                                                        >
                                                            <span className="absolute inset-center">{idx + 1}</span>
                                                        </div>
                                                        <div
                                                            className="w-custom text-center mr-2"
                                                            style={{ '--w-custom': '2.5rem' }}
                                                            aria-hidden="true"
                                                        >
                                                            <img
                                                                src={icon}
                                                                className="h-custom"
                                                                style={{ '--h-custom': '1.5rem' }}
                                                                alt={BRAND_NAME}
                                                            />
                                                        </div>

                                                        <div className="flex-1 text-left">{description}</div>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                        <Button
                                            pill
                                            size="large"
                                            shape="solid"
                                            color="norm"
                                            className="mt-5 mb-2 w-full"
                                            onClick={handleContinue}
                                            aria-label={c('Action').t`Continue`}
                                        >
                                            <span className="flex justify-center px-4">{c('Action').t`Continue`}</span>
                                        </Button>
                                    </div>

                                    <div className="flex">
                                        <img src={pinTutorialGif} alt="" width="325" />
                                    </div>
                                </>
                            )}

                            {currentStep === 'authentication' && (
                                <>
                                    <div className="flex flex-nowrap flex-column">
                                        <h2 className="text-3xl pass-onboarding--white-text mb-4 text-bold">
                                            {c('Title').jt`Connect your ${BRAND_NAME} Account`}
                                        </h2>
                                        <h2 className="text-xl mb-5">
                                            {c('Info').t`Sign in or create an account to continue.`}
                                        </h2>
                                        <Button
                                            pill
                                            shape="solid"
                                            color="norm"
                                            className="mb-2"
                                            onClick={handleSignIn}
                                            aria-label={c('Action').t`Sign in`}
                                        >
                                            <span className="flex justify-center px-4">
                                                {c('Action').t`Connect your ${BRAND_NAME} Account`}
                                            </span>
                                        </Button>
                                        <Button
                                            pill
                                            shape="outline"
                                            color="weak"
                                            onClick={handleSignUp}
                                            aria-label={c('Action').t`Create an account`}
                                        >
                                            <span className="flex justify-center px-4">
                                                {c('Action').t`Create a ${BRAND_NAME} Account`}
                                            </span>
                                        </Button>
                                    </div>

                                    <div className="flex justify-center items-center">
                                        <img
                                            src={connectIllustration}
                                            alt=""
                                            className="pass-onboarding--connect-illustration"
                                            width="428"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PassExtensionOnboarding;
