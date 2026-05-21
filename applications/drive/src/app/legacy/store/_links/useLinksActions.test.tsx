import { renderHook } from '@testing-library/react-hooks';

import { API_CODES } from '@proton/shared/lib/constants';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';

import { VolumesStateProvider } from '../_volumes/useVolumesState';
import { useLinksActions } from './useLinksActions';

jest.mock('@proton/components/hooks/usePreventLeave', () => {
    const usePreventLeave = () => {
        return {
            preventLeave: (fn: any) => fn,
        };
    };
    return usePreventLeave;
});

jest.mock('../_events/useDriveEventManager', () => {
    const useDriveEventManager = () => {
        return {
            pollEvents: {
                volumes: () => Promise.resolve(),
            },
        };
    };
    return {
        useDriveEventManager,
    };
});

jest.mock('./useLinksState', () => {
    const useLinksState = () => {
        return {
            lockLinks: () => {},
            lockTrash: () => {},
            unlockLinks: () => {},
        };
    };

    return useLinksState;
});

jest.mock('../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {
            getPrimaryAddressKey: () => {},
            getOwnAddressAndPrimaryKeys: () => {},
        };
    };

    return useDriveCrypto;
});

jest.mock('./useLink', () => {
    const useLink = () => {
        return {
            getLink: () => {},
            getLinkPassphraseAndSessionKey: () => {},
            getLinkPrivateKey: () => {},
            getLinkHashKey: () => {},
        };
    };

    return useLink;
});

const mockRequest = jest.fn();
const mockGetLinks = jest.fn();
const mockBatchHelper = jest.fn();

const mockQueryTrashLinks = jest.fn();
const mockQueryRestoreLinks = jest.fn();
const mockQueryDeleteTrashedLinks = jest.fn();
const mockGetShare = jest.fn();
const mockGetDefaultShare = jest.fn();
const mockGetDefaultPhotosShare = jest.fn();
const mockGetShareCreatorKeys = jest.fn();

jest.mock('./useLinks', () => {
    const useLink = () => {
        return {
            getLinks: mockGetLinks,
        };
    };

    return useLink;
});

jest.mock('../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return useDebouncedRequest;
});

jest.mock('../_shares/useShare', () => {
    const useShare = () => {
        return {
            getShare: mockGetShare,
            getShareCreatorKeys: mockGetShareCreatorKeys,
        };
    };
    return useShare;
});

jest.mock('../_shares/useDefaultShare', () => {
    const useDefaultShare = () => {
        return {
            getDefaultShare: mockGetDefaultShare,
            getDefaultPhotosShare: mockGetDefaultPhotosShare,
        };
    };
    return useDefaultShare;
});

jest.mock('../_utils/useBatchHelper', () => {
    const useBatchHelper = () => ({
        batchAPIHelper: mockBatchHelper,
        batchPromiseHelper: jest.fn(),
    });
    return { useBatchHelper };
});

const SHARE_ID_0 = 'shareId00';
const SHARE_ID_1 = 'shareId01';
const VOLUME_ID_0 = 'volumeId00';
const VOLUME_ID_1 = 'volumeId01';

// TODO: Test suite incomplete
// covers operations allowing using links from multiple volumes
describe('useLinksActions', () => {
    let hook: {
        current: ReturnType<typeof useLinksActions>;
    };

    beforeAll(() => {
        // Prevent warning to be shown in the console when running tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        mockRequest.mockImplementation((linkIds: string[]) => {
            return Promise.resolve({
                Responses: linkIds.map(() => ({
                    Response: {
                        Code: API_CODES.SINGLE_SUCCESS,
                    },
                })),
            });
        });

        mockBatchHelper.mockImplementation(
            async (
                _signal: AbortSignal,
                {
                    linkIds,
                    query,
                }: {
                    linkIds: string[];
                    query: (batchLinkIds: string[]) => Promise<object> | object;
                    maxParallelRequests?: number;
                }
            ) => {
                await query(linkIds);

                const response = {
                    Responses: linkIds.map((linkId) => ({
                        LinkID: linkId,
                        Response: {
                            Code: API_CODES.SINGLE_SUCCESS,
                            Error: null,
                        },
                    })),
                };

                return {
                    responses: [{ batchLinkIds: linkIds, response }],
                    successes: linkIds,
                    failures: {},
                };
            }
        );

        mockQueryTrashLinks.mockImplementation((volumeId, linkIds) => linkIds);
        mockQueryRestoreLinks.mockImplementation((volumeId, linkIds) => linkIds);
        mockQueryDeleteTrashedLinks.mockImplementation((volumeId, linkIds) => linkIds);
        mockGetShare.mockImplementation((_ac, shareId) => ({ shareId, type: 0 }));
        mockGetDefaultShare.mockImplementation(() => ({ volumeId: VOLUME_ID_0 }));
        mockGetDefaultPhotosShare.mockImplementation(() => null);
        mockGetShareCreatorKeys.mockImplementation(() => ({ privateKey: {}, address: { Email: 'test@test.com' } }));

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>{children}</VolumesStateProvider>
        );

        const { result } = renderHook(
            () =>
                useLinksActions({
                    queries: {
                        queryTrashLinks: mockQueryTrashLinks,
                        queryRestoreLinks: mockQueryRestoreLinks,
                        queryDeleteTrashedLinks: mockQueryDeleteTrashedLinks,
                        queryDeleteChildrenLinks: jest.fn(),
                    },
                }),
            { wrapper }
        );
        hook = result;
    });

    it('trashes links from different volumes', async () => {
        /*
            volumeId00
            └── links: linkId03, linkId04, linkId05
            volumeId01
            └── links: linkId12, linkId14
        */

        const ac = new AbortController();
        const result = await hook.current.trashLinks(ac.signal, [
            { volumeId: VOLUME_ID_0, linkId: 'linkId03' },
            { volumeId: VOLUME_ID_0, linkId: 'linkId04' },
            { volumeId: VOLUME_ID_0, linkId: 'linkId05' },
            { volumeId: VOLUME_ID_1, linkId: 'linkId14' },
            { volumeId: VOLUME_ID_1, linkId: 'linkId12' },
        ]);

        expect(mockBatchHelper).toHaveBeenCalledWith(ac.signal, {
            linkIds: ['linkId03', 'linkId04', 'linkId05'],
            query: expect.any(Function),
            maxParallelRequests: MAX_THREADS_PER_REQUEST,
        });

        expect(mockBatchHelper).toHaveBeenCalledWith(ac.signal, {
            linkIds: ['linkId14', 'linkId12'],
            query: expect.any(Function),
            maxParallelRequests: MAX_THREADS_PER_REQUEST,
        });

        // ensure api requests are invoked by correct groups
        expect(mockQueryTrashLinks).toHaveBeenCalledWith(VOLUME_ID_0, ['linkId03', 'linkId04', 'linkId05']);
        expect(mockQueryTrashLinks).toHaveBeenCalledWith(VOLUME_ID_1, ['linkId14', 'linkId12']);

        // verify all requested links were processed
        expect(result.successes.sort()).toEqual(['linkId03', 'linkId04', 'linkId05', 'linkId12', 'linkId14'].sort());
    });

    it('restores links from different volumes', async () => {
        /*
            volumeId00
            └── links: linkId01, linkId04
            volumeId01
            └── links: linkId11
        */

        // emulate partial state
        const state: Record<string, any> = {
            linkId01: {
                linkId: 'linkId01',
                volumeId: VOLUME_ID_0,
                shareId: SHARE_ID_0,
                trashed: 3,
            },
            linkId04: {
                linkId: 'linkId04',
                volumeId: VOLUME_ID_0,
                shareId: SHARE_ID_0,
                trashed: 1,
            },
            linkId11: {
                linkId: 'linkId11',
                volumeId: VOLUME_ID_1,
                shareId: SHARE_ID_1,
                trashed: 3,
            },
        };

        mockGetLinks.mockImplementation(async (_signal, ids: { linkId: string }[]) => {
            return ids.map((idGroup) => state[idGroup.linkId]).filter(isTruthy);
        });

        const ac = new AbortController();
        const result = await hook.current.restoreLinks(ac.signal, [
            { volumeId: VOLUME_ID_0, shareId: SHARE_ID_0, linkId: 'linkId01' },
            { volumeId: VOLUME_ID_0, shareId: SHARE_ID_0, linkId: 'linkId04' },
            { volumeId: VOLUME_ID_1, shareId: SHARE_ID_1, linkId: 'linkId11' },
        ]);

        expect(mockBatchHelper).toHaveBeenCalledWith(ac.signal, {
            linkIds: ['linkId01', 'linkId04'],
            query: expect.any(Function),
            maxParallelRequests: 1,
        });

        expect(mockBatchHelper).toHaveBeenCalledWith(ac.signal, {
            linkIds: ['linkId11'],
            query: expect.any(Function),
            maxParallelRequests: 1,
        });

        expect(mockQueryRestoreLinks).toHaveBeenCalledWith(VOLUME_ID_0, [
            'linkId01',
            'linkId04', // this link has been deleted before link linkId, thus restored last
        ]);
        expect(mockQueryRestoreLinks).toHaveBeenCalledWith(VOLUME_ID_1, ['linkId11']);

        expect(result.successes.sort()).toEqual(['linkId01', 'linkId04', 'linkId11'].sort());
    });

    it('deletes trashed links from different volumes', async () => {
        /*
            volumeId00
            └── links: linkId01, linkId04
            volumeId01
            └── links: linkId11
        */

        const ac = new AbortController();
        const result = await hook.current.deleteTrashedLinks(ac.signal, [
            { volumeId: VOLUME_ID_0, linkId: 'linkId01' },
            { volumeId: VOLUME_ID_0, linkId: 'linkId04' },
            { volumeId: VOLUME_ID_1, linkId: 'linkId11' },
        ]);

        expect(mockBatchHelper).toHaveBeenCalledWith(ac.signal, {
            linkIds: ['linkId01', 'linkId04'],
            query: expect.any(Function),
            maxParallelRequests: MAX_THREADS_PER_REQUEST,
        });

        expect(mockBatchHelper).toHaveBeenCalledWith(ac.signal, {
            linkIds: ['linkId11'],
            query: expect.any(Function),
            maxParallelRequests: MAX_THREADS_PER_REQUEST,
        });

        expect(mockQueryDeleteTrashedLinks).toHaveBeenCalledWith(VOLUME_ID_0, ['linkId01', 'linkId04']);
        expect(mockQueryDeleteTrashedLinks).toHaveBeenCalledWith(VOLUME_ID_1, ['linkId11']);

        expect(result.successes.sort()).toEqual(['linkId01', 'linkId04', 'linkId11'].sort());
    });
});
