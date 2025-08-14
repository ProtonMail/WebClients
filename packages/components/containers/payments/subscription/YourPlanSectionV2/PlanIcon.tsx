import { type ReactNode } from 'react';

import MailLogo from '@proton/components/components/logo/MailLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import { type FreeSubscription, PLANS, type Subscription, hasVpnBusiness } from '@proton/payments';
import {
    getHasConsumerVpnPlan,
    hasBundle,
    hasDuo,
    hasFamily,
    hasFree,
    hasMail,
    hasPassFamily,
    hasVisionary,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import CustomLogo from './CustomLogo';

const LogoIconShape = ({ children, border = true, size }: { children: ReactNode; border?: boolean; size: number }) => {
    return (
        <div
            className={clsx(
                'w-custom ratio-square overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined
            )}
            style={{ '--w-custom': `${size / 16}rem`, backgroundColor: 'white', borderRadius: '27%' }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

export const PlanIcon = ({
    app,
    subscription,
    planName,
    size = 44, // size in px
}: {
    app?: APP_NAMES;
    subscription?: Subscription | FreeSubscription;
    planName?: PLANS;
    size?: number;
}) => {
    if (getHasConsumerVpnPlan(subscription) || planName === PLANS.VPN2024) {
        return (
            <LogoIconShape size={size}>
                <VpnLogo variant="glyph-only" scale={size / 44} />
            </LogoIconShape>
        );
    }
    if (hasMail(subscription) || planName === PLANS.MAIL) {
        return (
            <LogoIconShape size={size}>
                <MailLogo variant="glyph-only" scale={size / 44} />
            </LogoIconShape>
        );
    }
    if (hasBundle(subscription) || hasVisionary(subscription) || planName === PLANS.BUNDLE) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.BUNDLE} app={app} />
            </LogoIconShape>
        );
    }
    if (hasDuo(subscription) || planName === PLANS.DUO) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.DUO} app={app} />
            </LogoIconShape>
        );
    }
    if (hasFamily(subscription) || hasPassFamily(subscription) || planName === PLANS.FAMILY) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.FAMILY} app={app} />
            </LogoIconShape>
        );
    }
    if (hasVpnBusiness(subscription) || planName === PLANS.VPN_BUSINESS) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.VPN_BUSINESS} app={app} />
            </LogoIconShape>
        );
    }
    if (hasFree(subscription)) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo app={app} size={Math.ceil(size * 0.636)} />
            </LogoIconShape>
        );
    }

    return null;
};
