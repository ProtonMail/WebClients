import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref, getClientID } from '@proton/shared/lib/apps/helper';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { handleDone } from '../../signup/signupActions';
import Layout from '../Layout';
import Step2 from '../Step2';
import type { SignupCustomStepProps } from '../interface';
import InstallExtensionStep from './InstallExtensionStep';
import MnemonicRecoveryStep from './MnemonicRecoveryStep';

enum Step {
    Recovery,
    Install,
    Loading,
    Redirect,
}

const CustomStepB2C = ({ measure, setupImg, productAppName, fork, onSetup, logo, model }: SignupCustomStepProps) => {
    const mnemonicData = model.cache?.setupData?.mnemonicData;

    useEffect(() => {
        void measure({ event: TelemetryAccountSignupEvents.onboardingStart, dimensions: {} });
    }, []);

    const getNextPassStep = () => {
        if (model.source === getClientID(APPS.PROTONPASS)) {
            return Step.Redirect;
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

    return (
        <Layout logo={logo} hasDecoration={false}>
            {step === Step.Recovery && (
                <MnemonicRecoveryStep
                    onMeasureClick={(type) => {
                        void measure({
                            event: TelemetryAccountSignupEvents.interactRecoveryKit,
                            dimensions: { click: type },
                        });
                    }}
                    mnemonic={mnemonicData!}
                    onContinue={async () => setStep(getNextPassStep())}
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
                                return model.cache.session.localID;
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

export default CustomStepB2C;
