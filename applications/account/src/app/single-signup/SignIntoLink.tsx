import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useConfig from '@proton/components/hooks/useConfig';
import type { Plan } from '@proton/payments';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';

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

    const planOptions = {
        plan: options.plan.Name,
        cycle: `${options.cycle}`,
        currency: options.currency,
        coupon: options.checkResult.Coupon?.Code,
        type: 'offer',
        ref: 'signup',
    };

    if (APP_NAME === APPS.PROTONACCOUNT) {
        // On account we simply refresh the page with a direct local link
        const pathname = `/vpn/dashboard${stringifySearchParams({ ...planOptions, email: details?.email }, '?')}`;
        return (
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

    const signInTo = {
        pathname: `/dashboard${stringifySearchParams(planOptions, '?')}`,
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

                measure({
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
