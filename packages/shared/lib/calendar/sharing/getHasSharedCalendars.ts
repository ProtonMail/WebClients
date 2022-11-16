import { getAllMembers, getCalendarInvitations, getPublicLinks } from '@proton/shared/lib/api/calendars';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { filterOutDeclinedInvitations } from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';

import { Api } from '../../interfaces';
import {
    CalendarUrlsResponse,
    GetAllMembersApiResponse,
    GetCalendarInvitationsResponse,
    VisualCalendar,
} from '../../interfaces/calendar';
import { getIsOwnedCalendar } from '../calendar';

const getHasSharedCalendars = async ({
    calendars,
    api,
    catchErrors,
}: {
    calendars: VisualCalendar[];
    api: Api;
    catchErrors?: boolean;
}) => {
    const { signal, abort } = new AbortController();
    const apiWithAbort = getApiWithAbort(api, signal);

    let hasSharedCalendars = false;

    await Promise.all(
        calendars
            .filter((calendar) => getIsOwnedCalendar(calendar))
            .map(async ({ ID }) => {
                try {
                    const [{ CalendarUrls: links }, { Members }, { Invitations }] = await Promise.all([
                        apiWithAbort<CalendarUrlsResponse>(getPublicLinks(ID)),
                        apiWithAbort<GetAllMembersApiResponse>(getAllMembers(ID)),
                        apiWithAbort<GetCalendarInvitationsResponse>(getCalendarInvitations(ID)),
                    ]);

                    const pendingOrAcceptedInvitations = filterOutDeclinedInvitations(Invitations);
                    if (links.length || Members.length > 1 || pendingOrAcceptedInvitations.length) {
                        hasSharedCalendars = true;
                        abort();
                    }
                } catch (e: any) {
                    if (!catchErrors) {
                        const error =
                            e instanceof Error ? e : new Error('Unknown error getting calendar links or members');

                        throw error;
                    }
                }
            })
    );

    return hasSharedCalendars;
};

export default getHasSharedCalendars;
