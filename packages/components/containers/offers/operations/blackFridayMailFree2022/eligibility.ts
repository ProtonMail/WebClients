import { fromUnixTime, isBefore } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';

interface Props {
    lastSubscriptionEnd?: number;
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const isVpnApp = protonConfig?.APP_NAME === APPS.PROTONVPN_SETTINGS;
    return (
        ((user?.isFree && isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)) ||
            isTrial(subscription)) &&
        user?.canPay &&
        !user?.isDelinquent &&
        !isVpnApp
    );
};

export default isEligible;
