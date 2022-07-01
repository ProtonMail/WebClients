import { c, msgid } from 'ttag';
import { CALENDAR_APP_NAME, PLAN_SERVICES, PLANS } from '@proton/shared/lib/constants';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

const getCreateText = (n: number) => {
    return c('new_plans: tooltip').ngettext(
        msgid`Create up to ${n} custom calendar.`,
        `Create up to ${n} custom calendars.`,
        n
    );
};

const getAddText = (n: number, audience?: Audience) => {
    if (audience === Audience.B2B) {
        return c('new_plans: tooltip')
            .t`On top of that, add up to 5 calendars from colleagues, organizations, family, and friends.`;
    }
    return c('new_plans: tooltip')
        .t`On top of that, add up to 5 calendars from friends, family, colleagues, and organizations.`;
};

export const getNCalendarsFeature = (n: number, audience?: Audience): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} personal calendar`, `${n} personal calendars`, n),
        tooltip: n > 1 ? `${getCreateText(n)} ${getAddText(n, audience)}` : '',
        included: true,
        icon: 'calendar-checkmark',
    };
};

const getEndToEndEncryption = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`End-to-end encryption`,
        tooltip: '',
        included: true,
    };
};

const getShareFeature = (plansMap: PlansMap, plan: PLANS, audience?: Audience): PlanCardFeatureDefinition => {
    const included = hasBit(plansMap[plan]?.Services, PLAN_SERVICES.MAIL);

    return {
        featureName: c('new_plans: feature').t`Share calendar via link`,
        tooltip:
            audience === Audience.B2B
                ? c('new_plans: tooltip')
                      .t`Easily share your calendars with your colleagues, family, and friends via a link`
                : c('new_plans: tooltip')
                      .t`Easily share your calendars with your family, friends, or colleagues via a link`,
        included,
    };
};

const getInvitation = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Send & receive invitations`,
        tooltip: '',
        included: true,
    };
};

export const getCalendarAppFeature = (): PlanCardFeatureDefinition => {
    return {
        featureName: CALENDAR_APP_NAME,
        tooltip: c('new_plans: tooltip').t`End-to-end encrypted calendar`,
        included: true,
        icon: 'brand-proton-calendar',
    };
};

export const getCalendarFeatures = (plansMap: PlansMap): PlanCardFeature[] => {
    return [
        {
            name: 'calendars',
            plans: {
                [PLANS.FREE]: getNCalendarsFeature(1),
                [PLANS.BUNDLE]: getNCalendarsFeature(plansMap[PLANS.BUNDLE]?.MaxCalendars || MAX_CALENDARS_PAID),
                [PLANS.MAIL]: getNCalendarsFeature(plansMap[PLANS.MAIL]?.MaxCalendars || MAX_CALENDARS_PAID),
                [PLANS.VPN]: getNCalendarsFeature(plansMap[PLANS.VPN]?.MaxCalendars || MAX_CALENDARS_FREE),
                [PLANS.DRIVE]: getNCalendarsFeature(plansMap[PLANS.DRIVE]?.MaxCalendars || MAX_CALENDARS_FREE),
                [PLANS.FAMILY]: getNCalendarsFeature(plansMap[PLANS.FAMILY]?.MaxCalendars || 100),
                [PLANS.BUNDLE_PRO]: getNCalendarsFeature(
                    plansMap[PLANS.BUNDLE_PRO]?.MaxCalendars || MAX_CALENDARS_PAID,
                    Audience.B2B
                ),
                [PLANS.MAIL_PRO]: getNCalendarsFeature(
                    plansMap[PLANS.MAIL_PRO]?.MaxCalendars || MAX_CALENDARS_PAID,
                    Audience.B2B
                ),
            },
        },
        {
            name: 'encryption',
            plans: {
                [PLANS.FREE]: getEndToEndEncryption(),
                [PLANS.BUNDLE]: getEndToEndEncryption(),
                [PLANS.MAIL]: getEndToEndEncryption(),
                [PLANS.VPN]: getEndToEndEncryption(),
                [PLANS.DRIVE]: getEndToEndEncryption(),
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
            },
        },
        {
            name: 'share',
            plans: {
                [PLANS.FREE]: getShareFeature(plansMap, PLANS.FREE),
                [PLANS.BUNDLE]: getShareFeature(plansMap, PLANS.BUNDLE),
                [PLANS.MAIL]: getShareFeature(plansMap, PLANS.MAIL),
                [PLANS.VPN]: getShareFeature(plansMap, PLANS.VPN),
                [PLANS.DRIVE]: getShareFeature(plansMap, PLANS.DRIVE),
                [PLANS.FAMILY]: getShareFeature(plansMap, PLANS.FAMILY),
                [PLANS.BUNDLE_PRO]: getShareFeature(plansMap, PLANS.BUNDLE_PRO, Audience.B2B),
                [PLANS.MAIL_PRO]: getShareFeature(plansMap, PLANS.MAIL_PRO, Audience.B2B),
            },
        },
        {
            name: 'invitation',
            plans: {
                [PLANS.FREE]: getInvitation(),
                [PLANS.BUNDLE]: getInvitation(),
                [PLANS.MAIL]: getInvitation(),
                [PLANS.VPN]: getInvitation(),
                [PLANS.DRIVE]: getInvitation(),
                [PLANS.FAMILY]: getInvitation(),
                [PLANS.BUNDLE_PRO]: getInvitation(),
                [PLANS.MAIL_PRO]: getInvitation(),
            },
        },
    ];
};
