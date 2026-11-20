import { render, screen } from '@testing-library/react';
import { nextFriday, nextMonday, nextSaturday, nextSunday, nextThursday, nextTuesday, nextWednesday } from 'date-fns';
import type { Mock } from 'vitest';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces/UserSettings';

import SnoozeDurationSelection from './SnoozeDurationSelection';

vi.mock('@proton/account/user/hooks');
vi.mock('@proton/account/userSettings/hooks');

const renderComponent = (canUnsnooze: boolean) => {
    render(
        <SnoozeDurationSelection
            canUnsnooze={canUnsnooze}
            handleCustomClick={vi.fn()}
            handleSnooze={vi.fn()}
            handleUnsnoozeClick={vi.fn()}
        />
    );
};

describe('SnoozeDurationSelection when start of week is Monday', () => {
    const useUserMock = useUser as Mock;
    const useUserSettingsMock = useUserSettings as Mock;
    beforeAll(() => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, vi.fn]);
        useUserSettingsMock.mockImplementation(() => [{ WeekStart: 1 }]);
    });
    afterAll(() => {
        useUserMock.mockReset();
        useUserSettingsMock.mockReset();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render all Monday options', () => {
        const date = nextMonday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.getByTestId('snooze-duration-weekend'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Tuesday options', () => {
        const date = nextTuesday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.getByTestId('snooze-duration-weekend'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Wednesday options', () => {
        const date = nextWednesday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.getByTestId('snooze-duration-weekend'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Thursday options', () => {
        const date = nextThursday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.getByTestId('snooze-duration-weekend'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Friday options', () => {
        const date = nextFriday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Saturday options', () => {
        const date = nextSaturday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Sunday options', () => {
        const date = nextSunday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-nextweek')).toBeNull();
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render the unsnooze option', () => {
        renderComponent(true);
        expect(screen.getByTestId('snooze-duration-unsnooze'));
    });

    it('should render the upsell button for free users', () => {
        renderComponent(false);
        expect(screen.getByAltText(`Upgrade to Mail Plus to unlock`));
    });

    it('should not render the upsell button for free users', () => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, vi.fn]);

        renderComponent(false);
        expect(screen.queryByAltText(`Upgrade to Mail Plus to unlock`)).toBeNull();
    });
});

describe('SnoozeDurationSelection when start of week is Saturday', () => {
    const useUserMock = useUser as Mock;
    const useUserSettingsMock = useUserSettings as Mock;
    beforeAll(() => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, vi.fn]);
        useUserSettingsMock.mockImplementation(() => [{ WeekStart: SETTINGS_WEEK_START.SATURDAY }]);
    });
    afterAll(() => {
        useUserMock.mockReset();
        useUserSettingsMock.mockReset();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render all Monday options', () => {
        const date = nextMonday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
    });

    it('should render all Tuesday options', () => {
        const date = nextTuesday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
    });

    it('should render all Wednesday options', () => {
        const date = nextWednesday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Thursday options', () => {
        const date = nextThursday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Friday options', () => {
        const date = nextFriday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Saturday options', () => {
        const date = nextSaturday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Sunday options', () => {
        const date = nextSunday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-nextweek')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-nextweek')).toBeNull();
        expect(screen.getByTestId('snooze-duration-custom'));
    });
});

describe('SnoozeDurationSelection when start of week is Sunday', () => {
    const useUserMock = useUser as Mock;
    const useUserSettingsMock = useUserSettings as Mock;
    beforeAll(() => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, vi.fn]);
        useUserSettingsMock.mockImplementation(() => [{ WeekStart: SETTINGS_WEEK_START.SUNDAY }]);
    });
    afterAll(() => {
        useUserMock.mockReset();
        useUserSettingsMock.mockReset();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render all Monday options', () => {
        const date = nextMonday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
    });

    it('should render all Tuesday options', () => {
        const date = nextTuesday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
    });

    it('should render all Wednesday options', () => {
        const date = nextWednesday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Thursday options', () => {
        const date = nextThursday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-weekend')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Friday options', () => {
        const date = nextFriday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.queryByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Saturday options', () => {
        const date = nextSaturday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-custom'));
    });

    it('should render all Sunday options', () => {
        const date = nextSunday(new Date());
        vi.useFakeTimers({ now: date.getTime() });

        renderComponent(false);
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.queryByTestId('snooze-duration-later')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-nextweek')).toBeNull();
        expect(screen.queryByTestId('snooze-duration-nextweek')).toBeNull();
        expect(screen.getByTestId('snooze-duration-custom'));
    });
});
