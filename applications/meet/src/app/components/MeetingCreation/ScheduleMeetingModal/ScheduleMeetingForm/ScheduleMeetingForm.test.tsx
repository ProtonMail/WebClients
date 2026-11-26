import { render, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';
import { addDays, format, parse } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { ScheduleMeetingForm } from './ScheduleMeetingForm';

vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ Email: 'user@example.com' }] }));
vi.mock('@proton/account/userSettings/hooks', () => ({
    useUserSettings: () => [{ TimeFormat: SETTINGS_TIME_FORMAT.H24 }],
}));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/components/components/link/useAppLink', () => ({ default: () => vi.fn() }));
vi.mock('@proton/meet/hooks/useCreateMeeting', () => ({ useCreateMeeting: () => ({ createMeeting: vi.fn() }) }));
vi.mock('@proton/meet/hooks/useDeleteMeeting', () => ({ useDeleteMeeting: () => ({ deleteMeeting: vi.fn() }) }));
vi.mock('@proton/meet/hooks/useGetMeetingDependencies', () => ({ useGetMeetingDependencies: () => vi.fn() }));
vi.mock('@proton/meet/hooks/useMeetingUpdates', () => ({
    useMeetingUpdates: () => ({ saveMeetingName: vi.fn(), saveMeetingSchedule: vi.fn() }),
}));
vi.mock('@proton/meet/hooks/useUpdateMeetingWaitingRoom', () => ({
    useUpdateMeetingWaitingRoom: () => ({ updateMeetingWaitingRoom: vi.fn() }),
}));
vi.mock('@proton/meet/hooks/useWaitingRoomFlags', () => ({ useIsWaitingRoomCreationEnabled: () => false }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: () => vi.fn() }));

const renderForm = () => {
    render(<ScheduleMeetingForm open variant="purple" onClose={vi.fn()} onMeetingCreated={vi.fn()} />);
    return {
        startDate: screen.getByRole<HTMLInputElement>('textbox', { name: 'Start date' }),
        startTime: screen.getByRole('textbox', { name: 'Start time' }),
        endDate: screen.getByRole('textbox', { name: 'End date' }),
        endTime: screen.getByRole('textbox', { name: 'End time' }),
    };
};

const enterTime = async (user: UserEvent, field: HTMLElement, time: string) => {
    await user.clear(field);
    if (time) {
        await user.type(field, time);
    }
    await user.tab();
};

const DATE_FORMAT = 'PP';

const daysAfter = (field: HTMLInputElement, days: number) =>
    format(addDays(parse(field.value, DATE_FORMAT, new Date(), { locale: dateLocale }), days), DATE_FORMAT, {
        locale: dateLocale,
    });

const enterDate = async (user: UserEvent, field: HTMLElement, date: string) => {
    await user.click(field);
    await user.clear(field);
    if (date) {
        await user.type(field, date);
        await user.keyboard('{Escape}');
    }
    await user.tab();
};

describe('ScheduleMeetingForm', () => {
    it('keeps the meeting duration when the start time changes', async () => {
        const user = userEvent.setup();
        const { startTime, endTime } = renderForm();
        await enterTime(user, startTime, '10:00');
        await enterTime(user, endTime, '12:00');

        await enterTime(user, startTime, '11:00');

        expect(endTime).toHaveValue('13:00');
    });

    it('resets the end to 30 minutes after the start when a cleared start date is picked again', async () => {
        const user = userEvent.setup();
        const { startDate, startTime, endDate, endTime } = renderForm();
        await enterTime(user, startTime, '10:00');
        await enterTime(user, endTime, '11:00');
        const newStartDate = daysAfter(startDate, 1);
        await enterDate(user, endDate, daysAfter(startDate, 4));

        await enterDate(user, startDate, '');
        await enterDate(user, startDate, newStartDate);

        expect(startDate).toHaveValue(newStartDate);
        expect(endDate).toHaveValue(newStartDate);
        expect(endTime).toHaveValue('10:30');
    });

    it.each([
        { invalidStart: '', label: 'cleared' },
        { invalidStart: 'abc', label: 'not a time' },
    ])('keeps the end time when a start time that was $label is corrected', async ({ invalidStart }) => {
        const user = userEvent.setup();
        const { startTime, endTime } = renderForm();
        await enterTime(user, startTime, '10:00');
        await enterTime(user, endTime, '12:00');

        await enterTime(user, startTime, invalidStart);
        await enterTime(user, startTime, '11:00');

        expect(endTime).toHaveValue('12:00');
    });

    it('keeps an end time that is not a time when the start time changes', async () => {
        const user = userEvent.setup();
        const { startTime, endTime } = renderForm();
        await enterTime(user, startTime, '10:00');
        await enterTime(user, endTime, '12:00');
        await enterTime(user, endTime, 'abc');

        await enterTime(user, startTime, '11:00');

        expect(endTime).toHaveValue('abc');
    });
});
