import { differenceInDays, fromUnixTime } from 'date-fns';

import { FeatureCode } from '@proton/features';

import { NPSApplication } from './interface';

export const NPS_FEATURE_CODE_MAP: Record<NPSApplication, FeatureCode> = {
    [NPSApplication.WebMail]: FeatureCode.NPSFeedbackWebMail,
    [NPSApplication.WebCalendar]: FeatureCode.NPSFeedbackWebCalendar,
    [NPSApplication.DesktopMail]: FeatureCode.NPSFeedbackDesktopMail,
    [NPSApplication.DesktopCalendar]: FeatureCode.NPSFeedbackDesktopCalendar,
};

export const getFeatureCode = (application: NPSApplication): FeatureCode => {
    return NPS_FEATURE_CODE_MAP[application];
};

export function isAccountOlderThanMinimum(createTime: number | undefined, minimumDays: number): boolean {
    const accountCreateTime = createTime ? fromUnixTime(createTime) : new Date();
    const daysSinceAccountCreation = accountCreateTime ? differenceInDays(new Date(), accountCreateTime) : 0;
    return daysSinceAccountCreation >= minimumDays;
}
