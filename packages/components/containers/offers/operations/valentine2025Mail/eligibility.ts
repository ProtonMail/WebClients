import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
}

const allowedApp = new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);

export const getIsEligible = ({ user, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        allowedApp.has(protonConfig?.APP_NAME) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && allowedApp.has(parentApp ?? ''));

    return isValidApp && user.isFree && !user.isDelinquent;
};
