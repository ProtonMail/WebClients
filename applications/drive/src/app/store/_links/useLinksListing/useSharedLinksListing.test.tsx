import { act, renderHook } from '@testing-library/react-hooks';

import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import { LinksStateProvider } from '../useLinksState';
import { PAGE_SIZE } from './useLinksListingHelpers';
import { useSharedLinksListing } from './useSharedLinksListing';

jest.mock('@proton/shared/lib/api/drive/volume', () => ({
    queryVolumeSharedLinks: jest.fn(),
}));

const mockRequest = jest.fn();
jest.mock('../../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return useDebouncedRequest;
});

jest.mock('../../_utils/errorHandler', () => {
    return {
        useErrorHandler: () => ({
            showErrorNotification: jest.fn(),
            showAggregatedErrorNotification: jest.fn(),
        }),
    };
});

jest.mock('../useLink', () => {
    const useLink = () => {
        return {
            decryptLink: jest.fn(),
        };
    };
    return useLink;
});

const queryVolumeSharedLinksMock = require('@proton/shared/lib/api/drive/volume').queryVolumeSharedLinks as jest.Mock;
const generateArrayOfRandomStrings = (size: number): string[] => {
    return Array.from({ length: size }, () => Math.random().toString(36).substring(2));
};

describe('useSharedLinksListing', () => {
    let hook: {
        current: ReturnType<typeof useSharedLinksListing>;
    };

    beforeEach(() => {
        jest.resetAllMocks();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>
                <LinksStateProvider>{children}</LinksStateProvider>
            </VolumesStateProvider>
        );

        const { result } = renderHook(() => useSharedLinksListing(), { wrapper });
        hook = result;

        jest.resetAllMocks();
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
            await hook.current.loadSharedLinks(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(queryVolumeSharedLinksMock).toHaveBeenCalledWith(volumeId, { Page: page, PageSize: PAGE_SIZE });
    });

    it('should increment the page count when fetching the next page of shared links', async () => {
        const volumeId = '1';
        const page = 0;
        let firstResponse = {
            ShareURLContexts: [
                {
                    ContextShareID: '1',
                    LinkIDs: generateArrayOfRandomStrings(PAGE_SIZE),
                    ShareURLs: generateArrayOfRandomStrings(PAGE_SIZE),
                },
            ],
        };
        let secondResponse = {
            ShareURLContexts: [
                {
                    ContextShareID: '1',
                    LinkIDs: generateArrayOfRandomStrings(1),
                    ShareURLs: generateArrayOfRandomStrings(1),
                },
            ],
        };
        mockRequest.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

        const { loadSharedLinks } = hook.current;

        await act(async () => {
            await loadSharedLinks(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(queryVolumeSharedLinksMock).toHaveBeenCalledWith(volumeId, { Page: page + 1, PageSize: PAGE_SIZE });
        // verify that the script terminates successfully
        expect(queryVolumeSharedLinksMock).toBeCalledTimes(2);
    });
});
