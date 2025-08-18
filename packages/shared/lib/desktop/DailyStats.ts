import { z } from 'zod';

import { RELEASE_CATEGORIES } from '@proton/shared/lib/constants';

import { zDefaultProtocolChanged, zIsDefaultProtocol } from './DefaultProtocol';

const zReleaseCategory = z.nativeEnum(RELEASE_CATEGORIES);

const zDailyStatsDimensions = z.object({
    releaseCategory: zReleaseCategory,
    isDefaultMailto: zIsDefaultProtocol,
    isDefaultMailtoChanged: zDefaultProtocolChanged,
});
export type DailyStatsDimensions = z.infer<typeof zDailyStatsDimensions>;

const zDailyStatsValues = z.object({
    mailtoClicks: z.number(),
    switchViewMailToCalendar: z.number(),
    switchViewCalendarToMail: z.number(),
    userLogin: z.number(),
    userLogout: z.number(),
});
export type DailyStatsValues = z.infer<typeof zDailyStatsValues>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const zDailyStatsStored = zDailyStatsDimensions.merge(zDailyStatsValues).extend({ lastReport: z.number() });
export type DailyStatsStored = z.infer<typeof zDailyStatsStored>;

export const zDailyStatsReport = z.object({
    dimensions: zDailyStatsDimensions,
    values: zDailyStatsValues,
});
export type DailyStatsReport = z.infer<typeof zDailyStatsReport>;
