import { act, renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { OtpGateSource } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/shared/testing/buildUser';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import { APPLY_LOCATION_TYPES } from '../../hooks/actions/applyLocation/interface';
import { useApplyLocation } from '../../hooks/actions/applyLocation/useApplyLocation';
import type { Element } from '../../models/element';
import { OneTimeCodeLocation } from './oneTimeCodeEvents';
import { useOneTimeCodeCopy } from './useOneTimeCodeCopy';
import { useOneTimeCodeSettings } from './useOneTimeCodeSettings';

vi.mock('@proton/account/user/hooks', () => {
    return { useUser: vi.fn() };
});
vi.mock('../../hooks/actions/applyLocation/useApplyLocation', () => {
    return { useApplyLocation: vi.fn() };
});

let tracked: ReturnType<typeof mockTracker>;

const sentCopyReports = () => {
    return tracked.reports.map(({ measurementGroup, event, dimensions, delay }) => {
        return { measurementGroup, event, dimensions, delay };
    });
};

const copyReport = (location: string, gateSource: string, isMovedToTrash: string) => {
    return {
        measurementGroup: 'mail.web.one_time_code',
        event: 'code_copied',
        dimensions: { location, gateSource, isMovedToTrash },
        delay: false,
    };
};

const user = buildUser();
const moveToTrashKey = `one-time-code-move-to-trash-${user.ID}`;
const applyLocation = vi.fn();
const elements: Element[] = [];

const renderCopy = () => {
    return renderHook(() => {
        return useOneTimeCodeCopy();
    });
};

const advance = (ms: number) => {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
};

describe('useOneTimeCodeCopy', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        vi.clearAllMocks();
        tracked = mockTracker();
        vi.mocked(useUser).mockReturnValue([user, false]);
        vi.mocked(useApplyLocation).mockReturnValue({
            applyLocation,
            applyMultipleLocations: vi.fn(),
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        tracked.restore();
    });

    it('reports the copy at once and moves the email to Trash one second later when the preference is on', () => {
        const { movesToTrash, onCopy } = renderCopy().result.current;

        onCopy(elements, OneTimeCodeLocation.LIST, OtpGateSource.SUBJECT);

        expect(movesToTrash).toBe(true);
        expect(sentCopyReports()).toEqual([copyReport('list', 'subject', 'true')]);
        advance(999);
        expect(applyLocation).not.toHaveBeenCalled();

        advance(1);
        expect(applyLocation.mock.calls).toEqual([
            [{ type: APPLY_LOCATION_TYPES.MOVE, elements, destinationLabelID: MAILBOX_LABEL_IDS.TRASH }],
        ]);
    });

    it('reports the copy and leaves the email in place when the preference is off', () => {
        localStorage.setItem(moveToTrashKey, 'false');
        const { movesToTrash, onCopy } = renderCopy().result.current;

        onCopy(elements, OneTimeCodeLocation.MESSAGE, OtpGateSource.THIRD_PARTY_REGISTRATION);
        advance(1000);

        expect(movesToTrash).toBe(false);
        expect(applyLocation).not.toHaveBeenCalled();
        expect(sentCopyReports()).toEqual([copyReport('message', 'third_party_registration', 'false')]);
    });

    it('completes the move it was clicked with after the pill unmounts and the preference flips', () => {
        const { result, unmount } = renderCopy();
        const { result: settings } = renderHook(() => {
            return useOneTimeCodeSettings();
        });

        result.current.onCopy(elements, OneTimeCodeLocation.MESSAGE, OtpGateSource.BOTH);
        unmount();
        act(() => {
            settings.current.setDetectionEnabled(false);
        });
        act(() => {
            settings.current.setMoveToTrashEnabled(false);
        });
        advance(1000);

        expect(sentCopyReports()).toEqual([copyReport('message', 'both', 'true')]);
        expect(applyLocation).toHaveBeenCalledTimes(1);
    });
});
