import { ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import Step2 from '../Step2';
import { Measure, SignupModelV2 } from '../interface';
import CopyRecoveryStep from './CopyRecoveryStep';
import InstallExtensionStep from './InstallExtensionStep';
import PDFRecoveryStep from './PDFRecoveryStep';

enum Step {
    Recovery,
    Install,
    Loading,
}

interface Props {
    logo: ReactNode;
    onSetup: () => Promise<void>;
    model: SignupModelV2;
    fork: boolean;
    setupImg: ReactNode;
    productAppName: string;
    measure: Measure;
}

const CustomStep = ({ measure, setupImg, productAppName, fork, onSetup, logo, model }: Props) => {
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
                            <CopyRecoveryStep
                                onMeasureClick={(type) => {
                                    measure({
                                        event: TelemetryAccountSignupEvents.interactRecoveryKit,
                                        dimensions: { click: type },
                                    });
                                }}
                                mnemonic={mnemonicData!}
                                logo={logo}
                                onContinue={async () => {
                                    setStep(maybeTriggerExtension());
                                }}
                            />
                        );
                    }
                    return (
                        <PDFRecoveryStep
                            onMeasureClick={(type) => {
                                measure({
                                    event: TelemetryAccountSignupEvents.interactRecoveryKit,
                                    dimensions: { click: type },
                                });
                            }}
                            mnemonic={mnemonicData!}
                            logo={logo}
                            onContinue={async () => {
                                setStep(maybeTriggerExtension());
                            }}
                        />
                    );
                })()}
            {step === Step.Install && (
                <InstallExtensionStep
                    measure={measure}
                    logo={logo}
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

                        await Promise.all([
                            fork
                                ? onSetup()
                                : sendExtensionMessage<{ type: 'pass-onboarding' }>(
                                      { type: 'pass-onboarding' },
                                      { extensionId: model.extension.ID, maxTimeout: 1000 }
                                  ),
                        ]).catch(noop);
                    }}
                />
            )}
        </>
    );
};

export default CustomStep;
