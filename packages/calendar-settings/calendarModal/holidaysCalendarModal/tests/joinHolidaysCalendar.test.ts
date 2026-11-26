import { updateCalendarSettings } from '@proton/shared/lib/api/calendars';
import setupHolidaysCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupHolidaysCalendarHelper';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { JoinHolidayCalendarResponse } from '@proton/shared/lib/interfaces/calendar/Api';
import type { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';

import joinHolidaysCalendar from '../joinHolidaysCalendar';

vi.mock('@proton/shared/lib/calendar/crypto/keys/setupHolidaysCalendarHelper', () => ({
    __esModule: true,
    default: vi.fn(),
}));

const mockedSetup = vi.mocked(setupHolidaysCalendarHelper);

const holidaysCalendar = { CalendarID: 'directory-1', CountryCode: 'fr' } as HolidaysDirectoryCalendar;

const getJoinResponse = (makesUserBusy: number) =>
    ({
        Calendar: { ID: 'cal-1' },
        CalendarSettings: { MakesUserBusy: makesUserBusy },
    }) as unknown as JoinHolidayCalendarResponse;

const join = (api: ReturnType<typeof vi.fn>, options: { makesUserBusy: number; onJoined?: () => void }) =>
    joinHolidaysCalendar({
        holidaysCalendar,
        addresses: [],
        getAddressKeys: vi.fn(),
        color: '#273EB2',
        notifications: [],
        api: api as unknown as Api,
        ...options,
    });

describe('joinHolidaysCalendar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends no settings call when MakesUserBusy already matches', async () => {
        mockedSetup.mockResolvedValue(getJoinResponse(0));
        const api = vi.fn();

        const response = await join(api, { makesUserBusy: 0 });

        expect(response.Calendar.ID).toBe('cal-1');
        expect(mockedSetup).toHaveBeenCalledWith(
            expect.objectContaining({ holidaysCalendar, color: '#273EB2', notifications: [] })
        );
        expect(api).not.toHaveBeenCalled();
    });

    it('updates MakesUserBusy when it differs', async () => {
        mockedSetup.mockResolvedValue(getJoinResponse(0));
        const api = vi.fn().mockResolvedValue({});

        await join(api, { makesUserBusy: 1 });

        expect(api).toHaveBeenCalledTimes(1);
        expect(api).toHaveBeenCalledWith(updateCalendarSettings('cal-1', { MakesUserBusy: 1 }));
    });

    it('calls onJoined before the settings call', async () => {
        mockedSetup.mockResolvedValue(getJoinResponse(0));
        const calls: string[] = [];
        const api = vi.fn(async () => {
            calls.push('settings');
        });

        await join(api, { makesUserBusy: 1, onJoined: () => calls.push('joined') });

        expect(calls).toEqual(['joined', 'settings']);
    });

    it('does not call onJoined when the setup fails', async () => {
        mockedSetup.mockRejectedValue(new Error('Missing primary key'));
        const onJoined = vi.fn();

        await expect(join(vi.fn(), { makesUserBusy: 1, onJoined })).rejects.toThrow('Missing primary key');

        expect(onJoined).not.toHaveBeenCalled();
    });
});
