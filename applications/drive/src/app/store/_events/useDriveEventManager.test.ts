import { act } from 'react-dom/test-utils';

import { RenderResult, renderHook } from '@testing-library/react-hooks';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import createEventManager, { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { Api } from '@proton/shared/lib/interfaces';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import { driveEventsResultToDriveEvents } from '../_api';
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
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            expect(hook.current.getSubscriptionIds()).toEqual([SHARE_ID_FIRST]);
            await hook.current.shares.startSubscription(SHARE_ID_SECOND);
            expect(hook.current.getSubscriptionIds()).toEqual([SHARE_ID_FIRST, SHARE_ID_SECOND]);
        });
    });

    it('unsubscribes from shares by id', async () => {
        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            await hook.current.shares.startSubscription(SHARE_ID_SECOND);

            hook.current.shares.unsubscribe(SHARE_ID_SECOND);
            expect(hook.current.getSubscriptionIds()).toEqual([SHARE_ID_FIRST]);
        });
    });

    it('registers event handlers', async () => {
        const handler = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            hook.current.eventHandlers.register(handler);
            await hook.current.pollEvents.shares([SHARE_ID_FIRST]);

            expect(handler).toBeCalledTimes(1);
        });
    });

    it('registers multiple event handlers for one share', async () => {
        const handler = jest.fn().mockImplementation(() => {});
        const handler2 = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            hook.current.eventHandlers.register(handler);
            hook.current.eventHandlers.register(handler2);
            await hook.current.pollEvents.shares([SHARE_ID_FIRST]);

            expect(handler).toBeCalledTimes(1);
            expect(handler2).toBeCalledTimes(1);
        });
    });

    it('registers event handlers for multiple shares', async () => {
        const handler = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_SECOND);
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            hook.current.eventHandlers.register(handler);
            await hook.current.pollEvents.shares([SHARE_ID_FIRST]);
            await hook.current.pollEvents.shares([SHARE_ID_SECOND]);

            expect(handler).toBeCalledTimes(2);
        });
    });

    it('removes handlers', async () => {
        const handler = jest.fn().mockImplementation(() => {});
        const handler2 = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            hook.current.eventHandlers.register(handler);
            const handlerId = hook.current.eventHandlers.register(handler2);
            hook.current.eventHandlers.unregister(handlerId);
            await hook.current.pollEvents.shares([SHARE_ID_FIRST]);

            expect(handler).toBeCalledTimes(1);
            expect(handler2).toBeCalledTimes(0);
        });
    });

    it('polls event', async () => {
        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            await hook.current.pollEvents.shares([SHARE_ID_FIRST]);

            expect(apiMock).toBeCalledTimes(2); // fetching events + poll itself
        });
    });

    it("can poll events for all shares it's subscribed to", async () => {
        const handler = jest.fn().mockImplementation(() => {});
        await act(async () => {
            await hook.current.shares.startSubscription(SHARE_ID_FIRST);
            await hook.current.shares.startSubscription(SHARE_ID_SECOND);
            hook.current.eventHandlers.register(handler);
            await hook.current.pollEvents.driveEvents();
            expect(handler).toBeCalledTimes(2);
            expect(handler).toBeCalledWith(
                SHARE_ID_FIRST,
                driveEventsResultToDriveEvents(EVENT_PAYLOAD, SHARE_ID_FIRST)
            );
            expect(handler).toBeCalledWith(
                SHARE_ID_SECOND,
                driveEventsResultToDriveEvents(EVENT_PAYLOAD, SHARE_ID_SECOND)
            );
        });
    });
});
