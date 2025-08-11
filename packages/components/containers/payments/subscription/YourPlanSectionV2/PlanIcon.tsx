import { type ReactNode } from 'react';

import MailLogo from '@proton/components/components/logo/MailLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import { type FreeSubscription, PLANS, type Subscription } from '@proton/payments';
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

const LogoIconShape = ({ children, border = true }: { children: ReactNode; border?: boolean }) => {
    return (
        <div
            className={clsx(
                'w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined
            )}
            style={{ '--w-custom': '2.75rem', backgroundColor: 'white' }}
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
}: {
    app?: APP_NAMES;
    subscription?: Subscription | FreeSubscription;
    planName?: PLANS;
}) => {
    if (getHasConsumerVpnPlan(subscription) || planName === PLANS.VPN2024) {
        return (
            <LogoIconShape>
                <VpnLogo variant="glyph-only" />
            </LogoIconShape>
        );
    }
    if (hasMail(subscription) || planName === PLANS.MAIL) {
        return (
            <LogoIconShape>
                <MailLogo variant="glyph-only" />
            </LogoIconShape>
        );
    }
    if (hasBundle(subscription) || hasVisionary(subscription) || planName === PLANS.BUNDLE) {
        return (
            <LogoIconShape border={false}>
                <CustomLogo planName={PLANS.BUNDLE} app={app} />
            </LogoIconShape>
        );
    }
    if (hasDuo(subscription) || planName === PLANS.DUO) {
        return (
            <LogoIconShape border={false}>
                <CustomLogo planName={PLANS.DUO} app={app} />
            </LogoIconShape>
        );
    }
    if (hasFamily(subscription) || hasPassFamily(subscription) || planName === PLANS.FAMILY) {
        return (
            <LogoIconShape border={false}>
                <CustomLogo planName={PLANS.FAMILY} app={app} />
            </LogoIconShape>
        );
    }
    if (hasFree(subscription)) {
        return (
            <LogoIconShape>
                <CustomLogo app={app} size={28} />
            </LogoIconShape>
        );
    }

    return null;
};
