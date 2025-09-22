import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import {
    CYCLE,
    PLANS,
    type PlanIDs,
    getIsB2BAudienceFromPlan,
    getPlanNameFromIDs,
    hasFreePlanIDs,
} from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import * as signupSearchParams from '../../helpers/signupSearchParams';
import DisplayNameStep from './steps/DisplayNameStep';
import OrgNameStep from './steps/OrgNameStep';
import PaymentStep from './steps/PaymentStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

const getPlanIDsFromPlan = (plan: PLANS | undefined): PlanIDs => {
    if (plan === PLANS.DRIVE) {
        return { [PLANS.DRIVE]: 1 };
    }
    if (plan === PLANS.BUNDLE) {
        return { [PLANS.BUNDLE]: 1 };
    }
    if (plan === PLANS.DUO) {
        return { [PLANS.DUO]: 1 };
    }
    if (plan === PLANS.FAMILY) {
        return { [PLANS.FAMILY]: 1 };
    }
    if (plan === PLANS.DRIVE_BUSINESS) {
        return { [PLANS.DRIVE_BUSINESS]: 1 };
    }

    return {};
};

export const drivePlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.DRIVE]: 1 },
};

export const unlimited: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.BUNDLE]: 1 },
};

export const duo: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.DUO]: 1 },
};

export const family: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.FAMILY]: 1 },
};

export const driveBiz: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.DRIVE_BUSINESS]: 1 },
};

type Step = 'account-details' | 'payment' | 'org-name' | 'recovery' | 'display-name' | 'creating-account';

const DriveSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const { options, initializationStatus } = usePaymentOptimistic();

    const notifyError = useNotifyErrorHandler();

    /**
     * We have a recovery step in this flow, so let's prefetch the recovery kit
     */
    usePrefetchGenerateRecoveryKit();

    /**
     * Prevent content flashes where selected plan is initially the default before initialization occurs
     */
    if (!initializationStatus.triggered) {
        return null;
    }

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    onSuccess={async () => {
                        const isFree = hasFreePlanIDs(options.planIDs);
                        if (isFree) {
                            try {
                                await signup.createUser();
                                setStep('creating-account');

                                await signup.setupUser();

                                setStep('recovery');
                            } catch (error) {
                                notifyError(error);
                            }
                        } else {
                            setStep('payment');
                        }
                    }}
                />
            )}

            {step === 'payment' && (
                <PaymentStep
                    onBack={() => {
                        setStep('account-details');
                    }}
                    onPaymentTokenProcessed={async () => {
                        try {
                            await signup.createUser();
                            setStep('creating-account');

                            await signup.setupUser();

                            setStep('recovery');
                        } catch (error) {
                            notifyError(error);
                        }
                    }}
                />
            )}

            {step === 'recovery' && (
                <RecoveryPhraseStep
                    onContinue={async () => {
                        setStep('display-name');
                    }}
                />
            )}

            {step === 'display-name' && (
                <DisplayNameStep
                    onSubmit={async (displayName) => {
                        await signup.setDisplayName(displayName);

                        if (getIsB2BAudienceFromPlan(getPlanNameFromIDs(options.planIDs))) {
                            setStep('org-name');
                            return;
                        }

                        await signup.login();
                    }}
                />
            )}
            {step === 'org-name' && (
                <OrgNameStep
                    onSubmit={async (orgName) => {
                        await signup.setOrgName(orgName);
                        await signup.login();
                    }}
                />
            )}

            {step === 'creating-account' && <LoaderPage text="Creating your account" />}
        </>
    );
};

export const availablePlans = getAvailablePlansWithCycles(
    [drivePlus, unlimited, duo, family, driveBiz],
    [CYCLE.MONTHLY, CYCLE.YEARLY]
);

const DriveSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONDRIVE}
            flowId="drive-generic"
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONDRIVE } });
            }}
            paymentsDataConfig={{
                availablePlans,
                plan: {
                    planIDs: getPlanIDsFromPlan(signupSearchParams.getPlan(searchParams)),
                    currency: signupSearchParams.getCurrency(searchParams),
                    cycle: signupSearchParams.getCycle(searchParams) || CYCLE.YEARLY,
                    coupon: signupSearchParams.getCoupon(searchParams),
                },
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.External, SignupType.Proton]),
            }}
        >
            <DriveSignupInner />
        </SignupContextProvider>
    );
};

export default DriveSignup;
