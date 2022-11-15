import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { CALENDAR_SETTINGS_ROUTE } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import { validateBase64string } from '@proton/shared/lib/helpers/encoding';

interface GetPathOptions {
    fullPath?: boolean;
    sectionId?: string;
}

const getPathWithOptions = (relativePath: string, options?: GetPathOptions) => {
    const { fullPath, sectionId } = options || {};

    let path = `${relativePath}`;

    if (fullPath) {
        path = `/${getSlugFromApp(APPS.PROTONCALENDAR)}${path}`;
    }

    if (sectionId) {
        path = `${path}#${sectionId}`;
    }

    return path;
};

export const getGeneralSettingsPath = (options?: GetPathOptions) => {
    return getPathWithOptions(CALENDAR_SETTINGS_ROUTE.GENERAL, options);
};

export const getCalendarsSettingsPath = (options?: GetPathOptions) => {
    return getPathWithOptions(CALENDAR_SETTINGS_ROUTE.CALENDARS, options);
};

export const getInteroperabilityOperationsPath = (options?: GetPathOptions) => {
    return getPathWithOptions(CALENDAR_SETTINGS_ROUTE.INTEROPS, options);
};

export const getCalendarSubpagePath = (calendarID: string, options?: GetPathOptions) => {
    return getPathWithOptions(`${getCalendarsSettingsPath()}/${calendarID}`, options);
};

export const getIsCalendarSubpage = (pathname: string, calendarsSectionTo: string) => {
    // The calendar subpage is accessed via /calendar/calendars/calendarId
    const calendarsSectionPath = `/${getSlugFromApp(APPS.PROTONCALENDAR)}${calendarsSectionTo}`;

    const regexString = `^${calendarsSectionPath}/(.*)`.replaceAll('/', '\\/');
    const match = (new RegExp(regexString).exec(pathname) || [])[1];
    if (!match) {
        return false;
    }

    return validateBase64string(match, true);
};
