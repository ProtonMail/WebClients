import { differenceInMonths, fromUnixTime } from 'date-fns';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { hasBundle, hasTwoYears } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';
import percentage from '@proton/utils/percentage';

interface Props {
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

const isEligible = ({ subscription, user, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasUnlimited = hasBundle(subscription);
    const hasTwoYear = hasTwoYears(subscription);

    const { maxSpace, usedSpace } = getAppSpace(getSpace(user), APPS.PROTONMAIL);
    const isUsingMoreThan80PercentStorage = percentage(maxSpace, usedSpace) > 80;

    const moreThan6Monthsubscription = differenceInMonths(Date.now(), fromUnixTime(subscription?.CreateTime || 0)) >= 6;

    // check storage and duration
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent } = user;
    const notDelinquent = !isDelinquent;

    return (
        hasValidApp &&
        canPay &&
        notDelinquent &&
        hasUnlimited &&
        hasTwoYear &&
        (isUsingMoreThan80PercentStorage || moreThan6Monthsubscription)
    );
};

export default isEligible;
