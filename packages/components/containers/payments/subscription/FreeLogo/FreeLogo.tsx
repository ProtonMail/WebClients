import type { ComponentPropsWithoutRef } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import driveFree from './plan-drive-free.svg';
import mailFree from './plan-mail-free.svg';
import passFreeDark from './plan-pass-free-dark.svg';
import passFreeLight from './plan-pass-free-light.svg';
import vpnFree from './plan-vpn-free.svg';

const getLogo = (src: string, size: number | undefined, rest: any) => (
    // Magic padding to align with normal SVG logos
    <img {...rest} src={src} width={size} style={{ padding: 2 }} alt="" />
);

interface Props extends ComponentPropsWithoutRef<'img'> {
    app: APP_NAMES;
    size?: number;
    dark?: boolean;
}

const FreeLogo = ({ app, size, dark, ...rest }: Props) => {
    if (app === APPS.PROTONMAIL) {
        return getLogo(mailFree, size, rest);
    }
    if (app === APPS.PROTONPASS) {
        // Ugh please make this svg compatible on both light and dark
        return getLogo(dark ? passFreeDark : passFreeLight, size, rest);
    }
    if (app === APPS.PROTONVPN_SETTINGS) {
        return getLogo(vpnFree, size, rest);
    }
    if (app === APPS.PROTONDRIVE) {
        return getLogo(driveFree, size, rest);
    }
    return null;
};

export default FreeLogo;
