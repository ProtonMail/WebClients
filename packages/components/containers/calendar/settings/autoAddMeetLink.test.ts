import { AutoAddVideoConferenceLinkProvider } from '@proton/shared/lib/calendar/constants';

import { getIsAutoAddMeetLinkEnabled, getToggledAutoAddMeetLink } from './autoAddMeetLink';

const meet = { Provider: AutoAddVideoConferenceLinkProvider.Meet, DisplayNotification: 0 };
const zoom = { Provider: AutoAddVideoConferenceLinkProvider.Zoom, DisplayNotification: 0 };
const none = { Provider: AutoAddVideoConferenceLinkProvider.None, DisplayNotification: 0 };

describe('getIsAutoAddMeetLinkEnabled', () => {
    it.each([
        ['unset', undefined, false],
        ['None provider number', AutoAddVideoConferenceLinkProvider.None, false],
        ['Meet provider object', meet, true],
        ['Zoom provider object', zoom, false],
        ['None provider object', none, false],
    ])('%s → %s', (_, value, expected) => {
        expect(getIsAutoAddMeetLinkEnabled(value)).toBe(expected);
    });
});

describe('getToggledAutoAddMeetLink', () => {
    it.each([
        ['Meet enabled', meet, AutoAddVideoConferenceLinkProvider.None],
        ['None provider object', none, AutoAddVideoConferenceLinkProvider.Meet],
        ['Zoom provider object', zoom, AutoAddVideoConferenceLinkProvider.Meet],
        ['unset', undefined, AutoAddVideoConferenceLinkProvider.None],
    ])('%s → %s', (_, value, expected) => {
        expect(getToggledAutoAddMeetLink(value)).toBe(expected);
    });
});
