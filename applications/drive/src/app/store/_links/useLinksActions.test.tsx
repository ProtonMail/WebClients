import { renderHook } from '@testing-library/react-hooks';

import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
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

const mockQueryTrashLinks = jest.fn();
const mockQueryRestoreLinks = jest.fn();
const mockQueryDeleteTrashedLinks = jest.fn();
const mockGetShare = jest.fn();
const mockGetDefaultShare = jest.fn();

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
        };
    };
    return useShare;
});

jest.mock('../_shares/useDefaultShare', () => {
    const useDefaultShare = () => {
        return {
            getDefaultShare: mockGetDefaultShare,
        };
    };
    return useDefaultShare;
});

const SHARE_ID_0 = 'shareId00';
const SHARE_ID_1 = 'shareId01';
const VOLUME_ID = 'volumeId00';

// TODO: Test suite incomplete
// covers operations allowing using links from multiple shares
describe('useLinksActions', () => {
    let hook: {
        current: ReturnType<typeof useLinksActions>;
    };

    beforeEach(() => {
        jest.resetAllMocks();
        mockRequest.mockImplementation((linkIds: string[]) => {
            return Promise.resolve({
                Responses: linkIds.map(() => ({
                    Response: {
                        Code: RESPONSE_CODE.SUCCESS,
                    },
                })),
            });
        });
        mockQueryTrashLinks.mockImplementation((shareId, parentLinkId, linkIds) => linkIds);
        mockQueryRestoreLinks.mockImplementation((shareId, linkIds) => linkIds);
        mockQueryDeleteTrashedLinks.mockImplementation((shareId, linkIds) => linkIds);
        mockGetShare.mockImplementation((ac, shareId) => ({ shareId }));
        mockGetDefaultShare.mockImplementation(() => ({ volumeId: VOLUME_ID }));

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
                        queryEmptyTrashOfShare: jest.fn(),
                        queryDeleteChildrenLinks: jest.fn(),
                    },
                }),
            { wrapper }
        );
        hook = result;
    });

    it('trashes links from different shares', async () => {
        /*
            shareId00
            └── link00
                ├── link01
                │   ├── link03 x
                │   └── link04 x
                └── link02
                    └── link05 x
            shareId01
            └── link10
                ├── link01
                |   └── link12 x <-- non-unique parent link id
                └── link11
                    ├── link13
                    └── link14 x
        */

        const ac = new AbortController();
        const result = await hook.current.trashLinks(ac.signal, [
            { shareId: SHARE_ID_0, linkId: 'linkId03', parentLinkId: 'linkId01' },
            { shareId: SHARE_ID_0, linkId: 'linkId04', parentLinkId: 'linkId01' },
            { shareId: SHARE_ID_0, linkId: 'linkId05', parentLinkId: 'linkId02' },
            { shareId: SHARE_ID_1, linkId: 'linkId14', parentLinkId: 'linkId11' },
            { shareId: SHARE_ID_1, linkId: 'linkId12', parentLinkId: 'linkId01' },
        ]);

        // ensure api requests are invoked by correct groups
        expect(mockQueryTrashLinks).toBeCalledWith(SHARE_ID_0, 'linkId01', ['linkId03', 'linkId04']);
        expect(mockQueryTrashLinks).toBeCalledWith(SHARE_ID_0, 'linkId02', ['linkId05']);
        expect(mockQueryTrashLinks).toBeCalledWith(SHARE_ID_1, 'linkId01', ['linkId12']);
        expect(mockQueryTrashLinks).toBeCalledWith(SHARE_ID_1, 'linkId11', ['linkId14']);

        // verify all requested links were processed
        expect(result.successes.sort()).toEqual(['linkId03', 'linkId04', 'linkId05', 'linkId12', 'linkId14'].sort());
    });

    it('restores links from different shares', async () => {
        /*
            shareId00
            └── link00
                ├── linkId01 <
                │   ├── linkId03
                │   └── linkId04 <
            shareId01
            └── linkId10
                └── linkId11 <
        */

        // emulate partial state
        const state: Record<string, any> = {
            linkId01: {
                rootShareId: SHARE_ID_0,
                linkId: 'linkId01',
                trashed: 3,
            },
            linkId04: {
                rootShareId: SHARE_ID_0,
                linkId: 'linkId04',
                trashed: 1,
            },
            linkId11: {
                rootShareId: SHARE_ID_1,
                linkId: 'linkId11',
                trashed: 3,
            },
        };

        mockGetLinks.mockImplementation(async (signal, ids: { linkId: string }[]) => {
            return ids.map((idGroup) => state[idGroup.linkId]).filter(isTruthy);
        });

        const ac = new AbortController();
        const result = await hook.current.restoreLinks(ac.signal, [
            { shareId: SHARE_ID_0, linkId: 'linkId01' },
            { shareId: SHARE_ID_0, linkId: 'linkId04' },
            { shareId: SHARE_ID_1, linkId: 'linkId11' },
        ]);

        expect(mockQueryRestoreLinks).toBeCalledWith(SHARE_ID_0, [
            'linkId01',
            'linkId04', // this link has been deleted before link linkId, thus restored last
        ]);
        expect(mockQueryRestoreLinks).toBeCalledWith(SHARE_ID_1, ['linkId11']);

        expect(result.successes.sort()).toEqual(['linkId01', 'linkId04', 'linkId11'].sort());
    });

    it('deletes trashed links from different shares', async () => {
        /*
            shareId00
            └── link00
                ├── linkId01 x
                │   ├── linkId03
                │   └── linkId04 x
            shareId01
            └── linkId10
                └── linkId11 x
        */

        const ac = new AbortController();
        const result = await hook.current.deleteTrashedLinks(ac.signal, [
            { shareId: SHARE_ID_0, linkId: 'linkId01' },
            { shareId: SHARE_ID_0, linkId: 'linkId04' },
            { shareId: SHARE_ID_1, linkId: 'linkId11' },
        ]);

        expect(mockQueryDeleteTrashedLinks).toBeCalledWith(SHARE_ID_0, ['linkId01', 'linkId04']);
        expect(mockQueryDeleteTrashedLinks).toBeCalledWith(SHARE_ID_1, ['linkId11']);

        expect(result.successes.sort()).toEqual(['linkId01', 'linkId04', 'linkId11'].sort());
    });
});
