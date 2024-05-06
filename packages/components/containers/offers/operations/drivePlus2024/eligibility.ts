import { fromUnixTime, isBefore } from 'date-fns';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

const FREE_DOWNGRADER_LIMIT = new Date(Date.UTC(2024, 4, 0, 0, 0, 0)); // 2024-05-01

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    lastSubscriptionEnd?: number;
}

const isEligible = ({ user, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE) ||
        protonConfig.APP_NAME === APPS.PROTONDRIVE;
    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;

    return (
        hasValidApp &&
        canPay &&
        notDelinquent &&
        isFree &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};

export default isEligible;
