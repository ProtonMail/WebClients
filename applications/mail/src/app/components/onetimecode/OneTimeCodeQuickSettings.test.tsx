import { fireEvent, render, screen } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import { buildUser } from '@proton/shared/testing/buildUser';
import { mockTracker } from '@proton/telemetry-tracker/testing';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import OneTimeCodeQuickSettings from './OneTimeCodeQuickSettings';

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});
jest.mock('@proton/unleash/useFlag', () => {
    return { useFlag: jest.fn() };
});

let tracked: ReturnType<typeof mockTracker>;

const expectSettingToggled = (setting: string, isEnabled: string) => {
    expect(
        tracked.reports.map(({ measurementGroup, event, dimensions, delay }) => {
            return { measurementGroup, event, dimensions, delay };
        })
    ).toEqual([
        {
            measurementGroup: 'mail.web.one_time_code',
            event: 'setting_toggled',
            dimensions: { setting, isEnabled },
            delay: false,
        },
    ]);
};

const user = buildUser();
const detectionKey = `one-time-code-detection-enabled-${user.ID}`;
const moveToTrashKey = `one-time-code-move-to-trash-${user.ID}`;
const detectionTestID = 'mail-quick-settings:one-time-codes-toggle';
const moveToTrashTestID = 'mail-quick-settings:one-time-code-move-to-trash-toggle';
const createNotification = jest.fn();

const mockFlag = (isOn: boolean) => {
    jest.mocked(useFlag).mockImplementation((flag) => {
        return flag === MailFeatureFlag.OneTimePasscode ? isOn : false;
    });
};

const getDetectionToggle = () => {
    return screen.getByTestId<HTMLInputElement>(detectionTestID);
};

const getMoveToTrashToggle = () => {
    return screen.getByTestId<HTMLInputElement>(moveToTrashTestID);
};

describe('OneTimeCodeQuickSettings', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        jest.mocked(useUser).mockReturnValue([user, false]);
        mockUseNotifications({ createNotification });
        mockFlag(true);
        tracked = mockTracker();
    });

    afterEach(() => {
        tracked.restore();
    });

    it('renders nothing when the flag is off', () => {
        mockFlag(false);

        const { container } = render(<OneTimeCodeQuickSettings />);

        expect(container).toBeEmptyDOMElement();
    });

    it('shows both toggles on for a user who never set them', () => {
        render(<OneTimeCodeQuickSettings />);

        expect(screen.getByLabelText(/^One-time codes/, { selector: 'input' })).toBe(getDetectionToggle());
        expect(screen.getByLabelText(/^Move to Trash/, { selector: 'input' })).toBe(getMoveToTrashToggle());
        expect(getDetectionToggle()).toBeChecked();
        expect(getMoveToTrashToggle()).toBeChecked();
    });

    it('turns detection off, hides the Trash row and confirms it', () => {
        render(<OneTimeCodeQuickSettings />);

        fireEvent.click(getDetectionToggle());

        expect(localStorage.getItem(detectionKey)).toBe('false');
        expect(getDetectionToggle()).not.toBeChecked();
        expect(screen.queryByTestId(moveToTrashTestID)).not.toBeInTheDocument();
        expect(createNotification).toHaveBeenCalledWith({ text: 'One-time codes disabled' });
        expectSettingToggled('detection', 'false');
    });

    it('turns detection back on, shows the Trash row and confirms it', () => {
        localStorage.setItem(detectionKey, 'false');
        render(<OneTimeCodeQuickSettings />);

        expect(screen.queryByTestId(moveToTrashTestID)).not.toBeInTheDocument();

        fireEvent.click(getDetectionToggle());

        expect(localStorage.getItem(detectionKey)).toBe('true');
        expect(getMoveToTrashToggle()).toBeInTheDocument();
        expect(createNotification).toHaveBeenCalledWith({ text: 'One-time codes enabled' });
        expectSettingToggled('detection', 'true');
    });

    it('turns Move to Trash off and confirms the preference was saved', () => {
        render(<OneTimeCodeQuickSettings />);

        fireEvent.click(getMoveToTrashToggle());

        expect(localStorage.getItem(moveToTrashKey)).toBe('false');
        expect(getMoveToTrashToggle()).not.toBeChecked();
        expect(createNotification).toHaveBeenCalledWith({ text: 'Preference saved' });
        expectSettingToggled('move_to_trash', 'false');
    });
});
