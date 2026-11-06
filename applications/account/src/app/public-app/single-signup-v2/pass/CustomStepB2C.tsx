import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useFlagsStatus } from '@unleash/proxy-client-react';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref, getClientID } from '@proton/shared/lib/apps/helper';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS, PASS_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { handleDone } from '../../signup/signupActions';
import Layout from '../Layout';
import Step2 from '../Step2';
import MnemonicRecoveryStep from '../defaultCustomStep/recovery/MnemonicRecoveryStep';
import type { SignupCustomStepProps } from '../interface';
import InstallExtensionStep from './InstallExtensionStep';

enum Step {
    Recovery = 0,
    Install = 1,
    Loading = 2,
    Redirect = 3,
    NewOnboarding = 4,
}

const CustomStepB2CContent = ({
    measure,
    setupImg,
    productAppName,
    fork,
    onSetup,
    logo,
    model,
}: SignupCustomStepProps) => {
    const mnemonicData = model.cache?.setupData?.mnemonicData;
    const accountData = model.cache?.type === 'signup' ? model.cache.accountData : undefined;

    const history = useHistory();
    const newOnboardingFlag = useFlag('PassAccountNewOnboarding');

    useEffect(() => {
        void measure({ event: TelemetryAccountSignupEvents.onboardingStart, dimensions: {} });
    }, []);

    const getNextPassStep = () => {
        if (model.source === getClientID(APPS.PROTONPASS)) {
            return Step.Redirect;
        }

        /** The new onboarding runs its own extension probe and renders a
         * different CTA per outcome, so it supersedes the installed check.
         * `fork` stays on `Step.Loading`: that branch owns `onSetup`, which
         * satisfies the pending session fork. */
        if (newOnboardingFlag && !fork) {
            return Step.NewOnboarding;
        }

        if (!model.extension?.installed) {
            return Step.Install;
        }

        return Step.Loading;
    };

    const [step, setStep] = useState(() => {
        if (mnemonicData) {
            return Step.Recovery;
        }
        return getNextPassStep();
    });

    useEffect(() => {
        if (step !== Step.NewOnboarding) {
            return;
        }

        const address = accountData?.email || (accountData && `${accountData.username}@${accountData.domain}`);
        history.replace(
            `${SSO_PATHS.PASS_ACCOUNT_ONBOARDING}?flow=pass_signup_v2`,
            address ? { email: address } : undefined
        );
    }, [step]);

    return (
        <Layout logo={logo} hasDecoration={false}>
            {step === Step.Recovery && (
                <MnemonicRecoveryStep
                    accountData={accountData}
                    onMeasureClick={(type) => {
                        void measure({
                            event: TelemetryAccountSignupEvents.interactRecoveryKit,
                            dimensions: { click: type },
                        });
                    }}
                    mnemonicData={mnemonicData!}
                    onContinue={() => setStep(getNextPassStep())}
                />
            )}
            {step === Step.Install && (
                <InstallExtensionStep
                    measure={measure}
                    onSkip={() => {
                        setStep(Step.Recovery);
                    }}
                />
            )}
            {step === Step.Loading && (
                <Step2
                    img={setupImg}
                    product={productAppName}
                    steps={[
                        fork
                            ? c('pass_signup_2023: Info').t`Signing in to ${PASS_APP_NAME}`
                            : c('pass_signup_2023: Info').t`Launching ${PASS_APP_NAME}`,
                    ]}
                    logo={logo}
                    onSetup={async () => {
                        if (!model.extension?.installed) {
                            return;
                        }

                        await measure({
                            event: TelemetryAccountSignupEvents.onboardShown,
                            dimensions: { action_shown: 'extension_installed' },
                        });

                        await measure({
                            event: TelemetryAccountSignupEvents.onboardFinish,
                            dimensions: {},
                        });

                        if (fork) {
                            if (!model.cache) {
                                throw new Error('Missing cache');
                            }
                            if (model.cache.type === 'user') {
                                await onSetup(model.cache);
                            } else {
                                const signupActionResponse = handleDone({ cache: model.cache });
                                await onSetup({ type: 'signup', payload: signupActionResponse });
                            }
                        }

                        await sendExtensionMessage(
                            { type: 'pass-onboarding' },
                            { app: APPS.PROTONPASSBROWSEREXTENSION, maxTimeout: 1_000 }
                        ).catch(noop);
                    }}
                />
            )}
            {step === Step.Redirect && (
                <Step2
                    steps={[c('pass_signup_2023: Info').t`Launching ${PASS_APP_NAME}`]}
                    img={setupImg}
                    product={productAppName}
                    logo={logo}
                    onSetup={async () => {
                        const localID = (() => {
                            if (model.cache?.type === 'user') {
                                return model.cache.session.resumedSessionResult.localID;
                            } else if (model.cache?.type === 'signup') {
                                return model.cache.setupData?.authResponse.LocalID;
                            }
                        })();

                        await measure({
                            event: TelemetryAccountSignupEvents.onboardFinish,
                            dimensions: {},
                        });

                        await wait(1_500);

                        document.location.assign(getAppHref('/', APPS.PROTONPASS, localID));
                    }}
                />
            )}
        </Layout>
    );
};

/** The sub-step is latched in `useState`, so the flag has to be resolved before
 * the content mounts — otherwise an unresolved flag pins the user to the old
 * install step for the rest of the flow, with no re-render to correct it. */
const CustomStepB2C = (props: SignupCustomStepProps) => {
    const { flagsReady } = useFlagsStatus();

    if (!flagsReady) {
        return (
            <Layout logo={props.logo} hasDecoration={false}>
                <CircleLoader size="large" className="color-primary" />
            </Layout>
        );
    }

    return <CustomStepB2CContent {...props} />;
};

export default CustomStepB2C;
