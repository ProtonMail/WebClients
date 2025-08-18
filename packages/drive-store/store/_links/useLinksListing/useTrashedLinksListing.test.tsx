import { act, renderHook } from '@testing-library/react-hooks';

import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import { LinksStateProvider } from '../useLinksState';
import { PAGE_SIZE } from './useLinksListingHelpers';
import { useTrashedLinksListing } from './useTrashedLinksListing';

jest.mock('@proton/shared/lib/api/drive/volume', () => ({
    queryVolumeTrash: jest.fn(),
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

const queryVolumeTrashMock = require('@proton/shared/lib/api/drive/volume').queryVolumeTrash as jest.Mock;
const generateArrayOfRandomStrings = (size: number): string[] => {
    return Array.from({ length: size }, () => Math.random().toString(36).substring(2));
};

describe('useTrashedLinksListing', () => {
    let hook: {
        current: ReturnType<typeof useTrashedLinksListing>;
    };

    beforeEach(() => {
        jest.resetAllMocks();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>
                <LinksStateProvider>{children}</LinksStateProvider>
            </VolumesStateProvider>
        );

        const { result } = renderHook(() => useTrashedLinksListing(), { wrapper });
        hook = result;

        jest.resetAllMocks();
    });

    it('should fetch the first page of trashed links for a given volume', async () => {
        const volumeId = '1';
        const page = 0;
        const response = {
            Trash: [{ ShareID: '1', LinkIDs: generateArrayOfRandomStrings(10) }],
        };

        mockRequest.mockResolvedValue(response);

        await act(async () => {
            await hook.current.loadTrashedLinks(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(queryVolumeTrashMock).toHaveBeenCalledWith(volumeId, { Page: page, PageSize: PAGE_SIZE });
    });

    it('should increment the page count when fetching the next page of trashed links', async () => {
        const volumeId = '1';
        const page = 0;
        const firstResponse = {
            Trash: [{ ShareID: '1', LinkIDs: generateArrayOfRandomStrings(PAGE_SIZE) }],
        };
        const secondResponse = {
            Trash: [{ ShareID: '1', LinkIDs: generateArrayOfRandomStrings(1) }],
        };
        mockRequest.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

        const { loadTrashedLinks } = hook.current;

        await act(async () => {
            await loadTrashedLinks(new AbortController().signal, volumeId, () =>
                Promise.resolve({ links: [], parents: [], errors: [] })
            );
        });

        expect(queryVolumeTrashMock).toHaveBeenCalledWith(volumeId, { Page: page + 1, PageSize: PAGE_SIZE });
        // verify that the script terminates successfully
        expect(queryVolumeTrashMock).toBeCalledTimes(2);
    });
});
