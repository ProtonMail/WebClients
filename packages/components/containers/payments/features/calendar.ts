import { c, msgid } from 'ttag';

import {
    MAX_CALENDARS_DUO,
    MAX_CALENDARS_FAMILY,
    MAX_CALENDARS_FREE,
    MAX_CALENDARS_PAID,
} from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME, DUO_MAX_USERS, FAMILY_MAX_USERS, PLANS, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { PlansMap } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

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

export const getNCalendarsText = (n: number) => {
    return c('new_plans: feature').ngettext(msgid`${n} calendar`, `${n} calendars`, n);
};

export const getNCalendarsFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        text: getNCalendarsText(n),
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

const getShareFeature = (plansMap: PlansMap, plan: PLANS, audience?: Audience): PlanCardFeatureDefinition => {
    const included = hasBit(plansMap[plan]?.Services, PLAN_SERVICES.MAIL);

    const tooltipText = c('new_plans: tooltip').t`Easily share your calendars with your family, friends, or colleagues`;

    return {
        text: c('new_plans: feature').t`Calendar sharing`,
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

const getTeamAvailability = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`See team's availability`,
        tooltip: c('new_plans: tooltip')
            .t`See the availability of meeting participants and save time scheduling meetings`,
        included: true,
    };
};

export const getCalendarAppFeature = (options?: { family?: boolean; duo?: boolean }): PlanCardFeatureDefinition => {
    let tooltip = c('new_plans: tooltip')
        .t`${CALENDAR_APP_NAME}: Secure your schedule with end-to-end encryption. Includes support for custom calendars, calendar sharing, and more.`;

    if (options?.duo || options?.family) {
        tooltip = c('new_plans: tooltip').t`Keep your plans private to you and your family with an encrypted calendar`;
    }

    return {
        text: CALENDAR_APP_NAME,
        tooltip,
        included: true,
        icon: 'brand-proton-calendar',
    };
};

export const getCalendarFeatures = (plansMap: PlansMap): PlanCardFeature[] => {
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
                [PLANS.DRIVE_BUSINESS]: getNCalendarsFeature(
                    MAX_CALENDARS_FREE || plansMap[PLANS.DRIVE_BUSINESS]?.MaxCalendars
                ),
                [PLANS.PASS]: getNCalendarsFeature(MAX_CALENDARS_FREE || plansMap[PLANS.PASS]?.MaxCalendars),
                [PLANS.WALLET]: getNCalendarsFeature(MAX_CALENDARS_FREE || plansMap[PLANS.WALLET]?.MaxCalendars),
                [PLANS.FAMILY]: getNCalendarsPerUserFeature(
                    Math.floor((MAX_CALENDARS_FAMILY ?? plansMap[PLANS.FAMILY]?.MaxCalendars) / FAMILY_MAX_USERS)
                ),
                [PLANS.DUO]: getNCalendarsPerUserFeature(
                    Math.floor((MAX_CALENDARS_DUO ?? plansMap[PLANS.DUO]?.MaxCalendars) / DUO_MAX_USERS)
                ),
                [PLANS.BUNDLE_PRO]: getNCalendarsPerUserFeature(
                    MAX_CALENDARS_PAID || plansMap[PLANS.BUNDLE_PRO]?.MaxCalendars
                ),
                [PLANS.BUNDLE_PRO_2024]: getNCalendarsPerUserFeature(
                    MAX_CALENDARS_PAID || plansMap[PLANS.BUNDLE_PRO_2024]?.MaxCalendars
                ),
                [PLANS.MAIL_PRO]: getNCalendarsPerUserFeature(
                    MAX_CALENDARS_PAID || plansMap[PLANS.MAIL_PRO]?.MaxCalendars
                ),
                [PLANS.MAIL_BUSINESS]: getNCalendarsPerUserFeature(
                    MAX_CALENDARS_PAID || plansMap[PLANS.MAIL_BUSINESS]?.MaxCalendars
                ),
                [PLANS.PASS_PRO]: getNCalendarsFeature(MAX_CALENDARS_FREE || plansMap[PLANS.PASS_PRO]?.MaxCalendars),
                [PLANS.PASS_BUSINESS]: getNCalendarsFeature(
                    MAX_CALENDARS_FREE || plansMap[PLANS.PASS_BUSINESS]?.MaxCalendars
                ),
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
                [PLANS.DRIVE_BUSINESS]: getEndToEndEncryption(),
                [PLANS.PASS]: getEndToEndEncryption(),
                [PLANS.WALLET]: getEndToEndEncryption(),
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.DUO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO_2024]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.MAIL_BUSINESS]: getEndToEndEncryption(),
                [PLANS.PASS_PRO]: getEndToEndEncryption(),
                [PLANS.PASS_BUSINESS]: getEndToEndEncryption(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.DRIVE_BUSINESS]: getShareFeature(plansMap, PLANS.DRIVE_BUSINESS, Audience.B2B),
                [PLANS.PASS]: getShareFeature(plansMap, PLANS.PASS),
                [PLANS.WALLET]: getShareFeature(plansMap, PLANS.WALLET),
                [PLANS.FAMILY]: getShareFeature(plansMap, PLANS.FAMILY),
                [PLANS.DUO]: getShareFeature(plansMap, PLANS.DUO),
                [PLANS.BUNDLE_PRO]: getShareFeature(plansMap, PLANS.BUNDLE_PRO, Audience.B2B),
                [PLANS.BUNDLE_PRO_2024]: getShareFeature(plansMap, PLANS.BUNDLE_PRO_2024, Audience.B2B),
                [PLANS.MAIL_PRO]: getShareFeature(plansMap, PLANS.MAIL_PRO, Audience.B2B),
                [PLANS.MAIL_BUSINESS]: getShareFeature(plansMap, PLANS.MAIL_BUSINESS, Audience.B2B),
                [PLANS.PASS_PRO]: getShareFeature(plansMap, PLANS.PASS_PRO, Audience.B2B),
                [PLANS.PASS_BUSINESS]: getShareFeature(plansMap, PLANS.PASS_BUSINESS, Audience.B2B),
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
                [PLANS.DRIVE_BUSINESS]: getInvitation(),
                [PLANS.PASS]: getInvitation(),
                [PLANS.WALLET]: getInvitation(),
                [PLANS.FAMILY]: getInvitation(),
                [PLANS.DUO]: getInvitation(),
                [PLANS.BUNDLE_PRO]: getInvitation(),
                [PLANS.BUNDLE_PRO_2024]: getInvitation(),
                [PLANS.MAIL_PRO]: getInvitation(),
                [PLANS.MAIL_BUSINESS]: getInvitation(),
                [PLANS.PASS_PRO]: getInvitation(),
                [PLANS.PASS_BUSINESS]: getInvitation(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'availability',
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.WALLET]: null,
                [PLANS.FAMILY]: getTeamAvailability(),
                [PLANS.DUO]: getTeamAvailability(),
                [PLANS.BUNDLE_PRO]: getTeamAvailability(),
                [PLANS.BUNDLE_PRO_2024]: getTeamAvailability(),
                [PLANS.MAIL_PRO]: getTeamAvailability(),
                [PLANS.MAIL_BUSINESS]: getTeamAvailability(),
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
