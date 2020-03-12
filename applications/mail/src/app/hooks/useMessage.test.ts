import { act } from '@testing-library/react-hooks';
import { wait } from 'proton-shared/lib/helpers/promise';
import { noop } from 'proton-shared/lib/helpers/function';

import { useMessage } from './useMessage';
import * as MessageProviderMock from '../containers/MessageProvider';
import { renderHook, clearAll, addApiMock } from '../helpers/test/helper';

// Needed to make TS accepts the mock exports
const cacheMock: MessageProviderMock.MessageCache = (MessageProviderMock as any).cacheMock;

jest.mock('../containers/MessageProvider');

describe('useMessage', () => {
    let consoleError: any;

    const ID = 'ID';

    const setup = (props: any = {}) =>
        renderHook(() => useMessage({ localID: ID, ...props, data: { ID, ...props.data } }, {}));

    beforeAll(() => {
        consoleError = console.error;
        console.error = noop;
    });

    afterAll(() => {
        console.error = consoleError;
    });

    afterEach(() => {
        jest.clearAllMocks();
        cacheMock.reset();
        clearAll();
    });

    describe('message state', () => {
        it('should initialize message in cache if not existing', () => {
            const hook = setup();
            expect(hook.result.current[0]).toEqual({ localID: ID, data: { ID } });
        });

        it('should returns message from the cache', () => {
            const message = {};
            cacheMock.set(ID, message);
            const hook = setup();
            expect(hook.result.current[0]).toBe(message);
        });
    });

    describe('message actions', () => {
        it('should wait the computations to resolve the promise', async () => {
            let resolve: (arg: any) => void = noop;
            addApiMock(
                'messages',
                () =>
                    new Promise((r) => {
                        resolve = r;
                    })
            );
            const hook = setup();
            const promise = act(async () => {
                await hook.result.current[1].createDraft({});
            });
            expect(hook.result.current[2].lock).toBe(true);
            await wait(0);
            expect(hook.result.current[2].lock).toBe(true);
            resolve({ Message: {} });
            expect(hook.result.current[2].lock).toBe(true);
            await promise;
            expect(hook.result.current[2].lock).toBe(false);
        });

        it('should create a draft with the appropriate helper', async () => {
            addApiMock('messages', () => ({ Message: { ID } }));
            const hook = setup();
            await act(async () => {
                await hook.result.current[1].createDraft({});
            });
            expect(hook.result.current[0].data).toEqual({ ID });
        });
    });

    describe('cache id management', () => {
        it('should handle new draft with no id', async () => {
            const localID = 'localID';
            addApiMock('messages', () => ({ Message: { ID } }));

            const hook = setup({ localID, data: { ID: undefined } });
            expect(hook.result.current[0].localID).toBe(localID);
            await act(async () => {
                await hook.result.current[1].createDraft(hook.result.current[0]);
            });
            expect(hook.result.current[0].localID).toBe(localID);
            expect(hook.result.current[0].data.ID).toBe(ID);
        });

        it('should handle several new draft with no id', async () => {
            const localID1 = 'localID1';
            const localID2 = 'localID2';
            const ID1 = 'ID1';
            const ID2 = 'ID2';
            addApiMock('messages', () => ({ Message: { ID: ID1 } }));

            const hook1 = setup({ localID: localID1, data: { ID: undefined } });
            const hook2 = setup({ localID: localID2, data: { ID: undefined } });
            expect(hook2.result.current[0].localID).toBe(localID2);
            await act(async () => {
                await hook1.result.current[1].createDraft(hook1.result.current[0]);
            });
            expect(hook1.result.current[0].localID).toBe(localID1);
            expect(hook2.result.current[0].localID).toBe(localID2);
            expect(hook1.result.current[0].data.ID).toBe(ID1);
            expect(hook2.result.current[0].data.ID).toBe(undefined);

            addApiMock('messages', () => ({ Message: { ID: ID2 } }));
            await act(async () => {
                await hook2.result.current[1].createDraft(hook2.result.current[0]);
            });
            expect(hook1.result.current[0].localID).toBe(localID1);
            expect(hook2.result.current[0].localID).toBe(localID2);
            expect(hook1.result.current[0].data.ID).toBe(ID1);
            expect(hook2.result.current[0].data.ID).toBe(ID2);
        });

        it('should handle switching of message', () => {
            const ID1 = 'ID1';
            const ID2 = 'ID2';
            let hook = setup({ localID: ID1, data: { ID: ID1, testFlag: 1 } });
            expect(hook.result.current[0].data.testFlag).toBe(1);
            hook = setup({ localID: ID2, data: { ID: ID2, testFlag: 2 } });
            expect(hook.result.current[0].data.testFlag).toBe(2);
            hook = setup({ localID: ID1 });
            expect(hook.result.current[0].data.testFlag).toBe(1);
            hook = setup({ localID: ID2 });
            expect(hook.result.current[0].data.testFlag).toBe(2);
        });
    });
});
