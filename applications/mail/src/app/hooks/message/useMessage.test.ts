import { noop } from '@proton/shared/lib/helpers/function';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useMessage } from './useMessage';
import { renderHook, clearAll, messageCache } from '../../helpers/test/helper';
import { MessageExtended } from '../../models/message';

describe('useMessage', () => {
    let consoleError: any;

    const ID = 'ID';

    const setup = (localID: string) => {
        // cache.set(ELEMENTS_CACHE_KEY, elementsCache);
        return renderHook((id = localID) => useMessage(id));
    };

    beforeAll(() => {
        consoleError = console.error;
        console.error = noop;
    });

    afterAll(() => {
        console.error = consoleError;
    });

    afterEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    describe('message state', () => {
        it('should initialize message in cache if not existing', () => {
            const hook = setup(ID);
            expect(hook.result.current.message).toEqual({ localID: ID });
        });

        it('should returns message from the cache', () => {
            const message = { localID: ID, data: {} } as MessageExtended;
            messageCache.set(ID, message);
            const hook = setup(ID);
            expect(hook.result.current.message).toBe(message);
        });
    });

    describe('cache id management', () => {
        it('should handle new draft with no id', async () => {
            const localID = 'localID';

            const hook = setup(localID);
            expect(hook.result.current.message.localID).toBe(localID);
            expect(hook.result.current.message.data).toBeUndefined();

            messageCache.set(localID, { localID, data: { ID } as Message });

            expect(hook.result.current.message.localID).toBe(localID);
            expect(hook.result.current.message.data.ID).toBe(ID);
        });

        it('should handle several new draft with no id', async () => {
            const localID1 = 'localID1';
            const localID2 = 'localID2';
            const ID1 = 'ID1';
            const ID2 = 'ID2';

            const hook1 = setup(localID1);
            const hook2 = setup(localID2);

            expect(hook1.result.current.message.localID).toBe(localID1);
            expect(hook2.result.current.message.localID).toBe(localID2);

            messageCache.set(localID1, { localID: localID1, data: { ID: ID1 } as Message });

            expect(hook1.result.current.message.localID).toBe(localID1);
            expect(hook2.result.current.message.localID).toBe(localID2);
            expect(hook1.result.current.message.data.ID).toBe(ID1);
            expect(hook2.result.current.message.data).toBeUndefined();

            messageCache.set(localID2, { localID: localID2, data: { ID: ID2 } as Message });

            expect(hook1.result.current.message.localID).toBe(localID1);
            expect(hook2.result.current.message.localID).toBe(localID2);
            expect(hook1.result.current.message.data.ID).toBe(ID1);
            expect(hook2.result.current.message.data.ID).toBe(ID2);
        });

        it('should handle switching of message', () => {
            const ID1 = 'ID1';
            const ID2 = 'ID2';

            messageCache.set(ID1, { localID: ID1, data: { ID: ID1, testFlag: 1 } as any });
            messageCache.set(ID2, { localID: ID2, data: { ID: ID2, testFlag: 2 } as any });

            const hook = setup(ID1);
            expect(hook.result.current.message.data.testFlag).toBe(1);
            hook.rerender(ID2);
            expect(hook.result.current.message.data.testFlag).toBe(2);
            hook.rerender(ID1);
            expect(hook.result.current.message.data.testFlag).toBe(1);
            hook.rerender(ID2);
            expect(hook.result.current.message.data.testFlag).toBe(2);
        });
    });
});
