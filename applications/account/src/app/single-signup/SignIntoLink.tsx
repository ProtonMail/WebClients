import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import type { PLANS } from '@proton/payments/core/constants';
import type { Plan } from '@proton/payments/core/plan/interface';
import {
    type SubscriptionSearchParams,
    getSubscriptionSearchParamsString,
} from '@proton/payments/core/subscription/search-params';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';

import type { OptimisticOptions } from '../single-signup-v2/interface';
import type { Measure } from './interface';

const SignInToLink = ({
    options,
    disabled,
    details,
    measure,
}: {
    options: OptimisticOptions & { plan: Plan };
    details: { email: string } | undefined;
    measure: Measure;
    disabled?: boolean;
}) => {
    const { APP_NAME } = useConfig();

    const planOptions: SubscriptionSearchParams = {
        plan: options.plan.Name as PLANS,
        cycle: options.cycle,
        currency: options.currency,
        coupon: options.checkResult.Coupon?.Code,
        fixedCycle: true,
        fixedPlan: true,
    };

    if (APP_NAME === APPS.PROTONACCOUNT) {
        const search = getSubscriptionSearchParamsString({ ...planOptions, ref: 'signup', email: details?.email });
        // On account we simply refresh the page with a direct local link
        const pathname = `/vpn/dashboard?${search}`;
        return (
            // The link is deliberately not navigable while disabled, so it has no href to be keyboard accessible with.
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a
                key="signin"
                className="link link-focus text-nowrap"
                href={disabled ? undefined : pathname}
                target="_self"
            >
                {c('Link').t`Sign in`}
            </a>
        );
    }

    const search = getSubscriptionSearchParamsString({ ...planOptions, ref: 'signup' });
    const signInTo = {
        pathname: `/dashboard?${search}`,
        ...(details
            ? {
                  state: {
                      username: details.email,
                  },
              }
            : undefined),
    } as const;

    return (
        <Link
            key="signin"
            className="link link-focus text-nowrap"
            to={signInTo}
            onClick={(e) => {
                if (disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }

                void measure({
                    event: TelemetryAccountSignupEvents.userSignIn,
                    dimensions: {
                        location: 'step2',
                    },
                });
            }}
        >
            {c('Link').t`Sign in`}
        </Link>
    );
};

export default SignInToLink;
