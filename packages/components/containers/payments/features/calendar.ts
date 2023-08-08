import { c, msgid } from 'ttag';

import { MAX_CALENDARS_FAMILY, MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME, FAMILY_MAX_USERS, PLANS, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

const getNCalendarsTooltipText = (n: number) => {
    return c('new_plans: tooltip').ngettext(
        msgid`Create up to ${n} calendar or add calendars from friends, family, colleagues, and organizations`,
        `Create up to ${n} calendars or add calendars from friends, family, colleagues, and organizations`,
        n
    );
};

export const getNCalendarToCreateFeature = (n: number): PlanCardFeatureDefinition => ({
    icon: 'brand-proton-calendar',
    included: true,
    text: c('new_plans: Upsell attribute').ngettext(
        msgid`Create up to ${n} calendar`,
        `Create up to ${n} calendars`,
        n
    ),
});

export const getNCalendarsFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} calendar`, `${n} calendars`, n),
        tooltip: n > 1 ? getNCalendarsTooltipText(n) : '',
        included: true,
        icon: 'brand-proton-calendar',
    };
};

export const getNCalendarsPerUserFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} calendar per user`, `${n} calendars per user`, n),
        tooltip: n > 1 ? getNCalendarsTooltipText(n) : '',
        included: true,
        icon: 'brand-proton-calendar',
    };
};

const getEndToEndEncryption = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`End-to-end encryption`,
        included: true,
    };
};

const getShareFeature = (
    plansMap: PlansMap,
    plan: PLANS,
    calendarSharingEnabled: boolean,
    audience?: Audience
): PlanCardFeatureDefinition => {
    const included = hasBit(plansMap[plan]?.Services, PLAN_SERVICES.MAIL);

    const tooltipText = calendarSharingEnabled
        ? c('new_plans: tooltip').t`Easily share your calendars with your family, friends, or colleagues`
        : c('new_plans: tooltip').t`Easily share your calendars with your colleagues, family, and friends via a link`;

    return {
        text: calendarSharingEnabled
            ? c('new_plans: feature').t`Calendar sharing`
            : c('new_plans: feature').t`Share calendar via link`,
        tooltip: audience === Audience.B2B ? tooltipText : tooltipText,
        included,
    };
};

const getInvitation = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Send & receive invitations`,
        included: true,
    };
};

export const getCalendarAppFeature = (options?: { family?: boolean }): PlanCardFeatureDefinition => {
    return {
        text: CALENDAR_APP_NAME,
        tooltip: options?.family
            ? c('new_plans: tooltip').t`Keep your plans private to you and your family with an encrypted calendar`
            : c('new_plans: tooltip').t`${CALENDAR_APP_NAME}: end-to-end encrypted calendar`,
        included: true,
        icon: 'brand-proton-calendar',
    };
};

export const getCalendarFeatures = (plansMap: PlansMap, calendarSharingEnabled: boolean): PlanCardFeature[] => {
    return [
        {
            name: 'calendars',
            plans: {
                [PLANS.FREE]: getNCalendarsFeature(MAX_CALENDARS_FREE),
                // TODO: Order should be inverted in ORs of the inputs of getNCalendarsFeature below (B || A instead of A || B). The limits need to be changed API-side for that though. Only after that this TODO can be tackled
                [PLANS.BUNDLE]: getNCalendarsFeature(MAX_CALENDARS_PAID || plansMap[PLANS.BUNDLE]?.MaxCalendars),
                [PLANS.MAIL]: getNCalendarsFeature(MAX_CALENDARS_PAID || plansMap[PLANS.MAIL]?.MaxCalendars),
                [PLANS.VPN]: getNCalendarsFeature(MAX_CALENDARS_FREE || plansMap[PLANS.VPN]?.MaxCalendars),
                [PLANS.DRIVE]: getNCalendarsFeature(MAX_CALENDARS_FREE || plansMap[PLANS.DRIVE]?.MaxCalendars),
                [PLANS.PASS_PLUS]: getNCalendarsFeature(MAX_CALENDARS_FREE || plansMap[PLANS.PASS_PLUS]?.MaxCalendars),
                [PLANS.FAMILY]: getNCalendarsPerUserFeature(
                    Math.floor((MAX_CALENDARS_FAMILY ?? plansMap[PLANS.FAMILY]?.MaxCalendars) / FAMILY_MAX_USERS)
                ),
                [PLANS.BUNDLE_PRO]: getNCalendarsFeature(
                    MAX_CALENDARS_PAID || plansMap[PLANS.BUNDLE_PRO]?.MaxCalendars
                ),
                [PLANS.MAIL_PRO]: getNCalendarsFeature(MAX_CALENDARS_PAID || plansMap[PLANS.MAIL_PRO]?.MaxCalendars),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.PASS_PLUS]: getEndToEndEncryption(),
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'share',
            plans: {
                [PLANS.FREE]: getShareFeature(plansMap, PLANS.FREE, calendarSharingEnabled),
                [PLANS.BUNDLE]: getShareFeature(plansMap, PLANS.BUNDLE, calendarSharingEnabled),
                [PLANS.MAIL]: getShareFeature(plansMap, PLANS.MAIL, calendarSharingEnabled),
                [PLANS.VPN]: getShareFeature(plansMap, PLANS.VPN, calendarSharingEnabled),
                [PLANS.DRIVE]: getShareFeature(plansMap, PLANS.DRIVE, calendarSharingEnabled),
                [PLANS.PASS_PLUS]: getShareFeature(plansMap, PLANS.PASS_PLUS, calendarSharingEnabled),
                [PLANS.FAMILY]: getShareFeature(plansMap, PLANS.FAMILY, calendarSharingEnabled),
                [PLANS.BUNDLE_PRO]: getShareFeature(plansMap, PLANS.BUNDLE_PRO, calendarSharingEnabled, Audience.B2B),
                [PLANS.MAIL_PRO]: getShareFeature(plansMap, PLANS.MAIL_PRO, calendarSharingEnabled, Audience.B2B),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.PASS_PLUS]: getInvitation(),
                [PLANS.FAMILY]: getInvitation(),
                [PLANS.BUNDLE_PRO]: getInvitation(),
                [PLANS.MAIL_PRO]: getInvitation(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
