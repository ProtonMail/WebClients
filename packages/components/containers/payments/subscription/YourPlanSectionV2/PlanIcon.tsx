import type { ReactNode } from 'react';

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
    hasDriveBusiness,
    hasDrivePro,
    hasDuo,
    hasFamily,
    hasFree,
    hasLumo,
    hasLumoBusiness,
    hasMail,
    hasMailBusiness,
    hasMailPro,
    hasPass,
    hasPassBusiness,
    hasPassFamily,
    hasPassPro,
    hasVPNPassBundle,
    hasVPNPassProfessional,
    hasVisionary,
    hasVpnBusiness,
    hasVpnPro,
} from '@proton/payments';
import { hasBundlePro, hasDriveLite, hasMeetBusiness } from '@proton/payments/core/subscription/helpers';
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
    if (getHasConsumerVpnPlan(subscription) || planName === PLANS.VPN2024 || planName === PLANS.VPN) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.VPN2024} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasMail(subscription) || planName === PLANS.MAIL) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.MAIL} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasLumo(subscription) || planName === PLANS.LUMO) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.LUMO} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasLumoBusiness(subscription) || planName === PLANS.LUMO_BUSINESS) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.LUMO_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasPass(subscription) || planName === PLANS.PASS) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.PASS} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasMeetBusiness(subscription) || planName === PLANS.MEET_BUSINESS) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.MEET_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (
        hasDrive(subscription) ||
        hasDrive1TB(subscription) ||
        hasDriveLite(subscription) ||
        planName === PLANS.DRIVE ||
        planName === PLANS.DRIVE_1TB ||
        planName === PLANS.DRIVE_LITE
    ) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.DRIVE} app={app} size={size} />
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
                <CustomLogo planName={PLANS.BUNDLE} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasDuo(subscription) || planName === PLANS.DUO) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.DUO} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasFamily(subscription) || planName === PLANS.FAMILY) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.FAMILY} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasPassFamily(subscription) || planName === PLANS.PASS_FAMILY) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.PASS_FAMILY} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if ((user && hasPassLifetime(user)) || planName === PLANS.PASS_LIFETIME) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.PASS_LIFETIME} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasVpnBusiness(subscription) || planName === PLANS.VPN_BUSINESS) {
        return (
            <LogoIconShape border={false} size={size}>
                <CustomLogo planName={PLANS.VPN_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (
        hasBundlePro(subscription) ||
        hasBundlePro2024(subscription) ||
        planName === PLANS.BUNDLE_PRO_2024 ||
        planName === PLANS.BUNDLE_PRO
    ) {
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

    if (hasDrivePro(subscription) || planName === PLANS.DRIVE_PRO) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.DRIVE_PRO} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasDriveBusiness(subscription) || planName === PLANS.DRIVE_BUSINESS) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.DRIVE_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasVpnPro(subscription) || planName === PLANS.VPN_PRO) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.VPN_PRO} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasMailPro(subscription) || planName === PLANS.MAIL_PRO) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.MAIL_PRO} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasMailBusiness(subscription) || planName === PLANS.MAIL_BUSINESS) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.MAIL_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasPassPro(subscription) || planName === PLANS.PASS_PRO) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.PASS_PRO} app={app} size={size} />
            </LogoIconShape>
        );
    }
    if (hasPassBusiness(subscription) || planName === PLANS.PASS_BUSINESS) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo planName={PLANS.PASS_BUSINESS} app={app} size={size} />
            </LogoIconShape>
        );
    }

    if (hasFree(subscription)) {
        return (
            <LogoIconShape size={size}>
                <CustomLogo app={app} size={size} />
            </LogoIconShape>
        );
    }

    return null;
};
