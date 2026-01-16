import type { ComponentPropsWithoutRef } from 'react';

import { PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import bundle from './logo/plan-bundle.svg';
import driveFree from './logo/plan-drive-free.svg';
import drive from './logo/plan-drive.svg';
import duo from './logo/plan-duo.svg';
import family from './logo/plan-family.svg';
import lumoBusiness from './logo/plan-lumo-business.svg';
import lumoFree from './logo/plan-lumo-free.svg';
import lumoPlus from './logo/plan-lumo-plus.svg';
import mailFree from './logo/plan-mail-free.svg';
import mail from './logo/plan-mail.svg';
import meetBusiness from './logo/plan-meet-business.svg';
import meetFree from './logo/plan-meet-free.svg';
import passFamily from './logo/plan-pass-family.svg';
import passFree from './logo/plan-pass-free-light.svg';
import passLifetime from './logo/plan-pass-lifetime.svg';
import pass from './logo/plan-pass.svg';
import vpnBusiness from './logo/plan-vpn-business.svg';
import vpnFree from './logo/plan-vpn-free.svg';
import vpnPassBundleDark from './logo/plan-vpn-pass-bundle-dark.svg';
import vpnPassBundle from './logo/plan-vpn-pass-bundle.svg';
import vpn from './logo/plan-vpn.svg';
import workspacePremium from './logo/plan-workspace-premium.svg';
import workspace from './logo/plan-workspace.svg';

interface Props extends ComponentPropsWithoutRef<'img'> {
    app?: APP_NAMES;
    planName?:
        | PLANS.VPN2024
        | PLANS.MAIL
        | PLANS.PASS
        | PLANS.DRIVE
        | PLANS.BUNDLE
        | PLANS.BUNDLE_PRO
        | PLANS.DUO
        | PLANS.FAMILY
        | PLANS.VPN_BUSINESS
        | PLANS.BUNDLE_PRO_2024
        | PLANS.BUNDLE_BIZ_2025
        | PLANS.MEET_BUSINESS
        | PLANS.VPN_PASS_BUNDLE
        | PLANS.PASS_FAMILY
        | PLANS.PASS_LIFETIME
        | PLANS.VPN_PASS_BUNDLE_BUSINESS
        | PLANS.LUMO
        | PLANS.LUMO_BUSINESS;
    size?: number;
    dark?: boolean;
}

const CustomLogo = ({ planName, app, size, dark, ...rest }: Props) => {
    if (planName === PLANS.VPN2024) {
        return <img {...rest} src={vpn} width={size} alt="" />;
    }
    if (planName === PLANS.MAIL) {
        return <img {...rest} src={mail} width={size} alt="" />;
    }
    if (planName === PLANS.DRIVE) {
        return <img {...rest} src={drive} width={size} alt="" />;
    }
    if (planName === PLANS.PASS) {
        return <img {...rest} src={pass} width={size} alt="" />;
    }
    if (planName === PLANS.BUNDLE) {
        return <img {...rest} src={bundle} width={size} alt="" />;
    }
    if (planName === PLANS.DUO) {
        return <img {...rest} src={duo} width={size} alt="" />;
    }
    if (planName === PLANS.FAMILY) {
        return <img {...rest} src={family} width={size} alt="" />;
    }
    if (planName === PLANS.PASS_FAMILY) {
        return <img {...rest} src={passFamily} width={size} alt="" />;
    }
    if (planName === PLANS.PASS_LIFETIME) {
        return <img {...rest} src={passLifetime} width={size} alt="" />;
    }
    if (planName === PLANS.VPN_BUSINESS) {
        return <img {...rest} src={vpnBusiness} width={size} alt="" />;
    }
    if (planName === PLANS.BUNDLE_PRO_2024) {
        return <img {...rest} src={workspace} width={size} alt="" />;
    }
    if (planName === PLANS.BUNDLE_BIZ_2025) {
        return <img {...rest} src={workspacePremium} width={size} alt="" />;
    }
    if ((planName === PLANS.VPN_PASS_BUNDLE || planName === PLANS.VPN_PASS_BUNDLE_BUSINESS) && dark) {
        return <img {...rest} src={vpnPassBundleDark} width={size} alt="" />;
    }
    if (planName === PLANS.VPN_PASS_BUNDLE || planName === PLANS.VPN_PASS_BUNDLE_BUSINESS) {
        return <img {...rest} src={vpnPassBundle} width={size} alt="" />;
    }
    if (planName === PLANS.MEET_BUSINESS) {
        return <img {...rest} src={meetBusiness} width={size} alt="" />;
    }
    if (planName === PLANS.LUMO) {
        return <img {...rest} src={lumoPlus} width={size} alt="" />;
    }
    if (planName === PLANS.LUMO_BUSINESS) {
        return <img {...rest} src={lumoBusiness} width={size} alt="" />;
    }
    // Temporary fix to use Mail's logo for calendar until design creates one.
    if (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR) {
        return <img {...rest} src={mailFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONPASS) {
        return <img {...rest} src={passFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONVPN_SETTINGS) {
        return <img {...rest} src={vpnFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONDRIVE) {
        return <img {...rest} src={driveFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONMEET) {
        return <img {...rest} src={meetFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONLUMO) {
        return <img {...rest} src={lumoFree} width={size} alt="" />;
    }
    return null;
};

export default CustomLogo;
