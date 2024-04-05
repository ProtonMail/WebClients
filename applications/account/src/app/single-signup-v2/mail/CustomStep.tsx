import { useRef, useState } from 'react';

import { useErrorHandler, useMyCountry } from '@proton/components/hooks';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getLocalPart } from '@proton/shared/lib/keys';

import CongratulationsStep from '../../signup/CongratulationsStep';
import ExploreStep from '../../signup/ExploreStep';
import RecoveryStep from '../../signup/RecoveryStep';
import { SignupCacheResult, SignupSteps, SignupType } from '../../signup/interfaces';
import { handleDisplayName, handleDone, handleSaveRecovery } from '../../signup/signupActions';
import { useFlowRef } from '../../useFlowRef';
import Layout from '../Layout';
import { SignupCustomStepProps } from '../interface';

enum Step {
    Congratulations,
    SaveRecovery,
    Explore,
}

const CustomStep = ({ model, onSetup, logo }: SignupCustomStepProps) => {
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
                                if (signupActionResponse.to === SignupSteps.Done) {
                                    await onSetup({ type: 'signup', payload: signupActionResponse });
                                } else {
                                    setStep(Step.Explore);
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
