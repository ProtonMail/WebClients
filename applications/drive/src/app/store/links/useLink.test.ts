import { renderHook, act } from '@testing-library/react-hooks';

import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { decryptPassphrase } from '@proton/shared/lib/keys/drivePassphrase';
import { useLinkInner } from './useLink';

jest.mock('@proton/shared/lib/keys/driveKeys');

jest.mock('@proton/shared/lib/keys/drivePassphrase');

const mockRequst = jest.fn();
jest.mock('../api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequst;
    };
    return useDebouncedRequest;
});

jest.mock('../utils/useDebouncedFunction', () => {
    const useDebouncedFunction = () => {
        return (wrapper: any) => wrapper();
    };
    return useDebouncedFunction;
});

describe('useLink', () => {
    const mockFetchLink = jest.fn();
    const mockLinksKeys = {
        getPassphrase: jest.fn(),
        setPassphrase: jest.fn(),
        getPassphraseSessionKey: jest.fn(),
        setPassphraseSessionKey: jest.fn(),
        getPrivateKey: jest.fn(),
        setPrivateKey: jest.fn(),
        getSessionKey: jest.fn(),
        setSessionKey: jest.fn(),
        getHashKey: jest.fn(),
        setHashKey: jest.fn(),
    };
    const mockLinksState = {
        getLink: jest.fn(),
        setLinks: jest.fn(),
        setCachedThumbnail: jest.fn(),
    };
    const mockGetVerificationKey = jest.fn();
    const mockGetSharePrivateKey = jest.fn();
    const mockDecryptPrivateKey = jest.fn();

    const abortSignal = new AbortController().signal;

    let hook: {
        current: ReturnType<typeof useLinkInner>;
    };

    beforeEach(() => {
        jest.resetAllMocks();

        global.URL.createObjectURL = jest.fn(() => 'blob:objecturl');

        // @ts-ignore
        decryptUnsigned.mockImplementation(({ armoredMessage }) => Promise.resolve(`dec:${armoredMessage}`));
        // @ts-ignore
        decryptPassphrase.mockImplementation(({ armoredPassphrase }) =>
            Promise.resolve({
                decryptedPassphrase: `decPass:${armoredPassphrase}`,
                sessionKey: `sessionKey:${armoredPassphrase}`,
            })
        );
        mockGetSharePrivateKey.mockImplementation((_, shareId) => `privateKey:${shareId}`);
        mockDecryptPrivateKey.mockImplementation((nodeKey) => `privateKey:${nodeKey}`);

        const { result } = renderHook(() =>
            useLinkInner(
                mockFetchLink,
                mockLinksKeys,
                mockLinksState,
                mockGetVerificationKey,
                mockGetSharePrivateKey,
                mockDecryptPrivateKey
            )
        );
        hook = result;
    });

    it('returns decrypted version from the cache', async () => {
        const item = { name: 'name' };
        mockLinksState.getLink.mockReturnValue({ decrypted: item });
        await act(async () => {
            const link = hook.current.getLink(abortSignal, 'shareId', 'linkId');
            await expect(link).resolves.toMatchObject(item);
        });
        expect(mockLinksState.getLink).toBeCalledWith('shareId', 'linkId');
        expect(mockFetchLink).not.toBeCalled();
    });

    it('decrypts when missing decrypted version in the cache', async () => {
        mockLinksState.getLink.mockReturnValue({
            encrypted: { linkId: 'linkId', parentLinkId: undefined, name: 'name' },
        });
        await act(async () => {
            const link = hook.current.getLink(abortSignal, 'shareId', 'linkId');
            await expect(link).resolves.toMatchObject({
                linkId: 'linkId',
                name: 'My files', // We automatically set this to the root link.
            });
        });
        expect(mockLinksState.getLink).toBeCalledWith('shareId', 'linkId');
        expect(mockFetchLink).not.toBeCalled();
    });

    it('decrypts link with parent link', async () => {
        const generateLink = (id: string, parentId?: string) => {
            return {
                linkId: `${id}`,
                parentLinkId: parentId,
                name: `name ${id}`,
                nodeKey: `nodeKey ${id}`,
                nodePassphrase: `nodePassphrase ${id}`,
            };
        };
        const links = {
            root: generateLink('root'),
            parent: generateLink('parent', 'root'),
            link: generateLink('link', 'parent'),
        };
        // @ts-ignore
        mockLinksState.getLink.mockImplementation((_, linkId) => ({ encrypted: links[linkId] }));

        await act(async () => {
            const link = hook.current.getLink(abortSignal, 'shareId', 'link');
            await expect(link).resolves.toMatchObject({
                linkId: 'link',
                name: 'dec:name link',
            });
        });

        expect(mockFetchLink).not.toBeCalled();
        expect(mockLinksState.getLink.mock.calls.map(([, linkId]) => linkId)).toMatchObject([
            'link', // Called by getLink.
            'parent', // Called by getLinkPrivateKey.
            'parent', // Called by getLinkPassphraseAndSessionKey.
            'root', // Called by getLinkPrivateKey.
            'root', // Called by getLinkPassphraseAndSessionKey.
        ]);
        // Decrypt passphrases so we can decrypt private keys for the root and the parent.
        // @ts-ignore
        expect(decryptPassphrase.mock.calls.map(([{ armoredPassphrase }]) => armoredPassphrase)).toMatchObject([
            'nodePassphrase root',
            'nodePassphrase parent',
        ]);
        expect(mockDecryptPrivateKey.mock.calls.map(([nodeKey]) => nodeKey)).toMatchObject([
            'nodeKey root',
            'nodeKey parent',
        ]);
        // With the parent key is decrypted the name of the requested link.
        expect(
            // @ts-ignore
            decryptUnsigned.mock.calls.map(([{ privateKey, armoredMessage }]) => [privateKey, armoredMessage])
        ).toMatchObject([['privateKey:nodeKey parent', 'name link']]);
    });

    it('fetches link from API and decrypts when missing in the cache', async () => {
        mockFetchLink.mockReturnValue({ linkId: 'linkId', parentLinkId: undefined, name: 'name' });
        await act(async () => {
            const link = hook.current.getLink(abortSignal, 'shareId', 'linkId');
            await expect(link).resolves.toMatchObject({
                linkId: 'linkId',
                name: 'My files', // We automatically set this to the root link.
            });
        });
        expect(mockLinksState.getLink).toBeCalledWith('shareId', 'linkId');
        expect(mockFetchLink).toBeCalledTimes(1);
    });

    it('skips load of already cached thumbnail', async () => {
        const downloadCallbackMock = jest.fn();
        mockLinksState.getLink.mockReturnValue({
            decrypted: {
                name: 'name',
                cachedThumbnailUrl: 'url',
            },
        });
        await act(async () => {
            await hook.current.loadLinkThumbnail(abortSignal, 'shareId', 'linkId', downloadCallbackMock);
        });
        expect(mockRequst).not.toBeCalled();
        expect(downloadCallbackMock).not.toBeCalled();
        expect(mockLinksState.setCachedThumbnail).not.toBeCalled();
    });

    it('loads link thumbnail using cached link thumbnail info', async () => {
        const downloadCallbackMock = jest.fn();
        mockLinksState.getLink.mockReturnValue({
            decrypted: {
                name: 'name',
                hasThumbnail: true,
                activeRevision: {
                    thumbnail: {
                        bareUrl: 'bareUrl',
                        token: 'token',
                    },
                },
            },
        });
        await act(async () => {
            await hook.current.loadLinkThumbnail(abortSignal, 'shareId', 'linkId', downloadCallbackMock);
        });
        expect(downloadCallbackMock).toBeCalledWith('bareUrl', 'token');
        expect(mockLinksState.setCachedThumbnail).toBeCalledWith('shareId', 'linkId', expect.any(String));
        expect(mockRequst).not.toBeCalled();
    });

    it('loads link thumbnail with its url on API', async () => {
        mockRequst.mockReturnValue({
            ThumbnailBareURL: 'bareUrl',
            ThumbnailToken: 'token',
        });
        const downloadCallbackMock = jest.fn();
        mockLinksState.getLink.mockReturnValue({
            decrypted: {
                name: 'name',
                hasThumbnail: true,
                activeRevision: {
                    id: 'revisionId',
                },
            },
        });
        await act(async () => {
            await hook.current.loadLinkThumbnail(abortSignal, 'shareId', 'linkId', downloadCallbackMock);
        });
        expect(mockRequst).toBeCalledTimes(1);
        expect(downloadCallbackMock).toBeCalledWith('bareUrl', 'token');
        expect(mockLinksState.setCachedThumbnail).toBeCalledWith('shareId', 'linkId', expect.any(String));
    });
});
