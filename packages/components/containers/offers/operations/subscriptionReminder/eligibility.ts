import { differenceInDays, fromUnixTime, isAfter } from 'date-fns';

import { domIsBusy } from '@proton/shared/lib/busy';
import { APPS } from '@proton/shared/lib/constants';
import { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    minimalCreationTime: number;
}

const ACCOUNT_AGE_DAY_THESHOLD = 14;

const isEligible = ({ user, protonConfig, minimalCreationTime }: Props) => {
    const { isFree, isDelinquent, CreateTime } = user;
    const isNotDelinquent = !isDelinquent;
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONMAIL;

    const createTimeDate = fromUnixTime(CreateTime);
    const minimalCreationTimeDate = fromUnixTime(minimalCreationTime);
    const isAccountOlderThanTheshold = differenceInDays(new Date(), createTimeDate) >= ACCOUNT_AGE_DAY_THESHOLD;
    const isAccountCreatedBeforeMinimalCreationTime = isAfter(createTimeDate, minimalCreationTimeDate);
    //True if the account is older than the threshold and was created after the minimal creation time
    const isAccountOldEnough = isAccountOlderThanTheshold && isAccountCreatedBeforeMinimalCreationTime;

    const isDomBusy = domIsBusy();

    return isFree && isNotDelinquent && hasValidApp && isAccountOldEnough && !isDomBusy;
};

export default isEligible;
