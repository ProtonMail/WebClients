import { AutoAddVideoConferenceLinkProvider } from '@proton/shared/lib/calendar/constants';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

type AutoAddConferenceLink = CalendarUserSettings['AutoAddConferenceLink'];

const getIsMeetProvider = (value: AutoAddConferenceLink) =>
    typeof value === 'object' && value.Provider === AutoAddVideoConferenceLinkProvider.Meet;

export const getIsAutoAddMeetLinkEnabled = (value: AutoAddConferenceLink) => {
    return !!value && getIsMeetProvider(value);
};

export const getToggledAutoAddMeetLink = (value: AutoAddConferenceLink) => {
    const shouldDisable = !value || getIsMeetProvider(value);

    return shouldDisable ? AutoAddVideoConferenceLinkProvider.None : AutoAddVideoConferenceLinkProvider.Meet;
};
