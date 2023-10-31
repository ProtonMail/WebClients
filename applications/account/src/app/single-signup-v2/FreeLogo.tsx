import { ComponentPropsWithoutRef } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

import driveFree from './logo/plan-drive-free.svg';
import mailFree from './logo/plan-mail-free.svg';
import passFreeDark from './logo/plan-pass-free-dark.svg';
import passFreeLight from './logo/plan-pass-free-light.svg';
import vpnFree from './logo/plan-vpn-free.svg';

const getLogo = (src: string, size: number | undefined, rest: any) => <img {...rest} src={src} width={size} alt="" />;

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
