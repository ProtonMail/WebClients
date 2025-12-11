import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useFeature } from '@proton/features';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import { useFlag } from '@proton/unleash';

import { getFeatureCode, isAccountOlderThanMinimum } from './helpers';
import type { NPSApplication } from './interface';

const MINIMUM_ACCOUNT_AGE_DAYS = 30;

export const useNPSEligiblity = (application: NPSApplication) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const enabledWebNPSModal = useFlag('WebNPSModal');

    const featureCode = getFeatureCode(application);
    const { feature } = useFeature(featureCode);

    const accountOlderThan30Days = isAccountOlderThanMinimum(user.CreateTime, MINIMUM_ACCOUNT_AGE_DAYS);

    return (
        hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS) &&
        accountOlderThan30Days &&
        enabledWebNPSModal &&
        feature?.Value
    );
};
