import { differenceInDays, fromUnixTime } from 'date-fns';

import { domIsBusy } from '@proton/shared/lib/busy';
import { APPS } from '@proton/shared/lib/constants';
import { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
}

const ACCOUNT_AGE_DAY_THESHOLD = 14;

const isEligible = ({ user, protonConfig }: Props) => {
    const { isFree, isDelinquent, CreateTime } = user;
    const isNotDelinquent = !isDelinquent;
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONMAIL;

    const createTimeDate = fromUnixTime(CreateTime);
    const isAccountOlderThanTheshold = differenceInDays(new Date(), createTimeDate) >= ACCOUNT_AGE_DAY_THESHOLD;

    const isDomBusy = domIsBusy();

    return isFree && isNotDelinquent && hasValidApp && isAccountOlderThanTheshold && !isDomBusy;
};

export default isEligible;
