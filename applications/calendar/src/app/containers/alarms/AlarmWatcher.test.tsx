import { act, render } from '@testing-library/react';
import { vi } from 'vitest';

import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { createElectronNotification } from '@proton/shared/lib/helpers/desktopNotification';
import type { CalendarAlarm } from '@proton/shared/lib/interfaces/calendar/Alarm';

import type { CalendarsEventsCache } from '../calendar/eventStore/interface';
import AlarmWatcher from './AlarmWatcher';

vi.mock('@proton/shared/lib/helpers/desktop', () => ({ isElectronMail: true }));
vi.mock('@proton/shared/lib/helpers/browser', () => ({ getIsIframe: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/desktopNotification', () => ({
    create: vi.fn(),
    createElectronNotification: vi.fn(),
}));
vi.mock('@proton/shared/lib/calendar/alarms', () => ({
    getAlarmMessage: () => 'Standup starts now',
    getNextEventTime: () => Date.now(),
}));
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/components/containers/contacts/ContactEmailsProvider', () => ({
    useContactEmailsCache: () => ({ contactEmailsMap: {} }),
}));
vi.mock('@proton/calendar/calendarEvent/useGetCalendarEventRaw', () => {
    const getCalendarEventRaw = () => Promise.resolve({ veventComponent: {} });
    return { useGetCalendarEventRaw: () => getCalendarEventRaw };
});
vi.mock('@proton/components/hooks/useHasSuspendedCounter', () => ({ default: () => false }));

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
        await vi.runOnlyPendingTimersAsync();
    });
};

describe('AlarmWatcher desktop notifications', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends an electron notification when calendar is the top frame', async () => {
        vi.mocked(getIsIframe).mockReturnValue(false);

        await renderAndFireAlarm();

        expect(createElectronNotification).toHaveBeenCalledWith({
            title: 'Calendar alarm',
            body: 'Standup starts now',
            app: 'calendar',
        });
    });

    it('does not send an electron notification when embedded as the mail drawer iframe', async () => {
        vi.mocked(getIsIframe).mockReturnValue(true);

        await renderAndFireAlarm();

        expect(createElectronNotification).not.toHaveBeenCalled();
    });
});
