import { act, renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

import { APPLY_LOCATION_TYPES } from '../../hooks/actions/applyLocation/interface';
import { useApplyLocation } from '../../hooks/actions/applyLocation/useApplyLocation';
import type { Element } from '../../models/element';
import { useOneTimeCodeCopy } from './useOneTimeCodeCopy';
import { useOneTimeCodeSettings } from './useOneTimeCodeSettings';

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});
jest.mock('../../hooks/actions/applyLocation/useApplyLocation', () => {
    return { useApplyLocation: jest.fn() };
});

const user = buildUser();
const moveToTrashKey = `one-time-code-move-to-trash-${user.ID}`;
const applyLocation = jest.fn();
const elements: Element[] = [];

const renderCopy = () => {
    return renderHook(() => {
        return useOneTimeCodeCopy();
    });
};

const advance = (ms: number) => {
    act(() => {
        jest.advanceTimersByTime(ms);
    });
};

describe('useOneTimeCodeCopy', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
        jest.clearAllMocks();
        jest.mocked(useUser).mockReturnValue([user, false]);
        jest.mocked(useApplyLocation).mockReturnValue({
            applyLocation,
            applyMultipleLocations: jest.fn(),
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('moves the email to Trash one second later when the preference is on', () => {
        const { movesToTrash, onCopy } = renderCopy().result.current;

        onCopy(elements);

        expect(movesToTrash).toBe(true);
        advance(999);
        expect(applyLocation).not.toHaveBeenCalled();

        advance(1);
        expect(applyLocation.mock.calls).toEqual([
            [{ type: APPLY_LOCATION_TYPES.MOVE, elements, destinationLabelID: MAILBOX_LABEL_IDS.TRASH }],
        ]);
    });

    it('leaves the email in place when the preference is off', () => {
        localStorage.setItem(moveToTrashKey, 'false');
        const { movesToTrash, onCopy } = renderCopy().result.current;

        onCopy(elements);
        advance(1000);

        expect(movesToTrash).toBe(false);
        expect(applyLocation).not.toHaveBeenCalled();
    });

    it('completes the move it was clicked with after the pill unmounts and the preference flips', () => {
        const { result, unmount } = renderCopy();
        const { result: settings } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        result.current.onCopy(elements);
        unmount();
        act(() => {
            settings.current.setDetectionEnabled(false);
        });
        act(() => {
            settings.current.setMoveToTrashEnabled(false);
        });
        advance(1000);

        expect(applyLocation).toHaveBeenCalledTimes(1);
    });
});
