import { fromUnixTime, isBefore } from 'date-fns';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';

interface Props {
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd?: number;
}

const isEligible = ({ subscription, protonConfig, user, lastSubscriptionEnd = 0 }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);
    const hasTrial = isTrial(subscription);

    return (
        hasValidApp &&
        isNotExternal &&
        canPay &&
        notDelinquent &&
        (hasTrial || (isFree && isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)))
    );
};

export default isEligible;
