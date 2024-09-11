import { act, renderHook } from '@testing-library/react-hooks';

import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { decryptSigned } from '@proton/shared/lib/keys/driveKeys';
import { decryptPassphrase } from '@proton/shared/lib/keys/drivePassphrase';

import type { IntegrityMetrics } from '../_crypto';
import { ShareType } from '../_shares';
import { useLinkInner } from './useLink';

jest.mock('@proton/shared/lib/keys/driveKeys');

jest.mock('@proton/shared/lib/keys/drivePassphrase');

const mockRequest = jest.fn();
jest.mock('../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return useDebouncedRequest;
});

jest.mock('../_utils/useDebouncedFunction', () => {
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
    const mockGetShare = jest.fn();
    const mockGetDefaultShareAddressEmail = jest.fn();
    const mockDecryptPrivateKey = jest.fn();
    const mockIntegrityMetricsDecryptionError = jest.fn();
    const mockIntegrityMetricsSignatureVerificationError = jest.fn();

    const isPaid = false;
    const abortSignal = new AbortController().signal;

    let hook: {
        current: ReturnType<typeof useLinkInner>;
    };

    beforeAll(() => {
        // Time relative function can have issue with test environments
        // To prevent hanging async function we use Timer Mocks from jest
        // https://jestjs.io/docs/timer-mocks
        jest.useFakeTimers();
    });

    beforeEach(() => {
        jest.resetAllMocks();

        global.URL.createObjectURL = jest.fn(() => 'blob:objecturl');

        // @ts-ignore
        decryptSigned.mockImplementation(({ armoredMessage }) =>
            Promise.resolve({ data: `dec:${armoredMessage}`, verified: 1 })
        );
        // @ts-ignore
        decryptPassphrase.mockImplementation(({ armoredPassphrase }) =>
            Promise.resolve({
                decryptedPassphrase: `decPass:${armoredPassphrase}`,
                sessionKey: `sessionKey:${armoredPassphrase}`,
                verified: 1,
            })
        );
        mockGetSharePrivateKey.mockImplementation((_, shareId) => `privateKey:${shareId}`);
        mockDecryptPrivateKey.mockImplementation(({ armoredKey: nodeKey }) => `privateKey:${nodeKey}`);

        const { result } = renderHook(() =>
            useLinkInner(
                mockFetchLink,
                mockLinksKeys,
                mockLinksState,
                mockGetVerificationKey,
                mockGetSharePrivateKey,
                mockGetShare,
                mockGetDefaultShareAddressEmail,
                isPaid,
                {
                    nodeDecryptionError: mockIntegrityMetricsDecryptionError,
                    signatureVerificationError: mockIntegrityMetricsSignatureVerificationError,
                } as unknown as IntegrityMetrics,
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
                name: 'dec:name',
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
        const links: Record<string, ReturnType<typeof generateLink>> = {
            root: generateLink('root'),
            parent: generateLink('parent', 'root'),
            link: generateLink('link', 'parent'),
        };
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
            'link', // Called by getEncryptedLink.
            'parent', // Called by getLinkPrivateKey.
            'root', // Called by getLinkPrivateKey.
        ]);
        // Decrypt passphrases so we can decrypt private keys for the root and the parent.
        // @ts-ignore
        expect(decryptPassphrase.mock.calls.map(([{ armoredPassphrase }]) => armoredPassphrase)).toMatchObject([
            'nodePassphrase root',
            'nodePassphrase parent',
        ]);
        expect(mockDecryptPrivateKey.mock.calls.map(([{ armoredKey: nodeKey }]) => nodeKey)).toMatchObject([
            'nodeKey root',
            'nodeKey parent',
        ]);
        // With the parent key is decrypted the name of the requested link.
        expect(
            // @ts-ignore
            decryptSigned.mock.calls.map(([{ privateKey, armoredMessage }]) => [privateKey, armoredMessage])
        ).toMatchObject([['privateKey:nodeKey parent', 'name link']]);
    });

    describe('root name', () => {
        const LINK_NAME = 'LINK_NAME';

        const tests = [
            { type: ShareType.standard, name: `dec:${LINK_NAME}` },

            { type: ShareType.default, name: 'My files' },
            { type: ShareType.photos, name: 'Photos' },
        ];

        tests.forEach(({ type, name }) => {
            it(`detects type ${type} as "${name}"`, async () => {
                const link = {
                    linkId: `root`,
                    name: LINK_NAME,
                    nodeKey: `nodeKey root`,
                    nodePassphrase: `nodePassphrase root`,
                };
                mockLinksState.getLink.mockImplementation(() => ({ encrypted: link }));
                mockGetShare.mockImplementation((_, shareId) => ({
                    shareId,
                    rootLinkId: link.linkId,
                    type,
                }));

                await act(async () => {
                    const link = hook.current.getLink(abortSignal, 'shareId', 'root');
                    await expect(link).resolves.toMatchObject({
                        linkId: 'root',
                        name,
                    });
                });
            });
        });
    });

    it('fetches link from API and decrypts when missing in the cache', async () => {
        mockFetchLink.mockReturnValue(Promise.resolve({ linkId: 'linkId', parentLinkId: undefined, name: 'name' }));
        await act(async () => {
            const link = hook.current.getLink(abortSignal, 'shareId', 'linkId');
            await expect(link).resolves.toMatchObject({
                linkId: 'linkId',
                name: 'dec:name',
            });
        });
        expect(mockLinksState.getLink).toBeCalledWith('shareId', 'linkId');
        expect(mockFetchLink).toBeCalledTimes(1);
    });

    it('skips failing fetch if already attempted before', async () => {
        const err = { data: { Code: RESPONSE_CODE.NOT_FOUND } };
        mockFetchLink.mockRejectedValue(err);
        const link = hook.current.getLink(abortSignal, 'shareId', 'linkId');
        await expect(link).rejects.toMatchObject(err);
        const link2 = hook.current.getLink(abortSignal, 'shareId', 'linkId');
        await expect(link2).rejects.toMatchObject(err);
        const link3 = hook.current.getLink(abortSignal, 'shareId', 'linkId2');
        await expect(link3).rejects.toMatchObject(err);

        expect(mockLinksState.getLink).toBeCalledWith('shareId', 'linkId');
        expect(mockFetchLink).toBeCalledTimes(2); // linkId once and linkId2
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
        expect(mockRequest).not.toBeCalled();
        expect(downloadCallbackMock).not.toBeCalled();
        expect(mockLinksState.setCachedThumbnail).not.toBeCalled();
    });

    it('loads link thumbnail using cached link thumbnail info', async () => {
        const downloadCallbackMock = jest.fn().mockReturnValue(
            Promise.resolve({
                contents: Promise.resolve(undefined),
                verifiedPromise: Promise.resolve(1),
            })
        );
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
        expect(mockRequest).not.toBeCalled();
    });

    it('loads link thumbnail with expired cached link thumbnail info', async () => {
        mockRequest.mockReturnValue({
            ThumbnailBareURL: 'bareUrl',
            ThumbnailToken: 'token2', // Requested new non-expired token.
        });
        const downloadCallbackMock = jest.fn().mockImplementation((url: string, token: string) =>
            token === 'token'
                ? Promise.reject('token expired')
                : Promise.resolve({
                      contents: Promise.resolve(undefined),
                      verifiedPromise: Promise.resolve(1),
                  })
        );
        mockLinksState.getLink.mockReturnValue({
            decrypted: {
                name: 'name',
                hasThumbnail: true,
                activeRevision: {
                    thumbnail: {
                        bareUrl: 'bareUrl',
                        token: 'token', // Expired token.
                    },
                },
            },
        });
        await act(async () => {
            await hook.current.loadLinkThumbnail(abortSignal, 'shareId', 'linkId', downloadCallbackMock);
        });
        expect(downloadCallbackMock).toBeCalledWith('bareUrl', 'token'); // First attempted with expired token.
        expect(mockRequest).toBeCalledTimes(1); // Then requested the new token.
        expect(downloadCallbackMock).toBeCalledWith('bareUrl', 'token2'); // And the new one used for final download.
        expect(mockLinksState.setCachedThumbnail).toBeCalledWith('shareId', 'linkId', expect.any(String));
    });

    it('loads link thumbnail with its url on API', async () => {
        mockRequest.mockReturnValue({
            ThumbnailBareURL: 'bareUrl',
            ThumbnailToken: 'token',
        });
        const downloadCallbackMock = jest.fn().mockReturnValue(
            Promise.resolve({
                contents: Promise.resolve(undefined),
                verifiedPromise: Promise.resolve(1),
            })
        );
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
        expect(mockRequest).toBeCalledTimes(1);
        expect(downloadCallbackMock).toBeCalledWith('bareUrl', 'token');
        expect(mockLinksState.setCachedThumbnail).toBeCalledWith('shareId', 'linkId', expect.any(String));
    });

    it('decrypts badly signed thumbnail block', async () => {
        mockLinksState.getLink.mockReturnValue({
            encrypted: {
                linkId: 'link',
            },
            decrypted: {
                linkId: 'link',
                name: 'name',
                hasThumbnail: true,
                activeRevision: {
                    id: 'revisionId',
                },
            },
        });
        mockGetShare.mockImplementation((_, shareId) =>
            Promise.resolve({
                shareId,
                type: ShareType.default,
            })
        );
        mockRequest.mockReturnValue({
            ThumbnailBareURL: 'bareUrl',
            ThumbnailToken: 'token',
        });
        const downloadCallbackMock = jest.fn().mockReturnValue(
            Promise.resolve({
                contents: Promise.resolve(undefined),
                verifiedPromise: Promise.resolve(2),
            })
        );

        await act(async () => {
            await hook.current.loadLinkThumbnail(abortSignal, 'shareId', 'link', downloadCallbackMock);
        });
        expect(mockLinksState.setLinks).toBeCalledWith('shareId', [
            expect.objectContaining({
                encrypted: expect.objectContaining({
                    linkId: 'link',
                    signatureIssues: { thumbnail: 2 },
                }),
            }),
        ]);
        expect(mockIntegrityMetricsSignatureVerificationError).toHaveBeenCalled();
    });

    describe('decrypts link meta data with signature issues', () => {
        beforeEach(() => {
            const generateLink = (id: string, parentId?: string) => {
                return {
                    linkId: `${id}`,
                    parentLinkId: parentId,
                    name: `name ${id}`,
                    nodeKey: `nodeKey ${id}`,
                    nodeHashKey: `nodeHashKey ${id}`,
                    nodePassphrase: `nodePassphrase ${id}`,
                };
            };
            const links: Record<string, ReturnType<typeof generateLink>> = {
                root: generateLink('root'),
                parent: generateLink('parent', 'root'),
                link: generateLink('link', 'parent'),
            };
            mockLinksState.getLink.mockImplementation((_, linkId) => ({ encrypted: links[linkId] }));
        });

        it('decrypts badly signed passphrase', async () => {
            // @ts-ignore
            decryptPassphrase.mockReset();
            // @ts-ignore
            decryptPassphrase.mockImplementation(({ armoredPassphrase }) =>
                Promise.resolve({
                    decryptedPassphrase: `decPass:${armoredPassphrase}`,
                    sessionKey: `sessionKey:${armoredPassphrase}`,
                    verified: 2,
                })
            );
            mockGetShare.mockImplementation((_, shareId) =>
                Promise.resolve({
                    shareId,
                    type: ShareType.default,
                })
            );

            await act(async () => {
                await hook.current.getLink(abortSignal, 'shareId', 'link');
            });
            ['root', 'parent'].forEach((linkId) => {
                expect(mockLinksState.setLinks).toBeCalledWith('shareId', [
                    expect.objectContaining({
                        encrypted: expect.objectContaining({
                            linkId,
                            signatureIssues: { passphrase: 2 },
                        }),
                    }),
                ]);
            });
            expect(mockIntegrityMetricsSignatureVerificationError).toHaveBeenCalled();
        });

        it('decrypts badly signed hash', async () => {
            // @ts-ignore
            decryptSigned.mockReset();
            // @ts-ignore
            decryptSigned.mockImplementation(({ armoredMessage }) =>
                Promise.resolve({ data: `dec:${armoredMessage}`, verified: 2 })
            );
            mockGetVerificationKey.mockReturnValue([]);
            mockGetShare.mockImplementation((_, shareId) =>
                Promise.resolve({
                    shareId,
                    type: ShareType.default,
                })
            );

            await act(async () => {
                await hook.current.getLinkHashKey(abortSignal, 'shareId', 'parent');
            });
            expect(mockLinksState.setLinks).toBeCalledWith('shareId', [
                expect.objectContaining({
                    encrypted: expect.objectContaining({
                        linkId: 'parent',
                        signatureIssues: { hash: 2 },
                    }),
                }),
            ]);
            expect(mockIntegrityMetricsSignatureVerificationError).toHaveBeenCalled();
        });

        it('decrypts badly signed name', async () => {
            // @ts-ignore
            decryptSigned.mockReset();
            // @ts-ignore
            decryptSigned.mockImplementation(({ armoredMessage }) =>
                Promise.resolve({ data: `dec:${armoredMessage}`, verified: 2 })
            );
            mockGetShare.mockImplementation((_, shareId) =>
                Promise.resolve({
                    shareId,
                    type: ShareType.default,
                })
            );

            await act(async () => {
                await hook.current.getLink(abortSignal, 'shareId', 'link');
            });
            expect(mockLinksState.setLinks).toBeCalledWith('shareId', [
                expect.objectContaining({
                    decrypted: expect.objectContaining({
                        linkId: 'link',
                        signatureIssues: { name: 2 },
                    }),
                }),
            ]);
            expect(mockIntegrityMetricsSignatureVerificationError).toHaveBeenCalled();
        });
    });
});
