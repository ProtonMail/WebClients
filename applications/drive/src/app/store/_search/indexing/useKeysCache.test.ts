import { CryptoApiInterface, CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { KeyCache, createKeysCache } from './useKeysCache';

const linkMock = {
    CreateTime: 123456,
    Hash: '',
    Index: 0,
    LinkID: 'link-mock-id',
    MIMEType: '',
    ModifyTime: 1234,
    Name: '',
    ParentLinkID: null,
    Size: 123,
    State: 0,
    Type: LinkType.FOLDER,
};

const DECRYPTED_NAME = 'a smell of petroleum prevails throughout';
const PRIVATE_KEY = 'private-key';

const mockedCryptoApi = {
    importPrivateKey: jest.fn().mockImplementation(() => PRIVATE_KEY),
} as any as CryptoApiInterface;

jest.mock('@proton/shared/lib/keys/driveKeys', () => ({
    decryptUnsigned: jest.fn().mockImplementation(() => DECRYPTED_NAME),
}));

jest.mock('@proton/shared/lib/keys/drivePassphrase', () => ({
    decryptPassphrase: jest.fn().mockImplementation(() => ({
        decryptedPassphrase: '',
    })),
}));

describe('useKeysCache', () => {
    let keyCache: KeyCache;

    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    beforeEach(() => {
        keyCache = createKeysCache('key' as unknown as PrivateKeyReference);
    });

    it('caches decrypted links', async () => {
        const { name } = await keyCache.decryptAndCacheLink(linkMock, {} as unknown as PrivateKeyReference);

        expect(name).toEqual(DECRYPTED_NAME);
        const key = keyCache.getCachedPrivateKey(linkMock.LinkID);
        expect(key).toEqual(PRIVATE_KEY);
    });

    it("returns undefined when unknown link's keys are requested", async () => {
        const result = keyCache.getCachedPrivateKey('new-link-id');
        expect(result).toBe(undefined);
    });
});
