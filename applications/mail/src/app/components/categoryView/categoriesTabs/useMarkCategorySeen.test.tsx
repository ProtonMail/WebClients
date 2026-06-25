import { renderHook } from '@testing-library/react-hooks';

import { useEventManager } from '@proton/components/index';
import { updateLastSeenEventId } from '@proton/mail/store/labels/actions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMarkCategorySeen } from './useMarkCategorySeen';

jest.mock('@proton/components/index');
jest.mock('@proton/redux-shared-store/sharedProvider');
jest.mock('@proton/mail/store/labels/actions');

const LABEL_ID = MAILBOX_LABEL_IDS.CATEGORY_SOCIAL;

const dispatch = jest.fn();
const getEventID = jest.fn();
const thunkAction = { type: 'updateLastSeenEventId' };

describe('useMarkCategorySeen', () => {
    beforeEach(() => {
        jest.mocked(useDispatch).mockReturnValue(dispatch);
        jest.mocked(useEventManager).mockReturnValue({ getEventID } as any);
        jest.mocked(updateLastSeenEventId).mockReturnValue(thunkAction as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('dispatches the thunk with the current event id', () => {
        getEventID.mockReturnValue('event-1');

        const { result } = renderHook(() => useMarkCategorySeen());
        result.current(LABEL_ID);

        expect(updateLastSeenEventId).toHaveBeenCalledWith({ labelID: LABEL_ID, lastEventID: 'event-1' });
        expect(dispatch).toHaveBeenCalledWith(thunkAction);
    });

    it('does nothing when there is no current event id', () => {
        getEventID.mockReturnValue(undefined);

        const { result } = renderHook(() => useMarkCategorySeen());
        result.current(LABEL_ID);

        expect(updateLastSeenEventId).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
});
