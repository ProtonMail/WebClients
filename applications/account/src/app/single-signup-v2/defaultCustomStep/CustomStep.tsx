import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useErrorHandler, useMyCountry } from '@proton/components';
import { getIsB2BAudienceFromPlan, getPlanFromPlanIDs } from '@proton/payments/core/plan/helpers';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getLocalPart } from '@proton/shared/lib/keys';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import type { SignupCacheResult } from '../../signup/interfaces';
import { SignupType } from '../../signup/interfaces';
import { handleDisplayName, handleDone, handleSaveRecovery, handleSetupOrg } from '../../signup/signupActions';
import { useFlowRef } from '../../useFlowRef';
import Layout from '../Layout';
import Step2 from '../Step2';
import type { SignupCustomStepProps, SignupModelV2 } from '../interface';
import CongratulationsStep from './CongratulationsStep';
import OrgSetupStep from './OrgSetupStep';
import RecoveryStep from './RecoveryStep';
import MnemonicRecoveryStep from './recovery/MnemonicRecoveryStep';

enum Step {
    MnemonicRecovery,
    Congratulations,
    SaveRecovery,
    OrgSetup,
    RedirectAdmin,
}

function getLocalIdAndPathInfo(model: SignupModelV2) {
    if (model.cache?.type === 'user') {
        return {
            pathname: '/multi-user-support',
            localID: model.cache.session.resumedSessionResult.localID,
        };
    } else if (model.cache?.type === 'signup') {
        return {
            pathname: '/users-addresses',
            localID: model.cache.setupData?.authResponse.LocalID,
        };
    }
    throw new Error('Unknown cache');
}

const CustomStep = ({
    model,
    onSetup,
    logo,
    productAppName,
    measure,
    product,
    signupParameters,
}: SignupCustomStepProps) => {
    const createFlow = useFlowRef();
    const mnemonicData = model.cache?.setupData?.mnemonicData;

    const plan = getPlanFromPlanIDs(model.plansMap, model.subscriptionData.planIDs);
    const planName = plan?.Title;
    const isB2BAudienceFromPlan = Boolean(plan && getIsB2BAudienceFromPlan(plan.Name));
    const isBYOEAccount =
        model.cache?.type === 'signup' && model.cache.accountData.signupType === SignupType.BringYourOwnEmail;

    const steps: Step[] = [
        !!mnemonicData && Step.MnemonicRecovery,
        !isBYOEAccount && Step.Congratulations,
        !isBYOEAccount && !mnemonicData && Step.SaveRecovery,
        isB2BAudienceFromPlan && Step.OrgSetup,
        isB2BAudienceFromPlan && Step.RedirectAdmin,
    ].filter((step) => step !== false);

    const [step, setStep] = useState<Step>(steps[0]);

    if (model.cache?.type !== 'signup') {
        throw new Error('Unknown type');
    }

    const cacheRef = useRef<SignupCacheResult>(model.cache);
    const cache = cacheRef.current!;
    const accountData = cache.accountData;
    const defaultCountry = useMyCountry();
    const handleError = useErrorHandler();
    const verificationModel = cache.humanVerificationResult?.verificationModel;

    const handleNextStep = () => {
        const stepIndex = steps.indexOf(step);
        if (stepIndex === -1) {
            return;
        }

        const nextStepIndex = stepIndex + 1;
        const nextStep = steps[nextStepIndex];
        if (nextStep === undefined) {
            const signupActionResponse = handleDone({
                cache,
                appIntent: undefined,
            });
            return onSetup({ type: 'signup', payload: signupActionResponse });
        }

        setStep(nextStep);
    };

    const defaultEmail = (() => {
        if (signupParameters.invite?.type === 'porkbun') {
            return '';
        }

        if (verificationModel?.method === 'email' && verificationModel?.value) {
            return verificationModel.value;
        }

        if (accountData?.signupType === SignupType.External) {
            return accountData.email;
        }

        return '';
    })();

    // BYOE accounts might not have custom steps by default
    useEffect(() => {
        if (step === undefined) {
            const signupActionResponse = handleDone({
                cache,
                appIntent: product
                    ? {
                          app: product,
                      }
                    : undefined,
            });
            void onSetup({ type: 'signup', payload: signupActionResponse });
        }
    }, [step]);

    return (
        <Layout logo={logo} hasDecoration={false}>
            {step === Step.MnemonicRecovery && (
                <MnemonicRecoveryStep
                    onMeasureClick={(type) => {
                        void measure({
                            event: TelemetryAccountSignupEvents.interactRecoveryKit,
                            dimensions: { click: type },
                        });
                    }}
                    accountData={accountData}
                    mnemonicData={mnemonicData!}
                    onContinue={() => handleNextStep()}
                />
            )}
            {step === Step.Congratulations && (
                <CongratulationsStep
                    defaultName={
                        accountData.username ||
                        (accountData?.signupType === SignupType.External && getLocalPart(accountData.email)) ||
                        ''
                    }
                    planTitle={planName}
                    onSubmit={async ({ displayName }) => {
                        const validateFlow = createFlow();
                        try {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }
                            const updatedCache = await handleDisplayName({
                                displayName,
                                cache,
                            });
                            if (validateFlow()) {
                                cacheRef.current = updatedCache;
                                void handleNextStep();
                            }
                        } catch (error) {
                            handleError(error);
                        } finally {
                            createFlow.reset();
                        }
                    }}
                />
            )}
            {step === Step.SaveRecovery && (
                <RecoveryStep
                    defaultCountry={defaultCountry}
                    defaultEmail={defaultEmail}
                    defaultPhone={verificationModel?.method === 'sms' ? verificationModel?.value : ''}
                    onSubmit={async ({ recoveryEmail, recoveryPhone }) => {
                        const validateFlow = createFlow();
                        try {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }
                            await handleSaveRecovery({
                                cache,
                                recoveryEmail,
                                recoveryPhone,
                            });
                            if (validateFlow()) {
                                cacheRef.current = cache;
                                void handleNextStep();
                            }
                        } catch (error) {
                            handleError(error);
                        } finally {
                            createFlow.reset();
                        }
                    }}
                />
            )}
            {step === Step.OrgSetup && (
                <OrgSetupStep
                    defaultOrgName={signupParameters.orgName}
                    onSubmit={async ({ orgName }) => {
                        const validateFlow = createFlow();
                        try {
                            if (!cache || cache.type !== 'signup' || !cache.setupData?.api) {
                                throw new Error('Missing cache');
                            }
                            const api = cache.setupData.api;
                            const user = cache.setupData.user;
                            const password = cache.accountData.password;
                            const keyPassword = cache.setupData?.session.keyPassword ?? '';

                            await handleSetupOrg({ api, user, password, keyPassword, orgName });

                            if (validateFlow()) {
                                void handleNextStep();
                            }
                        } catch (error) {
                            handleError(error);
                        } finally {
                            createFlow.reset();
                        }
                    }}
                />
            )}
            {step === Step.RedirectAdmin && (
                <Step2
                    steps={[c('pass_signup_2023: Info').t`Setting up your organization`]}
                    img={<img src={onboardingFamilyPlan} alt="" />}
                    product={productAppName}
                    logo={logo}
                    onSetup={async () => {
                        const { localID, pathname } = getLocalIdAndPathInfo(model);

                        await measure({
                            event: TelemetryAccountSignupEvents.onboardFinish,
                            dimensions: {},
                        });

                        await wait(1_500);

                        // Drive should go to the app, not use the account redirect
                        if (product === APPS.PROTONDRIVE) {
                            return handleNextStep();
                        }

                        const b2bSettingsApp =
                            product &&
                            ([APPS.PROTONMAIL, APPS.PROTONVPN_SETTINGS, APPS.PROTONLUMO] as APP_NAMES[]).includes(
                                product
                            )
                                ? product
                                : APPS.PROTONMAIL;

                        document.location.assign(
                            getAppHref(`/${getSlugFromApp(b2bSettingsApp)}${pathname}`, APPS.PROTONACCOUNT, localID)
                        );
                    }}
                />
            )}
        </Layout>
    );
};

export default CustomStep;
