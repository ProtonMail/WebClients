import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import Layout from '../Layout';
import Step2 from '../Step2';
import { SignupCustomStepProps } from '../interface';
import CopyRecoveryStep from './CopyRecoveryStep';
import InstallExtensionStep from './InstallExtensionStep';
import PDFRecoveryStep from './PDFRecoveryStep';

enum Step {
    Recovery,
    Install,
    Loading,
}

const CustomStep = ({
    theme,
    measure,
    setupImg,
    productAppName,
    fork,
    onSetup,
    logo,
    model,
}: SignupCustomStepProps) => {
    const mnemonicData = model.cache?.setupData?.mnemonicData;

    useEffect(() => {
        measure({ event: TelemetryAccountSignupEvents.onboardingStart, dimensions: {} });
    }, []);

    const maybeTriggerExtension = () => {
        if (!model.extension?.installed) {
            return Step.Install;
        }
        return Step.Loading;
    };

    const [step, setStep] = useState(() => {
        if (mnemonicData) {
            return Step.Recovery;
        }
        return maybeTriggerExtension();
    });

    const isBrokenBlobDownload = isIos() || isIpad();

    return (
        <>
            {step === Step.Recovery &&
                (() => {
                    if (isBrokenBlobDownload) {
                        return (
                            <Layout theme={theme} logo={logo} hasDecoration={false}>
                                <CopyRecoveryStep
                                    onMeasureClick={(type) => {
                                        measure({
                                            event: TelemetryAccountSignupEvents.interactRecoveryKit,
                                            dimensions: { click: type },
                                        });
                                    }}
                                    mnemonic={mnemonicData!}
                                    onContinue={async () => {
                                        setStep(maybeTriggerExtension());
                                    }}
                                />
                            </Layout>
                        );
                    }
                    return (
                        <Layout theme={theme} logo={logo} hasDecoration={false}>
                            <PDFRecoveryStep
                                onMeasureClick={(type) => {
                                    measure({
                                        event: TelemetryAccountSignupEvents.interactRecoveryKit,
                                        dimensions: { click: type },
                                    });
                                }}
                                mnemonic={mnemonicData!}
                                onContinue={async () => {
                                    setStep(maybeTriggerExtension());
                                }}
                            />
                        </Layout>
                    );
                })()}
            {step === Step.Install && (
                <Layout theme={theme} logo={logo} hasDecoration={false}>
                    <InstallExtensionStep
                        measure={measure}
                        onSkip={() => {
                            setStep(Step.Recovery);
                        }}
                    />
                </Layout>
            )}
            {step === Step.Loading && (
                <Step2
                    theme={theme}
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
                            await onSetup(model.cache);
                        }

                        await sendExtensionMessage<{ type: 'pass-onboarding' }>(
                            { type: 'pass-onboarding' },
                            { extensionId: model.extension.ID, maxTimeout: 1000 }
                        ).catch(noop);
                    }}
                />
            )}
        </>
    );
};

export default CustomStep;
