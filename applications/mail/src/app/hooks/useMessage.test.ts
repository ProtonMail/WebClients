import { renderHook, act } from '@testing-library/react-hooks';
import { useApi } from 'react-components';
import { wait } from 'proton-shared/lib/helpers/promise';
import { noop } from 'proton-shared/lib/helpers/function';

import { useMessage } from './useMessage';
import * as MessageProviderMock from '../containers/MessageProvider';
import { createMessage } from '../helpers/message/messageExport';

// Needed to make TS accepts the mock exports
const cacheMock: MessageProviderMock.MessageCache = (MessageProviderMock as any).cacheMock;

jest.mock('../containers/MessageProvider');
jest.mock('./useBase64Cache');
jest.mock('./useDecryptMessage', () => ({ useDecryptMessage: jest.fn() }));
jest.mock('./useMessageKeys', () => ({ useMessageKeys: jest.fn(() => (m: any) => m) }));
jest.mock('./useSendMessage', () => ({ useSendMessage: jest.fn(() => (m: any) => m) }));
jest.mock('../helpers/message/messageExport', () => ({ createMessage: jest.fn(() => (m: any) => m) }));

describe('useMessage', () => {
    let consoleError: any;

    const ID = 'ID';

    const api = jest.fn();
    (useApi as jest.Mock).mockReturnValue(api);

    const setup = () => renderHook((props: any = {}) => useMessage({ ID, ...props }, {}));

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
    });

    describe('message state', () => {
        it('should initialize message in cache if not existing', () => {
            const hook = setup();
            expect(hook.result.current[0]).toEqual({ data: { ID } });
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
            api.mockReturnValue(
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
            const Message = {};
            api.mockResolvedValue({ Message });
            const hook = setup();
            await act(async () => {
                await hook.result.current[1].createDraft({});
            });
            expect(hook.result.current[0].data).toEqual({ ID });
            expect(createMessage).toHaveBeenCalled();
        });
    });
});
