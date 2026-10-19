import { act, renderHook, waitFor } from '@testing-library/react';

import type { GeneratedAssetFromApi } from '../../../remote/api';
import { CREATIONS_LIST_PAGE_SIZE } from '../creationsPagination';
import { useGeneratedGalleryCreations } from './useGeneratedGalleryCreations';

const mockListGeneratedAssets = jest.fn();

jest.mock('../../../hooks/useIsChatHistoryHydrating', () => {
    return { useIsChatHistoryHydrating: () => false };
});
jest.mock('../../../redux/thunk', () => {
    return {
        extraThunkArguments: {
            lumoApi: { listGeneratedAssets: (...args: unknown[]) => mockListGeneratedAssets(...args) },
        },
    };
});
jest.mock('../../../redux/hooks', () => {
    const state = {
        idmap: { remote2local: { space: { 'remote-space': 'space' } } },
        spaces: { space: {} },
        attachments: {},
    };
    return {
        useLumoDispatch: () => jest.fn(),
        useLumoStore: () => ({ getState: () => state }),
    };
});

const asset = (id: string, unixSeconds: number): GeneratedAssetFromApi => {
    return {
        ID: id,
        SpaceID: 'remote-space',
        AssetTag: `tag-${id}`,
        CreateTime: new Date(unixSeconds * 1000).toISOString(),
    };
};

// A full page, newest first, one asset per minute going back from `newest`.
const fullPage = (prefix: string, newest: number) => {
    return Array.from({ length: CREATIONS_LIST_PAGE_SIZE }, (_, index) => {
        return asset(`${prefix}-${index}`, newest - index * 60);
    });
};

const NOW = 1_800_000_000;

describe('useGeneratedGalleryCreations', () => {
    beforeEach(() => {
        mockListGeneratedAssets.mockReset();
        jest.spyOn(Date, 'now').mockReturnValue(NOW * 1000);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('lists a small library in one request covering all history', async () => {
        mockListGeneratedAssets.mockResolvedValueOnce([
            asset('a', NOW - 10),
            asset('b', NOW - 20),
            asset('c', NOW - 30),
        ]);

        const { result } = renderHook(() => {
            return useGeneratedGalleryCreations();
        });

        await waitFor(() => {
            expect(result.current.status).toBe('loaded');
        });
        expect(result.current.items).toHaveLength(3);
        expect(mockListGeneratedAssets).toHaveBeenCalledTimes(1);
        expect(mockListGeneratedAssets).toHaveBeenCalledWith(
            expect.objectContaining({ pageSize: CREATIONS_LIST_PAGE_SIZE, createTimeSince: 0, createTimeUntil: NOW })
        );
    });

    it('continues from the oldest second of a full page and drops the overlap', async () => {
        const first = fullPage('first', NOW);
        const oldestSecond = NOW - (CREATIONS_LIST_PAGE_SIZE - 1) * 60;
        // The inclusive bound returns the last asset of the first page again, plus one it had cut off.
        mockListGeneratedAssets
            .mockResolvedValueOnce(first)
            .mockResolvedValueOnce([first[first.length - 1], asset('same-second', oldestSecond), asset('older', 100)]);

        const { result } = renderHook(() => {
            return useGeneratedGalleryCreations();
        });

        await waitFor(() => {
            expect(result.current.status).toBe('loaded');
        });
        expect(mockListGeneratedAssets).toHaveBeenLastCalledWith(
            expect.objectContaining({ createTimeUntil: oldestSecond })
        );
        const ids = result.current.items.map((item) => {
            return item.remoteId;
        });
        expect(ids).toHaveLength(CREATIONS_LIST_PAGE_SIZE + 2);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('keeps what loaded when a later page fails, and retry resumes from there', async () => {
        const first = fullPage('first', NOW);
        const oldestSecond = NOW - (CREATIONS_LIST_PAGE_SIZE - 1) * 60;
        mockListGeneratedAssets
            .mockResolvedValueOnce(first)
            .mockRejectedValueOnce(new Error('503'))
            .mockResolvedValueOnce([asset('older', 100)]);

        const { result } = renderHook(() => {
            return useGeneratedGalleryCreations();
        });

        await waitFor(() => {
            expect(result.current.status).toBe('error');
        });
        expect(result.current.items).toHaveLength(CREATIONS_LIST_PAGE_SIZE);

        act(() => {
            result.current.retry();
        });
        await waitFor(() => {
            expect(result.current.status).toBe('loaded');
        });
        expect(mockListGeneratedAssets).toHaveBeenLastCalledWith(
            expect.objectContaining({ createTimeUntil: oldestSecond })
        );
        expect(result.current.items).toHaveLength(CREATIONS_LIST_PAGE_SIZE + 1);
    });
});
