import { renderHook } from '@testing-library/react';

import { API_CODES } from '@proton/shared/lib/constants';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';

import { ShareType } from '../_shares/interface';
import { VolumesStateProvider } from '../_volumes/useVolumesState';
import { useLinksActions } from './useLinksActions';

vi.mock('@proton/components/hooks/usePreventLeave', () => {
    const usePreventLeave = () => {
        return {
            preventLeave: (fn: any) => fn,
        };
    };
    return { __esModule: true, default: usePreventLeave };
});

vi.mock('./useLinksState', () => {
    const useLinksState = () => {
        return {
            lockLinks: () => {},
            lockTrash: () => {},
            unlockLinks: () => {},
        };
    };

    return { __esModule: true, default: useLinksState };
});

vi.mock('../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {
            getPrimaryAddressKey: () => {},
            getOwnAddressAndPrimaryKeys: () => {},
        };
    };

    return { __esModule: true, default: useDriveCrypto };
});

const mockGetLink = vi.fn();

vi.mock('./useLink', () => {
    const useLink = () => {
        return {
            getLink: mockGetLink,
            getLinkPassphraseAndSessionKey: async () => ({ passphrase: 'passphrase', passphraseSessionKey: {} }),
            getLinkPrivateKey: async () => ({}),
            getLinkHashKey: async () => new Uint8Array(),
        };
    };

    return { __esModule: true, default: useLink };
});

vi.mock('@proton/shared/lib/keys/driveKeys', () => ({
    generateLookupHash: async () => 'hash',
    encryptPassphrase: async () => ({ NodePassphrase: 'nodePassphrase', NodePassphraseSignature: 'signature' }),
}));

vi.mock('@proton/shared/lib/keys/drivePassphrase', () => ({
    getDecryptedSessionKey: async () => ({}),
}));

vi.mock('@protontech/crypto', () => ({
    CryptoProxy: {
        encryptMessage: async () => ({ message: 'encryptedName' }),
    },
}));

vi.mock('@proton/drive/legacy/errorHandling', async () => ({
    ...(await vi.importActual('@proton/drive/legacy/errorHandling')),
    sendErrorReport: vi.fn(),
}));

const mockRequest = vi.fn();
const mockGetLinks = vi.fn();
const mockBatchHelper = vi.fn();

const mockQueryTrashLinks = vi.fn();
const mockQueryRestoreLinks = vi.fn();
const mockQueryDeleteTrashedLinks = vi.fn();
const mockGetShare = vi.fn();
const mockGetDefaultShare = vi.fn();
const mockGetDefaultPhotosShare = vi.fn();
const mockGetShareCreatorKeys = vi.fn();

vi.mock('./useLinks', () => {
    const useLink = () => {
        return {
            getLinks: mockGetLinks,
        };
    };

    return { __esModule: true, default: useLink };
});

vi.mock('../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return { __esModule: true, default: useDebouncedRequest };
});

vi.mock('../_shares/useShare', () => {
    const useShare = () => {
        return {
            getShare: mockGetShare,
            getShareCreatorKeys: mockGetShareCreatorKeys,
        };
    };
    return { __esModule: true, default: useShare };
});

vi.mock('../_shares/useDefaultShare', () => {
    const useDefaultShare = () => {
        return {
            getDefaultShare: mockGetDefaultShare,
            getDefaultPhotosShare: mockGetDefaultPhotosShare,
        };
    };
    return { useDefaultShare };
});

vi.mock('../_utils/useBatchHelper', () => {
    const useBatchHelper = () => ({
        batchAPIHelper: mockBatchHelper,
        batchPromiseHelper: async <T, R>(items: T[], processFn: (item: T) => Promise<R>) =>
            Promise.all(items.map(processFn)),
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
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterAll(() => {
        vi.restoreAllMocks();
    });

    beforeEach(() => {
        vi.resetAllMocks();
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
                        queryDeleteChildrenLinks: vi.fn(),
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

    describe('recoverPhotoLinks', () => {
        const PHOTOS_SHARE_ID = 'photosShareId';
        const ROOT_LINK_ID = 'rootLinkId';

        const makeLink = (linkId: string, extra: object = {}) => ({
            linkId,
            name: `${linkId}.jpg`,
            hash: `${linkId}-hash`,
            parentLinkId: 'oldRootLinkId',
            nameSignatureEmail: 'test@test.com',
            signatureEmail: 'test@test.com',
            digests: { sha1: 'sha1' },
            ...extra,
        });

        const recover = (linkIds: string[]) =>
            hook.current.recoverPhotoLinks(new AbortController().signal, VOLUME_ID_0, {
                shareId: SHARE_ID_0,
                linkIds,
                newParentLinkId: ROOT_LINK_ID,
                newShareId: PHOTOS_SHARE_ID,
            });

        let sentLinkIds: string[];
        const getSentLinkIds = () => sentLinkIds;

        beforeEach(() => {
            sentLinkIds = [];
            mockGetShare.mockImplementation((_ac, shareId) => ({ shareId, type: ShareType.photos }));

            // Record the links sent in the recover request
            const batchHelper = mockBatchHelper.getMockImplementation();
            mockBatchHelper.mockImplementation((signal, { query, ...options }) =>
                batchHelper?.(signal, {
                    ...options,
                    query: (batchLinkIds: string[]) => {
                        const request = query(batchLinkIds);
                        sentLinkIds.push(...request.data.Links.map(({ LinkID }: { LinkID: string }) => LinkID));
                        return request;
                    },
                })
            );
        });

        it('moves the other links when one cannot be prepared', async () => {
            const links: Record<string, object> = {
                linkId01: makeLink('linkId01'),
                linkId02: makeLink('linkId02', { corruptedLink: true }),
                linkId03: makeLink('linkId03'),
            };
            mockGetLink.mockImplementation(async (_ac, _shareId, linkId: string) => links[linkId]);

            const result = await recover(['linkId01', 'linkId02', 'linkId03']);

            expect(getSentLinkIds()).toEqual(['linkId01', 'linkId03']);
            expect(result.successes.sort()).toEqual(['linkId01', 'linkId03']);
            expect(Object.keys(result.failures)).toEqual(['linkId02']);
        });

        it('fails the main photo when one of its related photos cannot be prepared', async () => {
            const links: Record<string, object> = {
                linkId01: makeLink('linkId01', {
                    activeRevision: { photo: { relatedPhotosLinkIds: ['relatedId01'] } },
                }),
                relatedId01: makeLink('relatedId01', { corruptedLink: true }),
                linkId02: makeLink('linkId02'),
            };
            mockGetLink.mockImplementation(async (_ac, _shareId, linkId: string) => links[linkId]);

            const result = await recover(['linkId01', 'linkId02']);

            expect(getSentLinkIds()).toEqual(['linkId02']);
            expect(result.successes).toEqual(['linkId02']);
            expect(Object.keys(result.failures)).toEqual(['linkId01']);
        });

        it('fails a related photo listed on its own when its main photo cannot be prepared', async () => {
            const links: Record<string, object> = {
                linkId01: makeLink('linkId01', {
                    corruptedLink: true,
                    activeRevision: { photo: { relatedPhotosLinkIds: ['relatedId01'] } },
                }),
                relatedId01: makeLink('relatedId01', {
                    activeRevision: { photo: { mainPhotoLinkId: 'linkId01' } },
                }),
                linkId02: makeLink('linkId02'),
            };
            mockGetLink.mockImplementation(async (_ac, _shareId, linkId: string) => links[linkId]);

            const result = await recover(['linkId01', 'relatedId01', 'linkId02']);

            expect(getSentLinkIds()).toEqual(['linkId02']);
            expect(result.successes).toEqual(['linkId02']);
            expect(Object.keys(result.failures).sort()).toEqual(['linkId01', 'relatedId01']);
        });

        it('sends nothing when no link can be prepared', async () => {
            mockGetLink.mockImplementation(async (_ac, _shareId, linkId: string) =>
                makeLink(linkId, { corruptedLink: true })
            );

            const result = await recover(['linkId01']);

            expect(mockBatchHelper).not.toHaveBeenCalled();
            expect(result.successes).toEqual([]);
            expect(Object.keys(result.failures)).toEqual(['linkId01']);
        });

        it('still rejects when aborted', async () => {
            const abortError = new Error('Aborted');
            abortError.name = 'AbortError';
            mockGetLink.mockRejectedValue(abortError);

            await expect(recover(['linkId01'])).rejects.toBe(abortError);
            expect(mockBatchHelper).not.toHaveBeenCalled();
        });
    });
});
