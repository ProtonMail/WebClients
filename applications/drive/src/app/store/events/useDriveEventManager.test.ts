import { act } from 'react-dom/test-utils';
import { renderHook, RenderResult } from '@testing-library/react-hooks';

import createEventManager, { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { Api } from '@proton/shared/lib/interfaces';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { driveEventsResultToDriveEvents } from '../api';
import { useDriveEventManagerProvider } from './useDriveEventManager';

const SHARE_ID_FIRST = 'shareId-1';
const SHARE_ID_SECOND = 'shareId-2';

const EVENT = { EventType: EVENT_TYPES.CREATE, Link: { LinkID: 'linkId' } };
const EVENT_PAYLOAD = { EventID: 'event-id-1', Events: [EVENT], Refresh: 0, More: 0 } as DriveEventsResult;
const apiMock = jest.fn().mockImplementation(() => Promise.resolve(EVENT_PAYLOAD));

describe('useDriveEventManager', () => {
    let eventManager: EventManager;
    let hook: RenderResult<ReturnType<typeof useDriveEventManagerProvider>>;

    const renderTestHook = () => {
        const { result } = renderHook(() => useDriveEventManagerProvider(apiMock as Api, eventManager));
        return result;
    };

    beforeEach(() => {
        apiMock.mockClear();
        eventManager = createEventManager({ api: apiMock, eventID: '1' });
        hook = renderTestHook();
    });

    afterEach(() => {
        hook.current.clear();
    });

    it('subscribes to a share by id', async () => {
        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            expect(hook.current.getSubscriptionIds()).toEqual([SHARE_ID_FIRST]);
            await hook.current.subscribeToShare(SHARE_ID_SECOND);
            expect(hook.current.getSubscriptionIds()).toEqual([SHARE_ID_FIRST, SHARE_ID_SECOND]);
        });
    });

    it('unsubscribes from shares by id', async () => {
        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            await hook.current.subscribeToShare(SHARE_ID_SECOND);

            hook.current.unsubscribeFromShare(SHARE_ID_SECOND);
            expect(hook.current.getSubscriptionIds()).toEqual([SHARE_ID_FIRST]);
        });
    });

    it('registers event handlers', async () => {
        const handler = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            hook.current.registerEventHandler(handler);
            await hook.current.pollShare(SHARE_ID_FIRST);

            expect(handler).toBeCalledTimes(1);
        });
    });

    it('registers multiple event handlers for one share', async () => {
        const handler = jest.fn().mockImplementation(() => {});
        const handler2 = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            hook.current.registerEventHandler(handler);
            hook.current.registerEventHandler(handler2);
            await hook.current.pollShare(SHARE_ID_FIRST);

            expect(handler).toBeCalledTimes(1);
            expect(handler2).toBeCalledTimes(1);
        });
    });

    it('registers event handlers for multiple shares', async () => {
        const handler = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_SECOND);
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            hook.current.registerEventHandler(handler);
            await hook.current.pollShare(SHARE_ID_FIRST);
            await hook.current.pollShare(SHARE_ID_SECOND);

            expect(handler).toBeCalledTimes(2);
        });
    });

    it('removes handlers', async () => {
        const handler = jest.fn().mockImplementation(() => {});
        const handler2 = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            hook.current.registerEventHandler(handler);
            const handlerId = hook.current.registerEventHandler(handler2);
            hook.current.unregisterEventHandler(handlerId);
            await hook.current.pollShare(SHARE_ID_FIRST);

            expect(handler).toBeCalledTimes(1);
            expect(handler2).toBeCalledTimes(0);
        });
    });

    it('polls event', async () => {
        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            await hook.current.pollShare(SHARE_ID_FIRST);

            expect(apiMock).toBeCalledTimes(2); // fetching events + poll itself
        });
    });

    it('can register event a handler by id', async () => {
        const HANDLER_ID = 'handler-id';
        const handler = jest.fn().mockImplementation(() => {});
        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            hook.current.registerEventHandlerById(HANDLER_ID, handler);
            const res = hook.current.unregisterEventHandler(HANDLER_ID);

            await hook.current.pollShare(SHARE_ID_FIRST);

            expect(handler).toBeCalledTimes(0);
            expect(res).toBe(true);
        });
    });

    it("can poll events for all shares it's subscribed to", async () => {
        const HANDLER_ID = 'handler-id';
        const handler = jest.fn().mockImplementation(() => {});
        await act(async () => {
            await hook.current.subscribeToShare(SHARE_ID_FIRST);
            await hook.current.subscribeToShare(SHARE_ID_SECOND);
            hook.current.registerEventHandlerById(HANDLER_ID, handler);
            await hook.current.pollAllDriveEvents();
            expect(handler).toBeCalledTimes(2);
            expect(handler).toBeCalledWith(SHARE_ID_FIRST, driveEventsResultToDriveEvents(EVENT_PAYLOAD));
            expect(handler).toBeCalledWith(SHARE_ID_SECOND, driveEventsResultToDriveEvents(EVENT_PAYLOAD));
        });
    });
});
