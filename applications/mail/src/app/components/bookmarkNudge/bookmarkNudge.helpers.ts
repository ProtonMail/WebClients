import { fromUnixTime, isBefore } from 'date-fns';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

/**
 * Only accounts created on or after this date are in the test.
 * Must be set to the day the experiment starts before turning `BookmarkNudgeExperiment` on.
 */
export const BOOKMARK_NUDGE_START_DATE = new Date(Date.UTC(2026, 10, 24));

export const getIsUserEligible = (user: Pick<UserModel, 'CreateTime'>, isWelcomeDone: boolean) => {
    // Bookmarks are a desktop browser habit: no mobile web, no desktop app
    if (isMobile() || isElectronApp) {
        return false;
    }

    // Wait until the welcome onboarding is finished so the nudge never stacks on it
    if (!isWelcomeDone) {
        return false;
    }

    // On or after the start date
    return !isBefore(fromUnixTime(user.CreateTime), BOOKMARK_NUDGE_START_DATE);
};
