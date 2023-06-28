import { ComponentPropsWithoutRef } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

import driveFree from './logo/plan-drive-free.svg';
import mailFree from './logo/plan-mail-free.svg';
import passFree from './logo/plan-pass-free.svg';
import vpnFree from './logo/plan-vpn-free.svg';

const getLogo = (src: string, size: number | undefined, rest: any) => <img {...rest} src={src} width={size} alt="" />;

interface Props extends ComponentPropsWithoutRef<'img'> {
    app: APP_NAMES;
    size?: number;
}

const FreeLogo = ({ app, size, ...rest }: Props) => {
    if (app === APPS.PROTONMAIL) {
        return getLogo(mailFree, size, rest);
    }
    if (app === APPS.PROTONPASS) {
        return getLogo(passFree, size, rest);
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
