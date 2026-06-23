import { SEPARATOR_PROTON_EVENTS } from '@proton/calendar/videoConferencing/constants';
import type { VcalDateTimeProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';

import { propertiesToModel } from './propertiesToModel';

const DTSTAMP: VcalDateTimeProperty = {
    value: { year: 2026, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
};
const BASE_VEVENT: VcalVeventComponent = {
    component: 'vevent',
    uid: { value: 'test-uid@proton.me' },
    dtstamp: DTSTAMP,
    dtstart: {
        value: { year: 2026, month: 5, day: 11, hours: 4, minutes: 0, seconds: 0, isUTC: false },
        parameters: { tzid: 'Europe/Paris' },
    },
};

describe('properties to model', () => {
    test('can parse start and end time correctly', () => {
        const veventComponent: VcalVeventComponent = {
            ...BASE_VEVENT,
            summary: { value: 'My title' },
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            dtend: {
                value: { year: 2019, month: 7, day: 19, hours: 18, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };

        expect(
            propertiesToModel({
                veventComponent,
                hasDefaultNotifications: true,
                isAllDay: false,
                isProtonProtonInvite: false,
                tzid: 'Europe/Zurich',
            })
        ).toMatchObject({
            title: 'My title',
            start: { date: new Date(2019, 6, 19), time: new Date(2000, 0, 1, 12), tzid: 'America/New_York' },
            end: { date: new Date(2019, 6, 19), time: new Date(2000, 0, 1, 18, 30), tzid: 'Europe/Zurich' },
        });
    });

    test('it allows end before start in part day event', () => {
        const veventComponent: VcalVeventComponent = {
            ...BASE_VEVENT,
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtend: {
                value: { year: 2019, month: 7, day: 19, hours: 11, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };

        expect(
            propertiesToModel({
                veventComponent,
                hasDefaultNotifications: true,
                isAllDay: false,
                isProtonProtonInvite: false,
                tzid: 'Europe/Zurich',
            })
        ).toMatchObject({
            start: { date: new Date(2019, 6, 19), time: new Date(2000, 0, 1, 12), tzid: 'Europe/Zurich' },
            end: { date: new Date(2019, 6, 19), time: new Date(2000, 0, 1, 11), tzid: 'Europe/Zurich' },
        });
    });

    test('it allows end before start in full day event', () => {
        const veventComponent: VcalVeventComponent = {
            ...BASE_VEVENT,
            dtstart: { value: { year: 2019, month: 7, day: 19 }, parameters: { type: 'date' } },
            dtend: { value: { year: 2019, month: 7, day: 18 }, parameters: { type: 'date' } },
        };

        expect(
            propertiesToModel({
                veventComponent,
                hasDefaultNotifications: true,
                isAllDay: true,
                isProtonProtonInvite: false,
                tzid: 'Europe/Zurich',
            })
        ).toMatchObject({
            start: { date: new Date(2019, 6, 19), time: new Date(2000, 0, 1, 0) },
            end: { date: new Date(2019, 6, 17), time: new Date(2000, 0, 1, 0) },
        });
    });

    describe('Proton Meet fallback from description', () => {
        const MEET_URL = 'https://meet.proton.me/join/id-P9QD7ENMHW#pwd-UgoePlpIZ01m';
        const MEET_ID = 'P9QD7ENMHW';
        const EMBEDDED_BLOCK = `\n${SEPARATOR_PROTON_EVENTS}\nJoin Proton Meet: ${MEET_URL}\n${SEPARATOR_PROTON_EVENTS}`;
        const DEFAULT_PARAMS = {
            hasDefaultNotifications: false,
            isAllDay: false,
            isProtonProtonInvite: false,
            tzid: 'Europe/Paris',
        };

        test('extracts conferenceUrl and conferenceId when x-pm-conference-* properties are absent', () => {
            const veventComponent: VcalVeventComponent = { ...BASE_VEVENT, description: { value: EMBEDDED_BLOCK } };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.conferenceUrl).toBe(MEET_URL);
            expect(model.conferenceId).toBe(MEET_ID);
            expect(model.conferenceProvider).toBe(VIDEO_CONFERENCE_PROVIDER.PROTON_MEET);
        });

        test('strips the embedded video conf block from the returned description', () => {
            const veventComponent: VcalVeventComponent = {
                ...BASE_VEVENT,
                description: { value: `Team standup${EMBEDDED_BLOCK}` },
            };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.description).toBe('Team standup');
            expect(model.conferenceUrl).toBe(MEET_URL);
        });

        test('produces an empty description when only the embedded block is present', () => {
            const veventComponent: VcalVeventComponent = { ...BASE_VEVENT, description: { value: EMBEDDED_BLOCK } };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.description).toBe('');
        });

        test('prefers x-pm-conference-url over the description fallback when both are present', () => {
            const storedUrl = 'https://meet.proton.me/join/id-STORED1234#pwd-storedpwd';
            const veventComponent: VcalVeventComponent = {
                ...BASE_VEVENT,
                'x-pm-conference-id': { value: 'STORED1234', parameters: { 'x-pm-provider': '2' } },
                'x-pm-conference-url': { value: storedUrl, parameters: {} },
                description: { value: EMBEDDED_BLOCK },
            };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.conferenceUrl).toBe(storedUrl);
            expect(model.conferenceId).toBe('STORED1234');
        });

        test('sets no conference data when neither x-pm-conference-* nor an embedded Meet link is present', () => {
            const veventComponent: VcalVeventComponent = {
                ...BASE_VEVENT,
                description: { value: 'Just a plain description' },
            };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.conferenceUrl).toBeUndefined();
            expect(model.conferenceId).toBeUndefined();
            expect(model.description).toBe('Just a plain description');
        });
    });

    // Zoom links embedded in the description (e.g. an attendee's copy of a native Zoom event, where the
    // x-pm-conference-* properties are not present) must NOT be promoted to conference fields: doing so makes the
    // API try to update a Zoom meeting the user does not own. We also keep the block in the description so the
    // video conferencing widget can still parse and display it.
    describe('Zoom embedded in description (non-native, e.g. attendee copy)', () => {
        const ZOOM_URL = 'https://us05web.zoom.us/j/88128811438?pwd=tXBwNj7tnajHLftxrqTkU4DtS2M7Au.1';
        const ZOOM_ID = '88128811438';
        const ZOOM_PASSWORD = '4qNpNK';
        const EMBEDDED_BLOCK = `\n${SEPARATOR_PROTON_EVENTS}\nJoin Zoom Meeting: ${ZOOM_URL} (ID: ${ZOOM_ID}, passcode: ${ZOOM_PASSWORD})\n${SEPARATOR_PROTON_EVENTS}`;
        const DEFAULT_PARAMS = {
            hasDefaultNotifications: false,
            isAllDay: false,
            isProtonProtonInvite: false,
            tzid: 'Europe/Paris',
        };

        test('does not extract conference data from an embedded Zoom block', () => {
            const veventComponent: VcalVeventComponent = { ...BASE_VEVENT, description: { value: EMBEDDED_BLOCK } };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.conferenceUrl).toBeUndefined();
            expect(model.conferenceId).toBeUndefined();
            expect(model.conferenceProvider).toBeUndefined();
        });

        test('keeps the embedded Zoom block in the description so the widget can parse it', () => {
            const veventComponent: VcalVeventComponent = {
                ...BASE_VEVENT,
                description: { value: `Team standup${EMBEDDED_BLOCK}` },
            };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.description).toBe(`Team standup${EMBEDDED_BLOCK}`.trim());
            expect(model.conferenceUrl).toBeUndefined();
        });

        test('keeps the description intact when only the embedded Zoom block is present', () => {
            const veventComponent: VcalVeventComponent = { ...BASE_VEVENT, description: { value: EMBEDDED_BLOCK } };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.description).toBe(EMBEDDED_BLOCK.trim());
        });

        test('extracts native Zoom conference data and strips the block when x-pm-conference-* is present', () => {
            const veventComponent: VcalVeventComponent = {
                ...BASE_VEVENT,
                'x-pm-conference-id': { value: ZOOM_ID, parameters: { 'x-pm-provider': '1' } },
                'x-pm-conference-url': { value: ZOOM_URL, parameters: { 'x-pm-password': ZOOM_PASSWORD } },
                description: { value: `Team standup${EMBEDDED_BLOCK}` },
            };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.conferenceUrl).toBe(ZOOM_URL);
            expect(model.conferenceId).toBe(ZOOM_ID);
            expect(model.conferencePassword).toBe(ZOOM_PASSWORD);
            expect(model.conferenceProvider).toBe(VIDEO_CONFERENCE_PROVIDER.ZOOM);
            expect(model.description).toBe('Team standup');
        });

        test('sets no conference data when neither x-pm-conference-* nor an embedded link is present', () => {
            const veventComponent: VcalVeventComponent = {
                ...BASE_VEVENT,
                description: { value: 'Just a plain description' },
            };
            const model = propertiesToModel({ veventComponent, ...DEFAULT_PARAMS });

            expect(model.conferenceUrl).toBeUndefined();
            expect(model.conferenceId).toBeUndefined();
            expect(model.description).toBe('Just a plain description');
        });
    });
});
