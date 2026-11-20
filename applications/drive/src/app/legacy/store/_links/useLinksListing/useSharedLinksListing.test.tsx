import { act, renderHook } from '@testing-library/react';

import { querySharedByMeLinks } from '@proton/shared/lib/api/drive/sharing';
import { queryVolumeSharedLinks } from '@proton/shared/lib/api/drive/volume';

import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import { LinksStateProvider } from '../useLinksState';
import { PAGE_SIZE } from './useLinksListingHelpers';
import { useSharedLinksListing } from './useSharedLinksListing';

vi.mock('@proton/shared/lib/api/drive/volume', () => ({
    queryVolumeSharedLinks: vi.fn(),
}));

vi.mock('@proton/shared/lib/api/drive/sharing', () => ({
    querySharedByMeLinks: vi.fn(),
}));

const mockRequest = vi.fn();
vi.mock('../../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return { __esModule: true, default: useDebouncedRequest };
});

vi.mock('../../_utils/errorHandler', () => {
    return {
        useErrorHandler: () => ({
            showErrorNotification: vi.fn(),
            showAggregatedErrorNotification: vi.fn(),
        }),
    };
});

vi.mock('../useLink', () => {
    const useLink = () => {
        return {
            decryptLink: vi.fn(),
        };
    };
    return { __esModule: true, default: useLink };
});

const queryVolumeSharedLinksMock = vi.mocked(queryVolumeSharedLinks);
const querySharedByMeLinksMock = vi.mocked(querySharedByMeLinks);
const generateArrayOfRandomStrings = (size: number): string[] => {
    return Array.from({ length: size }, (_, index) => `link-${index}`);
};

describe('useSharedLinksListing LEGACY', () => {
    let hook: {
        current: ReturnType<typeof useSharedLinksListing>;
    };

    beforeEach(() => {
        vi.resetAllMocks();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>
                <LinksStateProvider>{children}</LinksStateProvider>
            </VolumesStateProvider>
        );

        const { result } = renderHook(() => useSharedLinksListing(), { wrapper });
        hook = result;

        vi.resetAllMocks();
    });

    it('should fetch the first page of shared links for a given volume', async () => {
        const volumeId = '1';
        const page = 0;
        const response = {
            ShareURLContexts: [
                {
                    ContextShareID: '1',
                    LinkIDs: generateArrayOfRandomStrings(10),
                    ShareURLs: generateArrayOfRandomStrings(10),
                },
            ],
        };

        mockRequest.mockResolvedValue(response);

        await act(async () => {
            await hook.current.loadSharedLinksLEGACY(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(queryVolumeSharedLinksMock).toHaveBeenCalledWith(volumeId, { Page: page, PageSize: PAGE_SIZE });
    });

    it('should increment the page count when fetching the next page of shared links', async () => {
        const volumeId = '1';
        const page = 0;
        const firstResponse = {
            ShareURLContexts: [
                {
                    ContextShareID: '1',
                    LinkIDs: generateArrayOfRandomStrings(PAGE_SIZE),
                    ShareURLs: generateArrayOfRandomStrings(PAGE_SIZE),
                },
            ],
        };
        const secondResponse = {
            ShareURLContexts: [
                {
                    ContextShareID: '1',
                    LinkIDs: generateArrayOfRandomStrings(1),
                    ShareURLs: generateArrayOfRandomStrings(1),
                },
            ],
        };
        mockRequest.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

        const { loadSharedLinksLEGACY } = hook.current;

        await act(async () => {
            await loadSharedLinksLEGACY(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(queryVolumeSharedLinksMock).toHaveBeenCalledWith(volumeId, { Page: page + 1, PageSize: PAGE_SIZE });
        // verify that the script terminates successfully
        expect(queryVolumeSharedLinksMock).toHaveBeenCalledTimes(2);
    });
});

describe('useSharedLinksListing', () => {
    let hook: {
        current: ReturnType<typeof useSharedLinksListing>;
    };

    beforeEach(() => {
        vi.resetAllMocks();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>
                <LinksStateProvider>{children}</LinksStateProvider>
            </VolumesStateProvider>
        );

        const { result } = renderHook(() => useSharedLinksListing(), { wrapper });
        hook = result;

        vi.resetAllMocks();
    });

    it('should fetch the first batch of shared by me links for a given volume', async () => {
        const volumeId = '1';
        const response = {
            Links: [
                {
                    LinkID: 'linkID',
                    ShareID: 'shareID',
                    ContextShareID: 'contextShareID',
                },
            ],
        };

        mockRequest.mockResolvedValue(response);

        await act(async () => {
            await hook.current.loadSharedByMeLinks(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });
        expect(querySharedByMeLinksMock).toHaveBeenCalledWith(volumeId, { AnchorID: undefined });
    });

    it('should call again if there is more shared links', async () => {
        const volumeId = '1';
        const firstResponse = {
            More: true,
            AnchorID: 'linkID',
            Links: [
                {
                    LinkID: 'linkID',
                    ShareID: 'shareID',
                    ContextShareID: 'contextShareID',
                },
            ],
        };
        const secondResponse = {
            AnchorID: 'linkID2',
            Links: [
                {
                    LinkID: 'linkID2',
                    ShareID: 'shareID2',
                    ContextShareID: 'contextShareID2',
                },
            ],
        };
        mockRequest.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

        const { loadSharedByMeLinks } = hook.current;

        await act(async () => {
            await loadSharedByMeLinks(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(querySharedByMeLinksMock).toHaveBeenCalledWith(volumeId, { AnchorID: 'linkID' });
        // verify that the script terminates successfully
        expect(querySharedByMeLinksMock).toHaveBeenCalledTimes(2);
    });
});
