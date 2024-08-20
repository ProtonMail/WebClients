import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useErrorHandler } from '@proton/components/hooks';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getLocalPart } from '@proton/shared/lib/keys';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';
import noop from '@proton/utils/noop';

import CongratulationsStep from '../../signup/CongratulationsStep';
import type { SignupCacheResult, UserCacheResult } from '../../signup/interfaces';
import { SignupType } from '../../signup/interfaces';
import { handleDisplayName, handleSetupOrg } from '../../signup/signupActions';
import { useFlowRef } from '../../useFlowRef';
import Layout from '../Layout';
import Step2 from '../Step2';
import type { SignupCustomStepProps } from '../interface';
import MnemonicRecoveryStep from './MnemonicRecoveryStep';
import OrgSetupStep from './OrgSetupStep';

enum Step {
    Recovery,
    DisplayName,
    OrgSetup,
    RedirectUser,
}

const CustomStepB2B = ({ measure, productAppName, logo, model, signupParameters }: SignupCustomStepProps) => {
    const mnemonicData = model.cache?.setupData?.mnemonicData;
    const handleError = useErrorHandler();
    const createFlow = useFlowRef();

    const cacheRef = useRef<SignupCacheResult | UserCacheResult>(model.cache!);
    const cache = cacheRef.current;

    const { accountData, username } = (() => {
        if (cache.type === 'signup') {
            const accountData = cache.accountData;
            const username =
                (accountData?.signupType === SignupType.Email && accountData.email) || accountData.username;
            return {
                username,
                accountData,
            };
        }
        return { accountData: null, username: null };
    })();

    useEffect(() => {
        void measure({ event: TelemetryAccountSignupEvents.onboardingStart, dimensions: {} });
    }, []);

    const getNextPassStep = () => {
        if (accountData) {
            return Step.DisplayName;
        }
        return Step.OrgSetup;
    };

    const [step, setStep] = useState(() => {
        if (cache.type === 'user') {
            return Step.RedirectUser;
        }
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
            {step === Step.DisplayName && accountData && (
                <CongratulationsStep
                    description={getBoldFormattedText(
                        c('pass_signup_2023: Info')
                            .t`Enter a display name for **${username}**. This is what your users will see when you change their permissions or share data with them.`
                    )}
                    defaultName={
                        accountData.username ||
                        (accountData?.signupType === SignupType.Email && getLocalPart(accountData.email)) ||
                        ''
                    }
                    planName={undefined}
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
                                setStep(Step.OrgSetup);
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

                            await handleSetupOrg({ api, user, password, keyPassword, orgName }).catch(noop);

                            if (validateFlow()) {
                                setStep(Step.RedirectUser);
                            }
                        } catch (error) {
                            handleError(error);
                        } finally {
                            createFlow.reset();
                        }
                    }}
                />
            )}
            {step === Step.RedirectUser && (
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

                        document.location.assign(
                            getAppHref(`/${getSlugFromApp(APPS.PROTONPASS)}${pathname}`, APPS.PROTONACCOUNT, localID)
                        );
                    }}
                />
            )}
        </Layout>
    );
};

export default CustomStepB2B;
