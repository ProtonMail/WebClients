import type { ComponentPropsWithoutRef } from 'react';

import { PLANS } from '@proton/payments/core/constants';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import bundle from './logo/plan-bundle.svg';
import driveBusiness from './logo/plan-drive-business.svg';
import driveFree from './logo/plan-drive-free.svg';
import drivePro from './logo/plan-drive-pro.svg';
import drive from './logo/plan-drive.svg';
import duo from './logo/plan-duo.svg';
import family from './logo/plan-family.svg';
import lumoBusiness from './logo/plan-lumo-business.svg';
import lumoFree from './logo/plan-lumo-free.svg';
import lumoPlus from './logo/plan-lumo-plus.svg';
import mailBusiness from './logo/plan-mail-business.svg';
import mailFree from './logo/plan-mail-free.svg';
import mailPro from './logo/plan-mail-pro.svg';
import mail from './logo/plan-mail.svg';
import meetBusiness from './logo/plan-meet-business.svg';
import meetFree from './logo/plan-meet-free.svg';
import meet from './logo/plan-meet.svg';
import passBusiness from './logo/plan-pass-business.svg';
import passFamily from './logo/plan-pass-family.svg';
import passFree from './logo/plan-pass-free-light.svg';
import passLifetime from './logo/plan-pass-lifetime.svg';
import passPro from './logo/plan-pass-pro.svg';
import pass from './logo/plan-pass.svg';
import genericFree from './logo/plan-proton-free.svg';
import visionary from './logo/plan-visionary.svg';
import vpnBusiness from './logo/plan-vpn-business.svg';
import vpnFree from './logo/plan-vpn-free.svg';
import vpnPassBundleDark from './logo/plan-vpn-pass-bundle-dark.svg';
import vpnPassBundle from './logo/plan-vpn-pass-bundle.svg';
import vpnPro from './logo/plan-vpn-pro.svg';
import vpn from './logo/plan-vpn.svg';
import workspacePremium from './logo/plan-workspace-premium.svg';
import workspace from './logo/plan-workspace.svg';

export type CustomLogoPlanName =
    | PLANS.VPN2024
    | PLANS.MAIL
    | PLANS.MAIL_PRO
    | PLANS.MAIL_BUSINESS
    | PLANS.PASS
    | PLANS.DRIVE
    | PLANS.DRIVE_1TB
    | PLANS.BUNDLE
    | PLANS.BUNDLE_PRO
    | PLANS.DUO
    | PLANS.FAMILY
    | PLANS.VISIONARY
    | PLANS.VPN_BUSINESS
    | PLANS.BUNDLE_PRO_2024
    | PLANS.BUNDLE_BIZ_2025
    | PLANS.MEET_BUSINESS
    | PLANS.MEET
    | PLANS.VPN_PASS_BUNDLE
    | PLANS.PASS_FAMILY
    | PLANS.PASS_LIFETIME
    | PLANS.PASS_PRO
    | PLANS.PASS_BUSINESS
    | PLANS.VPN_PASS_BUNDLE_BUSINESS
    | PLANS.LUMO
    | PLANS.LUMO_BUSINESS
    | PLANS.VPN_PRO
    | PLANS.DRIVE_PRO
    | PLANS.DRIVE_BUSINESS;

interface Props extends ComponentPropsWithoutRef<'img'> {
    app?: APP_NAMES;
    planName?: CustomLogoPlanName;
    size?: number;
    dark?: boolean;
    'data-testid'?: string;
}

const getSrc = ({ planName, app, dark }: Pick<Props, 'planName' | 'app' | 'dark'>) => {
    if (planName === PLANS.VPN2024) {
        return vpn;
    }
    if (planName === PLANS.MAIL) {
        return mail;
    }
    if (planName === PLANS.DRIVE) {
        return drive;
    }
    if (planName === PLANS.DRIVE_1TB) {
        return drive;
    }
    if (planName === PLANS.PASS) {
        return pass;
    }
    if (planName === PLANS.BUNDLE) {
        return bundle;
    }
    if (planName === PLANS.DUO) {
        return duo;
    }
    if (planName === PLANS.FAMILY) {
        return family;
    }
    if (planName === PLANS.VISIONARY) {
        return visionary;
    }
    if (planName === PLANS.PASS_FAMILY) {
        return passFamily;
    }
    if (planName === PLANS.PASS_LIFETIME) {
        return passLifetime;
    }
    if (planName === PLANS.VPN_BUSINESS) {
        return vpnBusiness;
    }
    if (planName === PLANS.BUNDLE_PRO_2024) {
        return workspace;
    }
    if (planName === PLANS.BUNDLE_BIZ_2025) {
        return workspacePremium;
    }
    if ((planName === PLANS.VPN_PASS_BUNDLE || planName === PLANS.VPN_PASS_BUNDLE_BUSINESS) && dark) {
        return vpnPassBundleDark;
    }
    if (planName === PLANS.VPN_PASS_BUNDLE || planName === PLANS.VPN_PASS_BUNDLE_BUSINESS) {
        return vpnPassBundle;
    }
    if (planName === PLANS.MEET) {
        return meet;
    }
    if (planName === PLANS.MEET_BUSINESS) {
        return meetBusiness;
    }
    if (planName === PLANS.LUMO) {
        return lumoPlus;
    }
    if (planName === PLANS.LUMO_BUSINESS) {
        return lumoBusiness;
    }
    if (planName === PLANS.VPN_PRO) {
        return vpnPro;
    }
    if (planName === PLANS.DRIVE_PRO) {
        return drivePro;
    }
    if (planName === PLANS.DRIVE_BUSINESS) {
        return driveBusiness;
    }
    if (planName === PLANS.MAIL_PRO) {
        return mailPro;
    }
    if (planName === PLANS.MAIL_BUSINESS) {
        return mailBusiness;
    }
    if (planName === PLANS.PASS_PRO) {
        return passPro;
    }
    if (planName === PLANS.PASS_BUSINESS) {
        return passBusiness;
    }

    // Temporary fix to use Mail's logo for calendar until design creates one.
    if (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR) {
        return mailFree;
    }
    if (app === APPS.PROTONPASS) {
        return passFree;
    }
    if (app === APPS.PROTONVPN_SETTINGS) {
        return vpnFree;
    }
    if (app === APPS.PROTONDRIVE) {
        return driveFree;
    }
    if (app === APPS.PROTONMEET) {
        return meetFree;
    }
    if (app === APPS.PROTONLUMO) {
        return lumoFree;
    }

    if (!planName) {
        return genericFree;
    }

    return null;
};

const CustomLogo = ({ planName, app, size, dark, 'data-testid': dataTestId = 'plan-logo', ...rest }: Props) => {
    const src = getSrc({ planName, app, dark });

    if (!src) {
        return null;
    }

    return <img {...rest} src={src} width={size} alt="" className="w-full" data-testid={dataTestId} />;
};

export default CustomLogo;
