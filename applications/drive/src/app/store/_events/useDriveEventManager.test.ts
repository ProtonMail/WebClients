import { act } from 'react-dom/test-utils';

import type { RenderResult } from '@testing-library/react-hooks';
import { renderHook } from '@testing-library/react-hooks';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import type { Api } from '@proton/shared/lib/interfaces';
import type { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import { driveEventsResultToDriveEvents } from '../_api';
import { VolumeType } from '../_volumes';
import { useDriveEventManagerProvider } from './useDriveEventManager';

const VOLUME_ID_1 = 'volumeId-1';
const VOLUME_ID_2 = 'volumeId-2';

const SHARE_1_EVENT = {
    EventType: EVENT_TYPES.CREATE,
    Link: { LinkID: 'linkId' },
    ContextShareID: 'shareId-1',
};
const SHARE_2_EVENT = {
    EventType: EVENT_TYPES.CREATE,
    Link: { LinkID: 'linkId' },
    ContextShareID: 'shareId-2',
};
const EVENT_PAYLOAD = {
    EventID: 'event-id-1',
    Events: [SHARE_1_EVENT, SHARE_2_EVENT],
    Refresh: 0,
    More: 0,
} as DriveEventsResult;
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
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            expect(hook.current.getSubscriptionIds()).toEqual([VOLUME_ID_1]);
            await hook.current.volumes.startSubscription(VOLUME_ID_2, VolumeType.own);
            expect(hook.current.getSubscriptionIds()).toEqual([VOLUME_ID_1, VOLUME_ID_2]);
        });
    });

    it('unsubscribes from shares by id', async () => {
        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            await hook.current.volumes.startSubscription(VOLUME_ID_2, VolumeType.own);

            hook.current.volumes.unsubscribe(VOLUME_ID_2);
            expect(hook.current.getSubscriptionIds()).toEqual([VOLUME_ID_1]);
        });
    });

    it('registers event handlers', async () => {
        const handler = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            hook.current.eventHandlers.register(handler);
            await hook.current.pollEvents.volumes([VOLUME_ID_1]);

            expect(handler).toBeCalledTimes(1);
        });
    });

    it('registers multiple event handlers for one share', async () => {
        const handler = jest.fn().mockImplementation(() => {});
        const handler2 = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            hook.current.eventHandlers.register(handler);
            hook.current.eventHandlers.register(handler2);
            await hook.current.pollEvents.volumes([VOLUME_ID_1]);

            expect(handler).toBeCalledTimes(1);
            expect(handler2).toBeCalledTimes(1);
        });
    });

    it('registers event handlers for multiple shares', async () => {
        const handler = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_2, VolumeType.own);
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            hook.current.eventHandlers.register(handler);
            await hook.current.pollEvents.volumes(VOLUME_ID_1);
            await hook.current.pollEvents.volumes(VOLUME_ID_2);

            expect(handler).toBeCalledTimes(2);
        });
    });

    it('removes handlers', async () => {
        const handler = jest.fn().mockImplementation(() => {});
        const handler2 = jest.fn().mockImplementation(() => {});

        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            hook.current.eventHandlers.register(handler);
            const handlerId = hook.current.eventHandlers.register(handler2);
            hook.current.eventHandlers.unregister(handlerId);
            await hook.current.pollEvents.volumes(VOLUME_ID_1);

            expect(handler).toBeCalledTimes(1);
            expect(handler2).toBeCalledTimes(0);
        });
    });

    it('polls event', async () => {
        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            await hook.current.pollEvents.volumes(VOLUME_ID_1);

            expect(apiMock).toBeCalledTimes(2); // fetching events + poll itself
        });
    });

    it("can poll events for all shares it's subscribed to", async () => {
        const handler = jest.fn().mockImplementation(() => {});
        await act(async () => {
            await hook.current.volumes.startSubscription(VOLUME_ID_1, VolumeType.own);
            await hook.current.volumes.startSubscription(VOLUME_ID_2, VolumeType.own);
            hook.current.eventHandlers.register(handler);
            await hook.current.pollEvents.driveEvents();
            expect(handler).toBeCalledTimes(2);
            expect(handler).toBeCalledWith(
                VOLUME_ID_1,
                driveEventsResultToDriveEvents(EVENT_PAYLOAD),
                expect.any(Function)
            );
            expect(handler).toBeCalledWith(
                VOLUME_ID_2,
                driveEventsResultToDriveEvents(EVENT_PAYLOAD),
                expect.any(Function)
            );
        });
    });
});
