import { fromUnixTime, isBefore } from 'date-fns';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

const FREE_DOWNGRADER_LIMIT = new Date(Date.UTC(2024, 2, 19, 0, 0, 0)); // 2024-03-19

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    previousSubscriptionEndTime?: number;
}

export const getIsEligible = ({ user, protonConfig, previousSubscriptionEndTime = 0 }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;

    return (
        hasValidApp &&
        canPay &&
        notDelinquent &&
        isFree &&
        isBefore(fromUnixTime(previousSubscriptionEndTime), FREE_DOWNGRADER_LIMIT)
    );
};
