import browser from '@proton/pass/lib/globals/browser';
import { AppStatus } from '@proton/pass/types/worker/state';

import { WorkerMessageType } from '../../../types/messages';
import { NotificationAction } from '../../content/constants.runtime';
import { WorkerContext } from '../context/inject';
import { triggerTabAutofill } from './autofill.trigger';

const tabsSendMessage = browser.tabs.sendMessage as jest.Mock;
const getAllFrames = browser.webNavigation.getAllFrames as jest.Mock;

const tabId = 42;

/** `getAllFrames` shape → `getTabFrames` drops frames whose parent it hasn't seen */
const frames = (...ids: [frameId: number, parentFrameId: number][]) =>
    ids.map(([frameId, parentFrameId]) => ({ frameId, parentFrameId, url: 'https://example.com' }));

/** Ordered list of frame ids that received an `AUTOFILL_TRIGGER` */
const triggeredFrames = () =>
    tabsSendMessage.mock.calls
        .filter(([, message]) => message.type === WorkerMessageType.AUTOFILL_TRIGGER)
        .map(([, , options]) => options.frameId);

const messagesOfType = (type: WorkerMessageType) =>
    tabsSendMessage.mock.calls.filter(([, message]) => message.type === type);

describe('triggerTabAutofill', () => {
    const iframeAutofillEnabled = jest.fn().mockResolvedValue(true);
    const getState = jest.fn().mockReturnValue({ status: AppStatus.READY, authorized: true });

    beforeEach(() => {
        jest.clearAllMocks();

        iframeAutofillEnabled.mockResolvedValue(true);
        getState.mockReturnValue({ status: AppStatus.READY, authorized: true });
        getAllFrames.mockResolvedValue(frames([0, -1]));
        tabsSendMessage.mockResolvedValue({ matched: false });

        WorkerContext.set({ service: { autofill: { iframeAutofillEnabled } }, getState } as any);
    });

    afterEach(() => WorkerContext.clear());

    describe('frame walk', () => {
        test('should early-exit on the top-frame when it matches', async () => {
            tabsSendMessage.mockResolvedValue({ matched: true });
            getAllFrames.mockResolvedValue(frames([0, -1], [1, 0]));

            expect(await triggerTabAutofill(tabId)).toBe(true);
            expect(triggeredFrames()).toEqual([0]);
            expect(messagesOfType(WorkerMessageType.INLINE_NOTIFICATION_OPEN)).toHaveLength(0);
        });

        test('should walk top-frame first and early-exit on the matching sub-frame', async () => {
            getAllFrames.mockResolvedValue(frames([0, -1], [1, 0], [2, 1], [3, 0]));
            tabsSendMessage.mockImplementation(async (_tabId, _message, { frameId }) => ({ matched: frameId === 2 }));

            expect(await triggerTabAutofill(tabId)).toBe(true);
            /** BFS: `3` is a child of the root and is visited before `2` */
            expect(triggeredFrames()).toEqual([0, 1, 3, 2]);
        });

        test('should visit the top-frame first even when listed after another root', async () => {
            /** `5` is an orphaned root (`parentFrameId === -1`) reported before frame `0` */
            getAllFrames.mockResolvedValue(frames([5, -1], [0, -1], [1, 0]));

            await triggerTabAutofill(tabId);
            expect(triggeredFrames()).toEqual([0, 5, 1]);
        });

        test('should keep walking when a frame has no content-script', async () => {
            getAllFrames.mockResolvedValue(frames([0, -1], [1, 0], [2, 0]));
            tabsSendMessage
                .mockResolvedValueOnce({ matched: false })
                .mockRejectedValueOnce(new Error('Could not establish connection'))
                .mockResolvedValueOnce({ matched: true });

            expect(await triggerTabAutofill(tabId)).toBe(true);
            expect(triggeredFrames()).toEqual([0, 1, 2]);
        });

        test('should only query the top-frame when iframe autofill is disabled', async () => {
            iframeAutofillEnabled.mockResolvedValue(false);
            getAllFrames.mockResolvedValue(frames([0, -1], [1, 0]));

            await triggerTabAutofill(tabId);
            expect(getAllFrames).not.toHaveBeenCalled();
            expect(triggeredFrames()).toEqual([0]);
        });
    });

    describe('focus hand-off', () => {
        test('should request dropdown focus on the top-frame when a sub-frame matched', async () => {
            getAllFrames.mockResolvedValue(frames([0, -1], [1, 0]));
            tabsSendMessage.mockImplementation(async (_tabId, _message, { frameId }) => ({ matched: frameId === 1 }));

            await triggerTabAutofill(tabId);

            expect(tabsSendMessage).toHaveBeenCalledWith(
                tabId,
                expect.objectContaining({ type: WorkerMessageType.INLINE_DROPDOWN_FOCUS }),
                { frameId: 0 }
            );
        });

        test('should not request focus when no frame matched', async () => {
            await triggerTabAutofill(tabId);
            expect(messagesOfType(WorkerMessageType.INLINE_DROPDOWN_FOCUS)).toHaveLength(0);
        });
    });

    describe('feedback toast', () => {
        const toastMessage = () => {
            const [call] = messagesOfType(WorkerMessageType.INLINE_NOTIFICATION_OPEN);
            expect(call?.[2]).toEqual({ frameId: 0 });
            expect(call?.[1].payload.action).toEqual(NotificationAction.TOAST);
            return call?.[1].payload.message;
        };

        test('should notify when no login form was found', async () => {
            expect(await triggerTabAutofill(tabId)).toBe(false);
            expect(toastMessage()).toEqual('No login form found on this page');
        });

        test('should notify to unlock when the client is locked', async () => {
            getState.mockReturnValue({ status: AppStatus.SESSION_LOCKED, authorized: true });

            await triggerTabAutofill(tabId);
            expect(toastMessage()).toEqual('Unlock Proton Pass to autofill');
        });

        test('should notify to sign in when the client is unauthorized', async () => {
            getState.mockReturnValue({ status: AppStatus.UNAUTHORIZED, authorized: false });

            await triggerTabAutofill(tabId);
            expect(toastMessage()).toEqual('Sign in to Proton Pass to autofill');
        });

        test('should fall back to the top-frame when frame resolution throws', async () => {
            getAllFrames.mockRejectedValue(new Error('No tab with id'));

            expect(await triggerTabAutofill(tabId)).toBe(false);
            expect(triggeredFrames()).toEqual([0]);
            expect(toastMessage()).toEqual('No login form found on this page');
        });
    });
});
