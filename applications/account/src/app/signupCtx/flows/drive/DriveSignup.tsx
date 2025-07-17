import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { CYCLE, type Cycle, PLANS, type PlanIDs, getIsB2BAudienceFromPlan, getPlanNameFromIDs } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';
import { hasFreePlanIDs } from '@proton/shared/lib/helpers/planIDs';

import { SignupType } from '../../../signup/interfaces';
import {
    type AvailablePlan,
    type BaseSignupContextProps,
    SignupContextProvider,
    useSignup,
} from '../../context/SignupContext';
import * as signupSearchParams from '../../helpers/signupSearchParams';
import DisplayNameStep from './steps/DisplayNameStep';
import OrgNameStep from './steps/OrgNameStep';
import PaymentStep from './steps/PaymentStep';
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

const getAvailablePlansWithCycles = (plans: { planIDs: PlanIDs }[], cycles: Cycle[]): AvailablePlan[] => {
    const availablePlans: AvailablePlan[] = [];

    cycles.forEach((cycle) => {
        plans.forEach(({ planIDs }) => {
            availablePlans.push({ planIDs, cycle });
        });
    });

    return availablePlans;
};

type Step = 'account-details' | 'payment' | 'org-name' | 'display-name' | 'creating-account';

const DriveSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const { options } = usePaymentOptimistic();

    const notifyError = useNotifyErrorHandler();

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

                                setStep('display-name');
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

                            setStep('display-name');
                        } catch (error) {
                            notifyError(error);
                        }
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
            onLogin={(session) => {
                return props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONDRIVE } });
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
