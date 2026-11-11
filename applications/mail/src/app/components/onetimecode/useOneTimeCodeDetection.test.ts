import { act, renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { buildUser } from '@proton/shared/testing/buildUser';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { useOneTimeCodeDetection } from './useOneTimeCodeDetection';
import { useOneTimeCodeSettings } from './useOneTimeCodeSettings';

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});
jest.mock('@proton/unleash/useFlag', () => {
    return { useFlag: jest.fn() };
});

const user = buildUser();
const detectionKey = `one-time-code-detection-enabled-${user.ID}`;

const mockFlag = (isOn: boolean) => {
    jest.mocked(useFlag).mockImplementation((flag) => {
        return flag === MailFeatureFlag.OneTimePasscode ? isOn : false;
    });
};

const renderDetection = () => {
    return renderHook(() => {
        return useOneTimeCodeDetection();
    }).result.current;
};

describe('useOneTimeCodeDetection', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.mocked(useUser).mockReturnValue([user, false]);
    });

    it('is off when the flag is off, even with the preference on', () => {
        mockFlag(false);

        expect(renderDetection()).toBe(false);
    });

    it('is off when the user turned one-time codes off', () => {
        mockFlag(true);
        localStorage.setItem(detectionKey, 'false');

        expect(renderDetection()).toBe(false);
    });

    it('is on when the flag and the preference are both on', () => {
        mockFlag(true);

        expect(renderDetection()).toBe(true);
    });

    it('does not re-render when only the Move to Trash preference changes', () => {
        mockFlag(true);
        let renders = 0;
        renderHook(() => {
            renders += 1;
            return useOneTimeCodeDetection();
        });
        const { result: settings } = renderHook(() => {
            return useOneTimeCodeSettings();
        });
        const rendersBefore = renders;

        act(() => {
            settings.current.setMoveToTrashEnabled(false);
        });

        expect(renders).toBe(rendersBefore);
    });
});
