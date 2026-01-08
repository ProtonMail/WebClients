import { c, msgid } from 'ttag';

import { PLANS } from '@proton/payments';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const FREE_MAX_ACTIVE_MEETINGS = 1;
export const PAID_MAX_ACTIVE_MEETINGS = 2;

export const FREE_MAX_PARTICIPANTS = 50;
export const PAID_MAX_PARTICIPANTS = 250;

export const FREE_MAX_MEETINGS_PER_DAY = 50;
export const PAID_MAX_MEETINGS_PER_DAY = 'unlimited';

export const getMeetAppFeature = (): PlanCardFeatureDefinition => {
    return {
        text: MEET_APP_NAME,
        included: true,
        tooltip: c('meet_2025: Feature')
            .t`${MEET_APP_NAME}: Confidential video conferencing for the conversations that matter`,
    };
};

export const getMeetingMaxLengthText = (type: 'free' | 'paid') => {
    if (type === 'free') {
        return c('meet_2025: Feature').t`60 minutes per meeting`;
    }
    return c('meet_2025: Feature').t`24 hours per meeting`;
};

const getMeetingMaxLength = (type: 'free' | 'paid'): PlanCardFeatureDefinition => {
    return {
        text: getMeetingMaxLengthText(type),
        included: true,
        icon: 'clock',
    };
};

export const getMaxParticipantsText = (n: number) => {
    return c('meet_2025: Feature').ngettext(msgid`Up to ${n} participant`, `Up to ${n} participants`, n);
};

const getMaxParticipants = (n: number): PlanCardFeatureDefinition => {
    return {
        text: getMaxParticipantsText(n),
        included: true,
        icon: 'users',
    };
};

export const getMaxMeetingsText = (n: number) => {
    if (n === 1) {
        return c('meet_2025: Feature').t`One active meeting at a time`;
    }
    return c('meet_2025: Feature').ngettext(msgid`${n} active meeting at a time`, `${n} active meetings at a time`, n);
};

const getMaxActiveMeetings = (n: number): PlanCardFeatureDefinition => {
    return {
        text: getMaxMeetingsText(n),
        included: true,
        icon: 'user',
    };
};

export const getMaxMeetingsPerDayText = (n: number | 'unlimited') => {
    if (n === 'unlimited') {
        return c('meet_2025: Feature').t`Unlimited meetings per day`;
    }
    return c('meet_2025: Feature').ngettext(msgid`Up to ${n} meeting per day`, `Up to ${n} meetings per day`, n);
};

const getMaxMeetingsPerDay = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text: getMaxMeetingsPerDayText(n),
        included: true,
        icon: 'calendar-list',
    };
};

export const getMeetE2EFeatureText = () => {
    return c('meet_2025: Feature').t`End-to-end encrypted screen sharing and ephemeral in-call chat`;
};

const getMeetE2E = (): PlanCardFeatureDefinition => {
    return {
        text: getMeetE2EFeatureText(),
        included: true,
        icon: 'lock',
    };
};

export const getMeetAppsText = () => {
    return c('meet_2025: Feature').t`Browser, mobile, and desktop apps`;
};

export const getMeetScreenSharingText = () => {
    return c('meet_2025: Feature').t`Screen-sharing`;
};

export const getMeetBuiltInChatText = () => {
    return c('meet_2025: Feature').t`Built-in chat`;
};

export const getMeetAppointmentSchedulingText = () => {
    return c('meet_2025: Feature').t`Appointment scheduling`;
};

const getMeetAppointmentScheduling = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: getMeetAppointmentSchedulingText(),
        included: included,
        icon: 'calendar-grid',
    };
};

export const getMeetMeetingRecordingText = () => {
    return c('meet_2025: Feature').t`Meeting recording (coming soon)`;
};

const getMeetMeetingRecording = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: getMeetMeetingRecordingText(),
        included: included,
        icon: 'video-camera',
    };
};

export const getMeetFreeFeatures = () => {
    const items: PlanCardFeatureDefinition[] = [
        getMeetingMaxLength('free'),
        getMaxParticipants(FREE_MAX_PARTICIPANTS),
        getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
        getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
    ];

    return items;
};

export const getMeetBusinessFeatures = () => {
    const items: PlanCardFeatureDefinition[] = [
        getMeetingMaxLength('paid'),
        getMaxParticipants(PAID_MAX_PARTICIPANTS),
        getMaxActiveMeetings(PAID_MAX_ACTIVE_MEETINGS),
        getMaxMeetingsPerDay('unlimited'),
    ];

    return items;
};

export const getMeetFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'max-length',
            plans: {
                [PLANS.FREE]: getMeetingMaxLength('free'),
                [PLANS.BUNDLE]: getMeetingMaxLength('free'),
                [PLANS.MAIL]: getMeetingMaxLength('free'),
                [PLANS.VPN2024]: getMeetingMaxLength('free'),
                [PLANS.DRIVE]: getMeetingMaxLength('free'),
                [PLANS.DRIVE_1TB]: getMeetingMaxLength('free'),
                [PLANS.DRIVE_BUSINESS]: getMeetingMaxLength('free'),
                [PLANS.PASS]: getMeetingMaxLength('free'),
                [PLANS.PASS_LIFETIME]: getMeetingMaxLength('free'),
                [PLANS.PASS_FAMILY]: getMeetingMaxLength('free'),
                [PLANS.FAMILY]: getMeetingMaxLength('free'),
                [PLANS.DUO]: getMeetingMaxLength('free'),
                [PLANS.MAIL_PRO]: getMeetingMaxLength('free'),
                [PLANS.MAIL_BUSINESS]: getMeetingMaxLength('free'),
                [PLANS.BUNDLE_PRO]: getMeetingMaxLength('free'),
                [PLANS.BUNDLE_PRO_2024]: getMeetingMaxLength('paid'),
                [PLANS.BUNDLE_BIZ_2025]: getMeetingMaxLength('paid'),
                [PLANS.PASS_PRO]: getMeetingMaxLength('free'),
                [PLANS.PASS_BUSINESS]: getMeetingMaxLength('free'),
                [PLANS.VPN_PRO]: getMeetingMaxLength('free'),
                [PLANS.VPN_BUSINESS]: getMeetingMaxLength('free'),
                [PLANS.LUMO]: getMeetingMaxLength('free'),
                [PLANS.LUMO_BUSINESS]: getMeetingMaxLength('free'),
                [PLANS.MEET_BUSINESS]: getMeetingMaxLength('paid'),
                [PLANS.VISIONARY]: getMeetingMaxLength('paid'),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMeetingMaxLength('free'),
            },
        },
        {
            name: 'max-participants',
            plans: {
                [PLANS.FREE]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.BUNDLE]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.MAIL]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.VPN2024]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.DRIVE]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.DRIVE_1TB]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.DRIVE_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.PASS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.PASS_LIFETIME]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.PASS_FAMILY]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.FAMILY]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.DUO]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.MAIL_PRO]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.MAIL_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.BUNDLE_PRO]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.BUNDLE_PRO_2024]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.BUNDLE_BIZ_2025]: getMaxParticipants(PAID_MAX_PARTICIPANTS),
                [PLANS.PASS_PRO]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.PASS_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.VPN_PRO]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.VPN_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.LUMO]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.LUMO_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.MEET_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
                [PLANS.VISIONARY]: getMaxParticipants(PAID_MAX_PARTICIPANTS),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMaxParticipants(FREE_MAX_PARTICIPANTS),
            },
        },
        {
            name: 'active-meetings',
            plans: {
                [PLANS.FREE]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.BUNDLE]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.MAIL]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.VPN2024]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.DRIVE]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.DRIVE_1TB]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.DRIVE_BUSINESS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.PASS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.PASS_LIFETIME]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.PASS_FAMILY]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.FAMILY]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.DUO]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.MAIL_PRO]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.MAIL_BUSINESS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.BUNDLE_PRO]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.BUNDLE_PRO_2024]: getMaxActiveMeetings(PAID_MAX_ACTIVE_MEETINGS),
                [PLANS.BUNDLE_BIZ_2025]: getMaxActiveMeetings(PAID_MAX_ACTIVE_MEETINGS),
                [PLANS.PASS_PRO]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.PASS_BUSINESS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.VPN_PRO]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.VPN_BUSINESS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.LUMO]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.LUMO_BUSINESS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
                [PLANS.MEET_BUSINESS]: getMaxActiveMeetings(PAID_MAX_ACTIVE_MEETINGS),
                [PLANS.VISIONARY]: getMaxActiveMeetings(PAID_MAX_ACTIVE_MEETINGS),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMaxActiveMeetings(FREE_MAX_ACTIVE_MEETINGS),
            },
        },
        {
            name: 'meetings-per-day',
            plans: {
                [PLANS.FREE]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.BUNDLE]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.MAIL]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.VPN2024]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.DRIVE]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.DRIVE_1TB]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.DRIVE_BUSINESS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.PASS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.PASS_LIFETIME]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.PASS_FAMILY]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.FAMILY]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.DUO]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.MAIL_PRO]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.MAIL_BUSINESS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.BUNDLE_PRO]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.BUNDLE_PRO_2024]: getMaxMeetingsPerDay(PAID_MAX_MEETINGS_PER_DAY),
                [PLANS.BUNDLE_BIZ_2025]: getMaxMeetingsPerDay(PAID_MAX_MEETINGS_PER_DAY),
                [PLANS.PASS_PRO]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.PASS_BUSINESS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.VPN_PRO]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.VPN_BUSINESS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.LUMO]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.LUMO_BUSINESS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
                [PLANS.MEET_BUSINESS]: getMaxMeetingsPerDay(PAID_MAX_MEETINGS_PER_DAY),
                [PLANS.VISIONARY]: getMaxMeetingsPerDay(PAID_MAX_MEETINGS_PER_DAY),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMaxMeetingsPerDay(FREE_MAX_MEETINGS_PER_DAY),
            },
        },
        {
            name: 'e2e-chat',
            plans: {
                [PLANS.FREE]: getMeetE2E(),
                [PLANS.BUNDLE]: getMeetE2E(),
                [PLANS.MAIL]: getMeetE2E(),
                [PLANS.VPN2024]: getMeetE2E(),
                [PLANS.DRIVE]: getMeetE2E(),
                [PLANS.DRIVE_1TB]: getMeetE2E(),
                [PLANS.DRIVE_BUSINESS]: getMeetE2E(),
                [PLANS.PASS]: getMeetE2E(),
                [PLANS.PASS_LIFETIME]: getMeetE2E(),
                [PLANS.PASS_FAMILY]: getMeetE2E(),
                [PLANS.FAMILY]: getMeetE2E(),
                [PLANS.DUO]: getMeetE2E(),
                [PLANS.MAIL_PRO]: getMeetE2E(),
                [PLANS.MAIL_BUSINESS]: getMeetE2E(),
                [PLANS.BUNDLE_PRO]: getMeetE2E(),
                [PLANS.BUNDLE_PRO_2024]: getMeetE2E(),
                [PLANS.BUNDLE_BIZ_2025]: getMeetE2E(),
                [PLANS.PASS_PRO]: getMeetE2E(),
                [PLANS.PASS_BUSINESS]: getMeetE2E(),
                [PLANS.VPN_PRO]: getMeetE2E(),
                [PLANS.VPN_BUSINESS]: getMeetE2E(),
                [PLANS.LUMO]: getMeetE2E(),
                [PLANS.LUMO_BUSINESS]: getMeetE2E(),
                [PLANS.MEET_BUSINESS]: getMeetE2E(),
                [PLANS.VISIONARY]: getMeetE2E(),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMeetE2E(),
            },
        },
        {
            name: 'scheduling',
            plans: {
                [PLANS.FREE]: getMeetAppointmentScheduling(false),
                [PLANS.BUNDLE]: getMeetAppointmentScheduling(false),
                [PLANS.MAIL]: getMeetAppointmentScheduling(false),
                [PLANS.VPN2024]: getMeetAppointmentScheduling(false),
                [PLANS.DRIVE]: getMeetAppointmentScheduling(false),
                [PLANS.DRIVE_1TB]: getMeetAppointmentScheduling(false),
                [PLANS.DRIVE_BUSINESS]: getMeetAppointmentScheduling(false),
                [PLANS.PASS]: getMeetAppointmentScheduling(false),
                [PLANS.PASS_LIFETIME]: getMeetAppointmentScheduling(false),
                [PLANS.PASS_FAMILY]: getMeetAppointmentScheduling(false),
                [PLANS.FAMILY]: getMeetAppointmentScheduling(false),
                [PLANS.DUO]: getMeetAppointmentScheduling(false),
                [PLANS.MAIL_PRO]: getMeetAppointmentScheduling(false),
                [PLANS.MAIL_BUSINESS]: getMeetAppointmentScheduling(false),
                [PLANS.BUNDLE_PRO]: getMeetAppointmentScheduling(false),
                [PLANS.BUNDLE_PRO_2024]: getMeetAppointmentScheduling(true),
                [PLANS.BUNDLE_BIZ_2025]: getMeetAppointmentScheduling(true),
                [PLANS.PASS_PRO]: getMeetAppointmentScheduling(false),
                [PLANS.PASS_BUSINESS]: getMeetAppointmentScheduling(false),
                [PLANS.VPN_PRO]: getMeetAppointmentScheduling(false),
                [PLANS.VPN_BUSINESS]: getMeetAppointmentScheduling(false),
                [PLANS.LUMO]: getMeetAppointmentScheduling(false),
                [PLANS.LUMO_BUSINESS]: getMeetAppointmentScheduling(false),
                [PLANS.MEET_BUSINESS]: getMeetAppointmentScheduling(true),
                [PLANS.VISIONARY]: getMeetAppointmentScheduling(true),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMeetAppointmentScheduling(false),
            },
        },
        {
            name: 'recording',
            plans: {
                [PLANS.FREE]: getMeetMeetingRecording(false),
                [PLANS.BUNDLE]: getMeetMeetingRecording(false),
                [PLANS.MAIL]: getMeetMeetingRecording(false),
                [PLANS.VPN2024]: getMeetMeetingRecording(false),
                [PLANS.DRIVE]: getMeetMeetingRecording(false),
                [PLANS.DRIVE_1TB]: getMeetMeetingRecording(false),
                [PLANS.DRIVE_BUSINESS]: getMeetMeetingRecording(false),
                [PLANS.PASS]: getMeetMeetingRecording(false),
                [PLANS.PASS_LIFETIME]: getMeetMeetingRecording(false),
                [PLANS.PASS_FAMILY]: getMeetMeetingRecording(false),
                [PLANS.FAMILY]: getMeetMeetingRecording(false),
                [PLANS.DUO]: getMeetMeetingRecording(false),
                [PLANS.MAIL_PRO]: getMeetMeetingRecording(false),
                [PLANS.MAIL_BUSINESS]: getMeetMeetingRecording(false),
                [PLANS.BUNDLE_PRO]: getMeetMeetingRecording(false),
                [PLANS.BUNDLE_PRO_2024]: getMeetMeetingRecording(true),
                [PLANS.BUNDLE_BIZ_2025]: getMeetMeetingRecording(true),
                [PLANS.PASS_PRO]: getMeetMeetingRecording(false),
                [PLANS.PASS_BUSINESS]: getMeetMeetingRecording(false),
                [PLANS.VPN_PRO]: getMeetMeetingRecording(false),
                [PLANS.VPN_BUSINESS]: getMeetMeetingRecording(false),
                [PLANS.LUMO]: getMeetMeetingRecording(false),
                [PLANS.LUMO_BUSINESS]: getMeetMeetingRecording(false),
                [PLANS.MEET_BUSINESS]: getMeetMeetingRecording(true),
                [PLANS.VISIONARY]: getMeetMeetingRecording(true),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getMeetMeetingRecording(false),
            },
        },
    ];
};
