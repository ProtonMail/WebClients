import type { ComponentPropsWithoutRef } from 'react';

import { PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import bundle from './logo/plan-bundle.svg';
import protonBusinessSuite from './logo/plan-business-suite.svg';
import driveFree from './logo/plan-drive-free.svg';
import duo from './logo/plan-duo.svg';
import family from './logo/plan-family.svg';
import mailFree from './logo/plan-mail-free.svg';
import passFamily from './logo/plan-pass-family.svg';
import passFreeDark from './logo/plan-pass-free-dark.svg';
import passFreeLight from './logo/plan-pass-free-light.svg';
import passLifetime from './logo/plan-pass-lifetime.svg';
import vpnBusiness from './logo/plan-vpn-business.svg';
import vpnFree from './logo/plan-vpn-free.svg';
import vpnPassBundleDark from './logo/plan-vpn-pass-bundle-dark.svg';
import vpnPassBundle from './logo/plan-vpn-pass-bundle.svg';

interface Props extends ComponentPropsWithoutRef<'img'> {
    app?: APP_NAMES;
    planName?:
        | PLANS.BUNDLE
        | PLANS.DUO
        | PLANS.FAMILY
        | PLANS.VPN_BUSINESS
        | PLANS.BUNDLE_PRO_2024
        | PLANS.VPN_PASS_BUNDLE
        | PLANS.PASS_FAMILY
        | PLANS.PASS_LIFETIME;
    size?: number;
    dark?: boolean;
}

const CustomLogo = ({ planName, app, size, dark, ...rest }: Props) => {
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
        return <img {...rest} src={protonBusinessSuite} width={size} alt="" />;
    }
    if (planName === PLANS.VPN_PASS_BUNDLE && dark) {
        return <img {...rest} src={vpnPassBundleDark} width={size} alt="" />;
    }
    if (planName === PLANS.VPN_PASS_BUNDLE) {
        return <img {...rest} src={vpnPassBundle} width={size} alt="" />;
    }
    // Temporary fix to use Mail's logo for calendar until design creates one.
    if (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR) {
        return <img {...rest} src={mailFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONPASS && dark) {
        return <img {...rest} src={passFreeDark} width={size} alt="" />;
    }
    if (app === APPS.PROTONPASS) {
        return <img {...rest} src={passFreeLight} width={size} alt="" />;
    }
    if (app === APPS.PROTONVPN_SETTINGS) {
        return <img {...rest} src={vpnFree} width={size} alt="" />;
    }
    if (app === APPS.PROTONDRIVE) {
        return <img {...rest} src={driveFree} width={size} alt="" />;
    }
    return null;
};

export default CustomLogo;
