import { act, renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { buildUser } from '@proton/shared/testing/buildUser';

import { useOneTimeCodeSettings } from './useOneTimeCodeSettings';

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});

const user = buildUser();
const otherUser = buildUser({ ID: `${user.ID}-other` });

describe('useOneTimeCodeSettings', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.mocked(useUser).mockReturnValue([user, false]);
    });

    it('has both preferences on for a user who never set them', () => {
        const { result } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        expect(result.current.detectionEnabled).toBe(true);
        expect(result.current.moveToTrashEnabled).toBe(true);
    });

    it('stores each preference under its own key for the user', () => {
        const { result } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        act(() => {
            result.current.setDetectionEnabled(false);
        });
        act(() => {
            result.current.setMoveToTrashEnabled(false);
        });

        expect(localStorage.getItem(`one-time-code-detection-enabled-${user.ID}`)).toBe('false');
        expect(localStorage.getItem(`one-time-code-move-to-trash-${user.ID}`)).toBe('false');
        expect(result.current.detectionEnabled).toBe(false);
        expect(result.current.moveToTrashEnabled).toBe(false);
    });

    it('reads what is already stored for the user', () => {
        localStorage.setItem(`one-time-code-detection-enabled-${user.ID}`, 'false');
        localStorage.setItem(`one-time-code-move-to-trash-${user.ID}`, 'false');

        const { result } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        expect(result.current.detectionEnabled).toBe(false);
        expect(result.current.moveToTrashEnabled).toBe(false);
    });

    it('shows a change made by another hook instance', () => {
        const { result: writer } = renderHook(() => {
            return useOneTimeCodeSettings();
        });
        const { result: reader } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        act(() => {
            writer.current.setDetectionEnabled(false);
        });
        act(() => {
            writer.current.setMoveToTrashEnabled(false);
        });

        expect(reader.current.detectionEnabled).toBe(false);
        expect(reader.current.moveToTrashEnabled).toBe(false);
    });

    it('keeps another user independent', () => {
        const { result: firstUser } = renderHook(() => {
            return useOneTimeCodeSettings();
        });
        act(() => {
            firstUser.current.setDetectionEnabled(false);
        });
        act(() => {
            firstUser.current.setMoveToTrashEnabled(false);
        });
        jest.mocked(useUser).mockReturnValue([otherUser, false]);

        const { result } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        expect(result.current.detectionEnabled).toBe(true);
        expect(result.current.moveToTrashEnabled).toBe(true);
    });
});
