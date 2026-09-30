import { addDays, getUnixTime } from 'date-fns';
import { c } from 'ttag';

import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import Time from '@proton/components/components/time/Time';
import { ProtonPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { ADDON_PREFIXES, PLANS, TRIAL_DURATION_DAYS, TRIAL_MAX_USERS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { Audience } from '@proton/shared/lib/interfaces';

import RightSummary from './RightSummary';
import type { OptimisticOptions, SignupModelV2 } from './interface';

const PAYMENTLESS_TRIAL_PLANS: string[] = [PLANS.PASS_PRO, PLANS.PASS_BUSINESS];

export const getIsPaymentlessTrial = ({
    cardless,
    isTrial,
    audience,
    planName,
}: {
    cardless: boolean;
    isTrial: boolean;
    audience: Audience;
    planName: string | undefined;
}) =>
    cardless &&
    isTrial &&
    audience === Audience.B2B &&
    planName !== undefined &&
    PAYMENTLESS_TRIAL_PLANS.includes(planName);

export const getPaymentlessTrialRenewalNotice = ({ planTitle }: { planTitle: string }) => {
    const trialEndDate = (
        <Time key="paymentless-trial-end-date">{getUnixTime(addDays(new Date(), TRIAL_DURATION_DAYS))}</Time>
    );

    return c('b2b_trials_2025_Info')
        .jt`Your trial ends on ${trialEndDate}. Add a payment method whenever you’re ready to keep using all ${planTitle} features. You’ll only be charged once it’s added.`;
};

export const PaymentlessTrialOrganizationSize = ({
    model,
    options,
    onChangePlanIDs,
    telemetryContext,
}: {
    model: SignupModelV2;
    options: OptimisticOptions;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    telemetryContext: PaymentTelemetryContext;
}) => (
    <div className="mb-6">
        <ProtonPlanCustomizer
            mode="signup"
            audience={Audience.B2B}
            plansMap={model.plansMap}
            selectedPlanIDs={options.planIDs}
            cycle={options.cycle}
            currency={options.currency}
            onChangePlanIDs={onChangePlanIDs}
            allowedAddonTypes={[ADDON_PREFIXES.MEMBER]}
            addonFlags={{}}
            isTrialMode
            telemetryContext={telemetryContext}
        />
        <div className="mt-1 text-sm color-primary">
            {c('b2b_trials_2025_Info').t`Up to ${TRIAL_MAX_USERS} users, during the trial period`}
        </div>
        <hr className="mt-6" />
    </div>
);

export const PaymentlessTrialSummarySkeleton = () => (
    <RightSummary
        aria-busy
        data-testid="paymentless-trial-summary-skeleton"
        variant="border"
        className="mx-auto md:mx-0 rounded-xl p-6"
    >
        <span className="sr-only">{c('Info').t`Loading`}</span>
        <SkeletonLoader width="100%" height="20rem" index={1} />
    </RightSummary>
);
