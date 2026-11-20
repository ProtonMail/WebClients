import { act, renderHook } from '@testing-library/react';

import { useLinksQueue } from './useLinksQueue';

const mockedLoadLinksMeta = vi.fn();
vi.mock('./useLinksListing', () => ({
    useLinksListing: () => ({
        loadLinksMeta: mockedLoadLinksMeta,
    }),
}));

const mockedGetLink = vi.fn();
vi.mock('./useLinksState', () => ({
    __esModule: true,
    default: () => ({
        getLink: mockedGetLink,
    }),
}));

vi.useFakeTimers();
vi.spyOn(global, 'setTimeout');

const mockedAbort = vi.fn();
const mockedAbortSignal = { aborted: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
// @ts-ignore - not mocking the entire AbortSignal, sorry =)
global.AbortController = vi.fn(function () {
    return {
        signal: mockedAbortSignal,
        abort: mockedAbort,
    };
});

const SHARE_ID = 'shareId';

const getLinkIds = (count: number) => [...Array(count).keys()].map((id) => `linkId-${id}`);
const getFakeRef: <T>(value: T) => React.MutableRefObject<T> = (value) => ({ current: value });

describe('useLinksQueue', () => {
    let hook: {
        current: ReturnType<typeof useLinksQueue>;
    };
    let unmountHook: () => void;

    beforeEach(() => {
        const { result, unmount } = renderHook(() => useLinksQueue());

        hook = result;
        unmountHook = unmount;

        vi.clearAllTimers();
        vi.clearAllMocks();
        mockedGetLink.mockReset();
        mockedLoadLinksMeta.mockReset();

        mockedAbort.mockReset();
        mockedAbortSignal.aborted = false;

        mockedGetLink.mockImplementation(() => undefined);
    });

    it('should not add to queue if link is already in state', async () => {
        mockedGetLink.mockImplementation((shareId, linkId) => ({
            shareId,
            linkId,
        }));

        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should not add to queue if linkId is already in queue', async () => {
        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('should debounce processing to wait for the queue to fill up', async () => {
        const items = getLinkIds(7);

        await act(async () => {
            items.forEach((item) => hook.current.addToQueue(SHARE_ID, item));
        });

        vi.runAllTimers();

        expect(setTimeout).toHaveBeenCalledTimes(items.length);
        expect(mockedLoadLinksMeta).toHaveBeenCalledTimes(1);
    });

    it('should not load links if the domRef is null', async () => {
        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId', getFakeRef(null));
        });

        vi.runAllTimers();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockedLoadLinksMeta).not.toHaveBeenCalled();
    });

    it('should abort when the hook is unmounted', async () => {
        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        vi.runAllTimers();
        unmountHook();

        expect(mockedAbort).toHaveBeenCalled();
    });

    it('should not load links if aborted', async () => {
        mockedAbortSignal.aborted = true;

        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        vi.runAllTimers();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockedLoadLinksMeta).not.toHaveBeenCalled();
    });

    it('should not infinite loop if loadLinksMeta fails', async () => {
        // Silence console errors
        const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockedLoadLinksMeta.mockRejectedValue(new Error('oh no'));

        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        await vi.runAllTimersAsync();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockedLoadLinksMeta).toHaveBeenCalledTimes(1);
        expect(consoleErrorMock).toHaveBeenCalledTimes(1);

        consoleErrorMock.mockRestore();
    }, 1000);
});
