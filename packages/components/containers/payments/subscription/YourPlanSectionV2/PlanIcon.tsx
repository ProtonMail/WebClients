import type { ReactNode } from 'react';

import DriveLogo from '@proton/components/components/logo/DriveLogo';
import LumoLogo from '@proton/components/components/logo/LumoLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import {
    type FreeSubscription,
    PLANS,
    type Subscription,
    getHasConsumerVpnPlan,
    hasBundle,
    hasBundleBiz2025,
    hasBundlePro2024,
    hasDrive,
    hasDrive1TB,
    hasDuo,
    hasFamily,
    hasFree,
    hasLumo,
    hasMail,
    hasPass,
    hasPassFamily,
    hasVPNPassBundle,
    hasVPNPassProfessional,
    hasVisionary,
    hasVpnBusiness,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';
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
    user,
    subscription,
    planName,
    size = 44, // size in px
}: {
    app?: APP_NAMES;
    subscription?: Subscription | FreeSubscription;
    planName?: PLANS;
    size?: number;
    user?: UserModel;
}) => {
    if (hasVPNPassBundle(subscription) || planName === PLANS.VPN_PASS_BUNDLE) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.VPN_PASS_BUNDLE} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasVPNPassProfessional(subscription) || planName === PLANS.VPN_PASS_BUNDLE_BUSINESS) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.VPN_PASS_BUNDLE_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }
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
    if (hasLumo(subscription) || planName === PLANS.LUMO) {
        return (
            <LogoIconShape size={size}>
                <LumoLogo variant="glyph-only" scale={size / 44} />
            </LogoIconShape>
        );
    }
    if (hasPass(subscription) || planName === PLANS.PASS) {
        return (
            <LogoIconShape size={size}>
                <PassLogo variant="glyph-only" scale={size / 44} />
            </LogoIconShape>
        );
    }
    if (
        hasDrive(subscription) ||
        hasDrive1TB(subscription) ||
        planName === PLANS.DRIVE ||
        planName === PLANS.DRIVE_1TB
    ) {
        return (
            <LogoIconShape size={size}>
                <DriveLogo variant="glyph-only" scale={size / 44} />
            </LogoIconShape>
        );
    }
    if (
        hasBundle(subscription) ||
        hasVisionary(subscription) ||
        planName === PLANS.BUNDLE ||
        planName === PLANS.VISIONARY
    ) {
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
    if (hasFamily(subscription) || planName === PLANS.FAMILY) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.FAMILY} app={app} />
            </LogoIconShape>
        );
    }
    if (hasPassFamily(subscription) || planName === PLANS.PASS_FAMILY) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.PASS_FAMILY} app={app} />
            </LogoIconShape>
        );
    }
    if (user && hasPassLifetime(user)) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.PASS_LIFETIME} app={app} />
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
    if (hasBundlePro2024(subscription) || planName === PLANS.BUNDLE_PRO_2024) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.BUNDLE_PRO_2024} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasBundleBiz2025(subscription) || planName === PLANS.BUNDLE_BIZ_2025) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.BUNDLE_BIZ_2025} app={app} size={size} />
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
