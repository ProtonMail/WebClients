import type { ComponentPropsWithoutRef } from 'react';

import { PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import bundle from './logo/plan-bundle.svg';
import driveFree from './logo/plan-drive-free.svg';
import duo from './logo/plan-duo.svg';
import family from './logo/plan-family.svg';
import mailFree from './logo/plan-mail-free.svg';
import passFreeDark from './logo/plan-pass-free-dark.svg';
import passFreeLight from './logo/plan-pass-free-light.svg';
import vpnBusiness from './logo/plan-vpn-business.svg';
import vpnFree from './logo/plan-vpn-free.svg';

interface Props extends ComponentPropsWithoutRef<'img'> {
    app?: APP_NAMES;
    planName?: PLANS.BUNDLE | PLANS.DUO | PLANS.FAMILY | PLANS.VPN_BUSINESS;
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
    if (planName === PLANS.VPN_BUSINESS) {
        return <img {...rest} src={vpnBusiness} width={size} alt="" />;
    }
    if (app === APPS.PROTONMAIL) {
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
