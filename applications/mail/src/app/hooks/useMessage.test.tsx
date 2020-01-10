import React, { FC, ReactElement } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useInstance, useApi } from 'react-components';

import { useMessage } from './useMessage';
import MessageProvider from '../containers/MessageProvider';
import createCache from 'proton-shared/lib/helpers/cache';

jest.mock('./useDecryptMessage', () => ({ useDecryptMessage: jest.fn() }));
jest.mock('./useAttachments', () => ({ useAttachmentsCache: jest.fn() }));

describe('useMessage', () => {
    const ID = 'ID';

    const api = jest.fn();
    (useApi as jest.Mock).mockReturnValue(api);

    const setup = (cache = createCache()) => {
        (useInstance as jest.Mock).mockReturnValue(cache);
        const wrapper = (({ children }: { children: ReactElement }) => (
            <MessageProvider>{children}</MessageProvider>
        )) as FC;
        const renderHookResult = renderHook((props: any = {}) => useMessage({ ID, ...props }, {}), { wrapper });
        return renderHookResult.result;
    };

    afterEach(() => {
        [useInstance as jest.Mock, api, useApi as jest.Mock].forEach((mock) => mock.mockClear());
    });

    describe('message state', () => {
        it('should initialize message in cache if not existing', () => {
            const result = setup();
            expect(result.current[0]).toEqual({ data: { ID } });
        });

        it('should returns message from the cache', () => {
            const cache = createCache();
            const message = {};
            cache.set(ID, message);
            const result = setup(cache);
            expect(result.current[0]).toBe(message);
        });
    });

    describe('message actions', () => {
        it('should load a message with an api call', async () => {
            const Message = {};
            api.mockResolvedValue({ Message });
            const result = setup(createCache());
            await act(async () => {
                await result.current[1].load();
            });
            expect(result.current[0].data).toBe(Message);
            expect(result.current[0].loaded).toBe(true);
        });
    });
});
