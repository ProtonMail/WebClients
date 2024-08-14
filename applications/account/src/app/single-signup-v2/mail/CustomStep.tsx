import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useErrorHandler, useMyCountry } from '@proton/components/hooks';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import { getLocalPart } from '@proton/shared/lib/keys';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import CongratulationsStep from '../../signup/CongratulationsStep';
import ExploreStep from '../../signup/ExploreStep';
import RecoveryStep from '../../signup/RecoveryStep';
import type { SignupCacheResult } from '../../signup/interfaces';
import { SignupType } from '../../signup/interfaces';
import { handleDisplayName, handleDone, handleSaveRecovery, handleSetupOrg } from '../../signup/signupActions';
import { useFlowRef } from '../../useFlowRef';
import Layout from '../Layout';
import Step2 from '../Step2';
import type { SignupCustomStepProps } from '../interface';
import MnemonicRecoveryStep from '../pass/MnemonicRecoveryStep';
import OrgSetupStep from '../pass/OrgSetupStep';

enum Step {
    MnemonicRecovery,
    Congratulations,
    SaveRecovery,
    OrgSetup,
    Explore,
    RedirectAdmin,
}

const CustomStep = ({
    model,
    onSetup,
    logo,
    productAppName,
    measure,
    product,
    signupParameters,
    hasRecoveryStepConfirmWarning = true,
    hasExploreStep,
}: SignupCustomStepProps & {
    hasRecoveryStepConfirmWarning?: boolean;
    hasExploreStep?: boolean;
}) => {
    const createFlow = useFlowRef();
    const mnemonicData = model.cache?.setupData?.mnemonicData;

    const plan = getPlanFromPlanIDs(model.plansMap, model.subscriptionData.planIDs);
    const planName = plan?.Title;
    const isB2BAudienceFromPlan = Boolean(plan && getIsB2BAudienceFromPlan(plan.Name));

    const steps: Step[] = [
        !!mnemonicData && Step.MnemonicRecovery,
        Step.Congratulations,
        !mnemonicData && Step.SaveRecovery,
        isB2BAudienceFromPlan && Step.OrgSetup,
        isB2BAudienceFromPlan && Step.RedirectAdmin,
        !!hasExploreStep && Step.Explore,
    ].filter((step) => step !== false);

    const [step, setStep] = useState<Step>(steps[0]);

    if (model.cache?.type !== 'signup') {
        throw new Error('Unknown type');
    }

    const cacheRef = useRef<SignupCacheResult>(model.cache);
    const cache = cacheRef.current!;
    const accountData = cache.accountData;
    const [defaultCountry] = useMyCountry();
    const handleError = useErrorHandler();
    const verificationModel = cache.humanVerificationResult?.verificationModel;

    const handleNextStep = (targetApp: APP_NAMES = product) => {
        const stepIndex = steps.indexOf(step);
        if (stepIndex === -1) {
            return;
        }

        const nextStepIndex = stepIndex + 1;
        const nextStep = steps[nextStepIndex];
        if (nextStep === undefined) {
            const signupActionResponse = handleDone({
                cache,
                appIntent: { app: targetApp, ref: hasExploreStep ? 'product-switch' : undefined },
            });
            return onSetup({ type: 'signup', payload: signupActionResponse });
        }

        setStep(nextStep);
    };

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
                    mnemonic={mnemonicData!}
                    onContinue={async () => handleNextStep()}
                />
            )}
            {step === Step.Congratulations && (
                <CongratulationsStep
                    defaultName={
                        accountData.username ||
                        (accountData?.signupType === SignupType.Email && getLocalPart(accountData.email)) ||
                        ''
                    }
                    planName={planName}
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
                                handleNextStep();
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
                    hasConfirmWarning={hasRecoveryStepConfirmWarning}
                    defaultCountry={defaultCountry}
                    defaultEmail={
                        (verificationModel?.method === 'email' && verificationModel?.value) ||
                        (accountData?.signupType === SignupType.Email && accountData.email) ||
                        ''
                    }
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
                                handleNextStep();
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
                            const keyPassword = cache.setupData?.keyPassword || '';

                            await handleSetupOrg({ api, user, password, keyPassword, orgName });

                            if (validateFlow()) {
                                handleNextStep();
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
                        const { localID, pathname } = (() => {
                            if (model.cache?.type === 'user') {
                                return {
                                    pathname: '/multi-user-support',
                                    localID: model.cache.session.localID,
                                };
                            } else if (model.cache?.type === 'signup') {
                                return {
                                    pathname: '/users-addresses',
                                    localID: model.cache.setupData?.authResponse.LocalID,
                                };
                            }
                            throw new Error('Unknown cache');
                        })();

                        await measure({
                            event: TelemetryAccountSignupEvents.onboardFinish,
                            dimensions: {},
                        });

                        await wait(1_500);

                        // Drive should go to the app, not use the account redirect
                        if (product === APPS.PROTONDRIVE) {
                            return handleNextStep();
                        }

                        const b2bSettingsApp = [APPS.PROTONMAIL, APPS.PROTONVPN_SETTINGS].includes(product as any)
                            ? product
                            : APPS.PROTONMAIL;

                        document.location.assign(
                            getAppHref(`/${getSlugFromApp(b2bSettingsApp)}${pathname}`, APPS.PROTONACCOUNT, localID)
                        );
                    }}
                />
            )}
            {step === Step.Explore && (
                <ExploreStep
                    user={cache.setupData?.user}
                    plan={plan?.Name}
                    onExplore={async (app) => {
                        try {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }
                            const validateFlow = createFlow();

                            await measure({
                                event: TelemetryAccountSignupEvents.onboardFinish,
                                dimensions: {},
                            });

                            if (validateFlow()) {
                                handleNextStep(app);
                            }
                        } catch (error) {
                            handleError(error);
                        }
                    }}
                />
            )}
        </Layout>
    );
};

export default CustomStep;
