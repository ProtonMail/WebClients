import { c } from 'ttag';

import type { SectionConfig, SidebarConfig } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowRightArrowLeft } from '@proton/icons/icons/IcArrowRightArrowLeft';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcGrid2 } from '@proton/icons/icons/IcGrid2';
import { getIsB2BAudienceFromPlan } from '@proton/payments/core/plan/helpers';
import { CALENDAR_SETTINGS_ROUTE, CALENDAR_SETTINGS_SECTION_ID } from '@proton/shared/lib/calendar/constants';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getOrganizationDenomination, isOrganizationVisionary } from '@proton/shared/lib/organization/helper';

import type { OrganizationRouterParams } from '../../content/router-params';

/**
 * Calendar config is coupled to CalendarSidebar.
 * Any additional section must also be added to CalendarSidebar.
 */
export const getCalendarAppRoutes = ({ app, user, organization, flags }: OrganizationRouterParams): SidebarConfig => {
    const { isZoomIntegrationEnabled = false, isProtonMeetIntegrationEnabled = false } = flags;
    const isB2BAudience = getIsB2BAudienceFromPlan(organization?.PlanName);
    const isFamilyOrg = !!organization && getOrganizationDenomination(organization) === 'familyGroup';
    const isVisionary = isOrganizationVisionary(organization);

    const isMultiAccount = isB2BAudience || isFamilyOrg || isVisionary;
    const baseAccess = user.isAdmin && !user.isMember && user.hasPaidMail;

    const canDisableIntegrations = isMultiAccount
        ? // Organizations not setup should be able to disable the zoom integration feature
          // Setup organization manage the feature from the dedicated page in the settings
          baseAccess && !organization?.Name
        : baseAccess;

    return {
        available: app === APPS.PROTONCALENDAR || app === APPS.PROTONACCOUNT,
        header: CALENDAR_APP_NAME,
        routes: {
            desktop: {
                id: 'desktop',
                available: !isElectronMail,
                text: c('Title').t`Get the apps`,
                to: CALENDAR_SETTINGS_ROUTE.GET_APPS,
                icon: IcArrowDownLine,
                subsections: [
                    {
                        id: CALENDAR_SETTINGS_SECTION_ID.MOBILE_APP,
                        text: c('Title').t`Download the mobile apps`,
                        keywords: [
                            c('account_search_index').t`App Store`,
                            c('account_search_index').t`Play Store`,
                            c('account_search_index').t`iOS and Android apps`,
                        ],
                    },
                    {
                        id: CALENDAR_SETTINGS_SECTION_ID.DESKTOP_APP,
                        text: c('Title').t`Download the desktop app`,
                        keywords: [
                            c('Action').t`Download for Windows`,
                            c('Action').t`Download for macOS`,
                            c('account_search_index').t`Linux desktop app`,
                        ],
                    },
                ],
            },
            general: {
                id: 'general',
                text: c('Link').t`General`,
                to: CALENDAR_SETTINGS_ROUTE.GENERAL,
                icon: IcGrid2,
                subsections: [
                    {
                        text: c('Title').t`Time zone`,
                        id: CALENDAR_SETTINGS_SECTION_ID.TIME_ZONE,
                        keywords: [
                            c('Primary timezone').t`Primary time zone`,
                            c('Primary timezone').t`Secondary time zone`,
                            c('Label').t`Auto-detect primary time zone`,
                        ],
                    },
                    {
                        text: c('Title').t`Layout`,
                        id: CALENDAR_SETTINGS_SECTION_ID.LAYOUT,
                        keywords: [
                            c('Label').t`Default view`,
                            c('Label').t`Week start`,
                            c('Label').t`Show week numbers`,
                        ],
                    },
                    {
                        text: c('Title').t`Invitations`,
                        id: CALENDAR_SETTINGS_SECTION_ID.INVITATIONS,
                        keywords: [
                            c('account_search_index').t`Invitation language`,
                            c('account_search_index').t`Auto-add invitations to calendar`,
                            c('Label').t`Auto-add Meet links`,
                        ],
                    },
                    {
                        text: c('Title').t`Integrations`,
                        id: CALENDAR_SETTINGS_SECTION_ID.INTEGRATIONS,
                        available:
                            (isZoomIntegrationEnabled || isProtonMeetIntegrationEnabled) && canDisableIntegrations,
                        keywords: [
                            c('Label').t`Video conferencing with Zoom`,
                            c('account_search_index').t`Zoom meeting links`,
                        ],
                    },
                    {
                        text: c('Title').t`Other preferences`,
                        id: CALENDAR_SETTINGS_SECTION_ID.OTHER_PREFERENCES,
                        keywords: [c('Label').t`Keyboard shortcuts`],
                    },
                ],
            },
            calendars: {
                id: 'calendars',
                text: c('Link').t`Calendars`,
                to: CALENDAR_SETTINGS_ROUTE.CALENDARS,
                icon: IcCalendarGrid,
                subsections: [
                    {
                        text: c('Title').t`My calendars`,
                        id: CALENDAR_SETTINGS_SECTION_ID.PERSONAL_CALENDARS,
                        keywords: [
                            c('Action').t`Create calendar`,
                            c('Action').t`Set as default`,
                            c('Title').t`Delete calendar`,
                        ],
                    },
                    {
                        text: c('Title').t`Other calendars`,
                        id: CALENDAR_SETTINGS_SECTION_ID.OTHER_CALENDARS,
                        keywords: [
                            c('Action').t`Add calendar from URL`,
                            c('Action').t`Add public holidays`,
                            c('Header; Table with list of calendars arranged by type').t`Subscribed`,
                        ],
                    },
                ],
            },
            interops: {
                id: 'interops',
                text: c('Link').t`Import/export`,
                title: c('Title').t`Import and export`,
                to: CALENDAR_SETTINGS_ROUTE.INTEROPS,
                icon: IcArrowRightArrowLeft,
                subsections: [
                    {
                        text: c('Title').t`Import`,
                        id: CALENDAR_SETTINGS_SECTION_ID.IMPORT,
                        keywords: [c('Action').t`Import from ICS`, c('account_search_index').t`Import events`],
                    },
                    {
                        text: c('Title').t`Export`,
                        id: CALENDAR_SETTINGS_SECTION_ID.EXPORT,
                        keywords: [c('Action').t`Download ICS`, c('Action').t`Select a calendar to export`],
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
