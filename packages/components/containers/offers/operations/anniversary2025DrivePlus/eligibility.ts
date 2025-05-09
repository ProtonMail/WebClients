import { fromUnixTime, isBefore } from 'date-fns';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd: number;
}

export const getIsEligible = ({ user, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);

    return (
        hasValidApp &&
        user.isFree &&
        user.canPay &&
        !user.isDelinquent &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};
