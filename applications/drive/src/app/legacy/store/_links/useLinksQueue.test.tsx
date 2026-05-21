import { act, renderHook } from '@testing-library/react-hooks';

import { useLinksQueue } from './useLinksQueue';

const mockedLoadLinksMeta = jest.fn();
jest.mock('./useLinksListing', () => ({
    useLinksListing: () => ({
        loadLinksMeta: mockedLoadLinksMeta,
    }),
}));

const mockedGetLink = jest.fn();
jest.mock('./useLinksState', () => ({
    __esModule: true,
    default: () => ({
        getLink: mockedGetLink,
    }),
}));

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

const mockedAbort = jest.fn();
const mockedAbortSignal = { aborted: false };
// @ts-ignore - not mocking the entire AbortSignal, sorry =)
global.AbortController = jest.fn(() => ({
    signal: mockedAbortSignal,
    abort: mockedAbort,
}));

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

        jest.clearAllTimers();
        jest.clearAllMocks();
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

        jest.runAllTimers();

        expect(setTimeout).toHaveBeenCalledTimes(items.length);
        expect(mockedLoadLinksMeta).toHaveBeenCalledTimes(1);
    });

    it('should not load links if the domRef is null', async () => {
        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId', getFakeRef(null));
        });

        jest.runAllTimers();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockedLoadLinksMeta).not.toHaveBeenCalled();
    });

    it('should abort when the hook is unmounted', async () => {
        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        jest.runAllTimers();
        unmountHook();

        expect(mockedAbort).toHaveBeenCalled();
    });

    it('should not load links if aborted', async () => {
        mockedAbortSignal.aborted = true;

        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        jest.runAllTimers();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockedLoadLinksMeta).not.toHaveBeenCalled();
    });

    it('should not infinite loop if loadLinksMeta fails', async () => {
        // Silence console errors
        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockedLoadLinksMeta.mockRejectedValue(new Error('oh no'));

        await act(async () => {
            hook.current.addToQueue(SHARE_ID, 'linkId');
        });

        await jest.runAllTimersAsync();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(mockedLoadLinksMeta).toHaveBeenCalledTimes(1);
        expect(consoleErrorMock).toHaveBeenCalledTimes(1);

        consoleErrorMock.mockRestore();
    }, 1000);
});
