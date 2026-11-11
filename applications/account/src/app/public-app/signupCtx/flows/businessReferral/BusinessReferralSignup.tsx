import { Route, Switch, useHistory, useLocation } from 'react-router-dom';

import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import * as signupSearchParams from '../../helpers/signupSearchParams';
import { getBusinessReferralPlanConfigs } from './config/planConfigs';
import CheckoutStep from './steps/CheckoutStep';
import PlansStep from './steps/PlansStep';

const DEFAULT_BUSINESS_SIGNUP_PLAN = PLANS.BUNDLE_BIZ_2025;
// B2B plans in this app are only sold on the yearly cycle.
const BUSINESS_SIGNUP_CYCLE = CYCLE.YEARLY;

/**
 * Mirrors the b2c referral flow's shape (ReferralSignup.tsx): one SignupContextProvider spans
 * both the plan picker and the checkout steps, so moving between them is an in-app route change
 * rather than a redirect to a different signup flow.
 */
const BusinessReferralRouter = () => {
    const payments = usePaymentOptimistic();

    if (!payments.initializationStatus.triggered) {
        return null;
    }

    return (
        <Switch>
            <Route path={SSO_PATHS.BUSINESS_REFERRAL_SIGNUP}>
                <CheckoutStep />
            </Route>
            <Route>
                <PlansStep />
            </Route>
        </Switch>
    );
};

const BusinessReferralSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const history = useHistory();
    const searchParams = new URLSearchParams(location.search);
    const referralIdentifier = signupSearchParams.getReferralIdentifier(searchParams);
    const planParam = signupSearchParams.getPlan(searchParams);
    const planConfigs = getBusinessReferralPlanConfigs();
    const availablePlans = getAvailablePlansWithCycles(
        planConfigs.map((config) => ({ planIDs: { [config.plan]: 1 } })),
        [BUSINESS_SIGNUP_CYCLE]
    );
    const plan =
        planParam && planConfigs.some((config) => config.plan === planParam) ? planParam : DEFAULT_BUSINESS_SIGNUP_PLAN;

    return (
        <SignupContextProvider
            {...props}
            app="generic"
            flowId="business-referral-signup"
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: undefined });
            }}
            paymentsDataConfig={{
                availablePlans,
                plan: {
                    planIDs: { [plan]: 1 },
                    currency: signupSearchParams.getCurrency(searchParams),
                    cycle: BUSINESS_SIGNUP_CYCLE,
                    coupon: signupSearchParams.getCoupon(searchParams) ?? COUPON_CODES.BUSINESS_REFERRAL_2026,
                },
                telemetryContext: 'ctx-signup-business-referral',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || undefined,
                // Mirrors legacy's generic B2B signup config (single-signup-v2/generic/configuration.tsx),
                // which lets business customers keep their existing work email instead of creating a new
                // Proton address.
                availableSignupTypes: new Set([SignupType.Proton, SignupType.External]),
            }}
            unverifiedReferralData={
                referralIdentifier
                    ? { referralIdentifier, referralID: signupSearchParams.getReferralID(searchParams) }
                    : undefined
            }
            onReferralCheckError={() => {
                history.replace(SSO_PATHS.BUSINESS_SIGNUP_GENERIC);
            }}
        >
            <BusinessReferralRouter />
        </SignupContextProvider>
    );
};

export default BusinessReferralSignup;
