import { act, render } from '@testing-library/react';

import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { createElectronNotification } from '@proton/shared/lib/helpers/desktopNotification';
import type { CalendarAlarm } from '@proton/shared/lib/interfaces/calendar/Alarm';

import type { CalendarsEventsCache } from '../calendar/eventStore/interface';
import AlarmWatcher from './AlarmWatcher';

jest.mock('@proton/shared/lib/helpers/desktop', () => ({ isElectronMail: true }));
jest.mock('@proton/shared/lib/helpers/browser', () => ({ getIsIframe: jest.fn() }));
jest.mock('@proton/shared/lib/helpers/desktopNotification', () => ({
    create: jest.fn(),
    createElectronNotification: jest.fn(),
}));
jest.mock('@proton/shared/lib/calendar/alarms', () => ({
    getAlarmMessage: () => 'Standup starts now',
    getNextEventTime: () => Date.now(),
}));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => jest.fn() }));
jest.mock('@proton/components/containers/contacts/ContactEmailsProvider', () => ({
    useContactEmailsCache: () => ({ contactEmailsMap: {} }),
}));
jest.mock('@proton/calendar/calendarEvent/useGetCalendarEventRaw', () => {
    const getCalendarEventRaw = () => Promise.resolve({ veventComponent: {} });
    return { useGetCalendarEventRaw: () => getCalendarEventRaw };
});
jest.mock('@proton/components/hooks/useHasSuspendedCounter', () => () => false);

const alarmDueNow = {
    ID: 'alarm-id',
    Occurrence: Math.floor(Date.now() / 1000),
    Trigger: '-PT0M',
    CalendarID: 'calendar-id',
    EventID: 'event-id',
} as CalendarAlarm;

const calendarsEventsCacheRef = {
    current: { getCachedEvent: () => ({}) } as unknown as CalendarsEventsCache,
};

const renderAndFireAlarm = async () => {
    render(<AlarmWatcher alarms={[alarmDueNow]} tzid="UTC" calendarsEventsCacheRef={calendarsEventsCacheRef} />);
    await act(async () => {
        await jest.runOnlyPendingTimersAsync();
    });
};

describe('AlarmWatcher desktop notifications', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('sends an electron notification when calendar is the top frame', async () => {
        jest.mocked(getIsIframe).mockReturnValue(false);

        await renderAndFireAlarm();

        expect(createElectronNotification).toHaveBeenCalledWith({
            title: 'Calendar alarm',
            body: 'Standup starts now',
            app: 'calendar',
        });
    });

    it('does not send an electron notification when embedded as the mail drawer iframe', async () => {
        jest.mocked(getIsIframe).mockReturnValue(true);

        await renderAndFireAlarm();

        expect(createElectronNotification).not.toHaveBeenCalled();
    });
});
