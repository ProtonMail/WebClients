import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useErrorHandler, useMyCountry } from '@proton/components/hooks';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import { getLocalPart } from '@proton/shared/lib/keys';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import CongratulationsStep from '../../signup/CongratulationsStep';
import ExploreStep from '../../signup/ExploreStep';
import RecoveryStep from '../../signup/RecoveryStep';
import type { SignupCacheResult } from '../../signup/interfaces';
import { SignupSteps, SignupType } from '../../signup/interfaces';
import { handleDisplayName, handleDone, handleSaveRecovery, handleSetupOrg } from '../../signup/signupActions';
import { useFlowRef } from '../../useFlowRef';
import Layout from '../Layout';
import Step2 from '../Step2';
import type { SignupCustomStepProps } from '../interface';
import OrgSetupStep from '../pass/OrgSetupStep';

enum Step {
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
}: SignupCustomStepProps & { hasRecoveryStepConfirmWarning?: boolean }) => {
    const [step, setStep] = useState(Step.Congratulations);
    const createFlow = useFlowRef();

    if (model.cache?.type !== 'signup') {
        throw new Error('Unknown type');
    }

    const cacheRef = useRef<SignupCacheResult>(model.cache);
    const cache = cacheRef.current!;
    const accountData = cache.accountData;
    const [defaultCountry] = useMyCountry();
    const handleError = useErrorHandler();
    const verificationModel = cache.humanVerificationResult?.verificationModel;

    const plan = getPlanFromPlanIDs(model.plansMap, model.subscriptionData.planIDs);
    const planName = plan?.Title;
    const isB2BAudienceFromPlan = plan && getIsB2BAudienceFromPlan(plan.Name);

    return (
        <Layout logo={logo} hasDecoration={false}>
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
                            const signupActionResponse = await handleDisplayName({
                                displayName,
                                cache,
                            });

                            if (validateFlow()) {
                                cacheRef.current = signupActionResponse.cache;
                                setStep(Step.SaveRecovery);
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
                    onBack={() => setStep(Step.Congratulations)}
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
                            const signupActionResponse = await handleSaveRecovery({
                                cache,
                                recoveryEmail,
                                recoveryPhone,
                            });

                            if (validateFlow()) {
                                cacheRef.current = signupActionResponse.cache;
                                if (isB2BAudienceFromPlan) {
                                    setStep(Step.OrgSetup);
                                } else {
                                    if (signupActionResponse.to === SignupSteps.Done) {
                                        await onSetup({ type: 'signup', payload: signupActionResponse });
                                    } else {
                                        setStep(Step.Explore);
                                    }
                                }
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
                                setStep(Step.RedirectAdmin);
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

                        if (product === APPS.PROTONDRIVE) {
                            const signupActionResponse = handleDone({
                                cache,
                                appIntent: { app: APPS.PROTONDRIVE, ref: 'product-switch' },
                            });
                            await onSetup({ type: 'signup', payload: signupActionResponse });
                            return;
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
                            const signupActionResponse = handleDone({
                                cache,
                                appIntent: { app, ref: 'product-switch' },
                            });

                            await measure({
                                event: TelemetryAccountSignupEvents.onboardFinish,
                                dimensions: {},
                            });

                            if (validateFlow()) {
                                await onSetup({ type: 'signup', payload: signupActionResponse });
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
