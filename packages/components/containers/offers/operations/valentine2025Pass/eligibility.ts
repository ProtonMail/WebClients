import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
}

export const getIsEligible = ({ user, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        protonConfig?.APP_NAME === APPS.PROTONPASS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS);

    return isValidApp && user.isFree && !user.isDelinquent;
};
