import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';

import { userReducer } from '../user';
import { userLoop } from '../user/eventLoopV6';
import { coreEventLoopV6 } from './index';
import type { CoreEventLoopV6Callback, CoreEventLoopV6RequiredState } from './interface';
import { coreEventLoopV6Listener } from './listener';

vi.mock('../user/eventLoopV6', () => ({ userLoop: vi.fn() }));

const event = { More: 0, EventID: 'event-id' } as unknown as CoreEventV6Response;

describe('coreEventLoopV6Listener', () => {
    const setup = (options?: Parameters<typeof coreEventLoopV6Listener>[1]) => {
        const api = vi.fn();
        const { store, startListening } = getTestStore({
            reducer: { ...userReducer },
            extraThunkArguments: { api } as unknown as ProtonThunkArguments,
        });
        coreEventLoopV6Listener(startListening as unknown as Parameters<typeof coreEventLoopV6Listener>[0], options);

        const dispatchEvent = () => {
            const promises: Promise<unknown>[] = [];
            store.dispatch(coreEventLoopV6({ event, promises }));
            return promises;
        };

        return { dispatchEvent };
    };

    beforeEach(() => {
        vi.mocked(userLoop).mockReset();
    });

    it('runs the extra loops after the built-in ones, with the event and the store state', () => {
        const calls: string[] = [];
        vi.mocked(userLoop).mockImplementation(() => {
            calls.push('user');
            return undefined;
        });
        const extraLoop = vi.fn<CoreEventLoopV6Callback>(() => {
            calls.push('extra');
            return undefined;
        });

        const { dispatchEvent } = setup({ loops: [extraLoop] });
        dispatchEvent();

        expect(calls).toEqual(['user', 'extra']);
        expect(extraLoop).toHaveBeenCalledWith(
            expect.objectContaining({
                event,
                state: expect.objectContaining({ user: expect.anything() }) as CoreEventLoopV6RequiredState,
            })
        );
    });

    it('collects the promises the extra loops return, after the built-in ones', async () => {
        const builtInCount = setup().dispatchEvent().length;
        const { dispatchEvent } = setup({ loops: [() => Promise.resolve('done')] });

        const promises = dispatchEvent();

        expect(promises).toHaveLength(builtInCount + 1);
        await expect(promises.at(-1)).resolves.toBe('done');
    });

    it('runs the built-in loops without options', () => {
        setup().dispatchEvent();

        expect(userLoop).toHaveBeenCalledTimes(1);
    });
});
