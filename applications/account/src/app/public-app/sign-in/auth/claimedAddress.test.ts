import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { type User, UserType } from '@proton/shared/lib/interfaces/User';
import { handleCreateAddressAndKey } from '@proton/shared/lib/keys/setupAddress';

import { UnavailableUsernameError, createClaimedAddressAndFinalize, loadClaimedAddressSetup } from './claimedAddress';
import type { LoginFlowContext } from './loginFlowContext';

jest.mock('@proton/shared/lib/api/addresses', () => ({ getAllAddresses: jest.fn() }));
jest.mock('@proton/shared/lib/keys/setupAddress', () => ({
    ...jest.requireActual('@proton/shared/lib/keys/setupAddress'),
    handleCreateAddressAndKey: jest.fn(),
}));
jest.mock('./accountKeys', () => ({ upgradeKeysAndFinalize: jest.fn() }));
jest.mock('./finalizeSignIn', () => ({ finalizeSignIn: jest.fn() }));

const apiError = (code: number) => ({ status: 422, data: { Code: code, Error: `error ${code}` } });

describe('loadClaimedAddressSetup', () => {
    const load = (user: Partial<User>) => {
        const api = jest.fn(() => Promise.resolve({ Domains: ['proton.me'] })) as unknown as Api;
        return { api, setup: loadClaimedAddressSetup({ api, user: user as User, claimedEmail: 'me@example.com' }) };
    };

    beforeEach(() => jest.clearAllMocks());

    it('tells where the data lives when the account still has an enabled address', async () => {
        jest.mocked(getAllAddresses).mockResolvedValue([
            { Email: 'me@example.com', Status: ADDRESS_STATUS.STATUS_DISABLED },
            { Email: 'me@proton.me', Status: ADDRESS_STATUS.STATUS_ENABLED },
        ] as Address[]);

        await expect(load({ Type: UserType.MANAGED }).setup).resolves.toEqual({
            type: 'migrated',
            address: 'me@proton.me',
        });
    });

    it("doesn't offer an organization member to create an address, which its organization manages", async () => {
        jest.mocked(getAllAddresses).mockResolvedValue([
            { Email: 'me@example.com', Status: ADDRESS_STATUS.STATUS_DISABLED },
        ] as Address[]);

        const { api, setup } = load({ Type: UserType.MANAGED, Name: 'me' });

        await expect(setup).resolves.toEqual({ type: 'managed' });
        // Nor looks for where one could be created
        expect(api).not.toHaveBeenCalled();
    });

    it('offers an account of its own to create an address', async () => {
        jest.mocked(getAllAddresses).mockResolvedValue([
            { Email: 'me@example.com', Status: ADDRESS_STATUS.STATUS_DISABLED },
        ] as Address[]);

        await expect(load({ Type: UserType.EXTERNAL, Name: '' }).setup).resolves.toMatchObject({ type: 'create' });
    });
});

describe('createClaimedAddressAndFinalize', () => {
    const create = (api: Api) =>
        createClaimedAddressAndFinalize(
            { api, preAuthKTVerifier: { preAuthKTVerify: jest.fn() } } as unknown as LoginFlowContext,
            {
                user: { Name: '' } as User,
                loginPassword: 'secret',
                unlocked: { keyPassword: 'key-password', clearKeyPassword: 'secret', isOnePasswordMode: true },
                username: 'new',
                domain: 'proton.me',
                checkAvailability: true,
            }
        );

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(getAllAddresses).mockResolvedValue([] as Address[]);
    });

    it.each([
        API_CUSTOM_ERROR_CODES.USERNAME_ALREADY_USED,
        API_CUSTOM_ERROR_CODES.ALREADY_USED,
        API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
    ])(
        'fails with an UnavailableUsernameError, before creating anything, when the check rejects it (%s)',
        async (code) => {
            const error = apiError(code);
            const api = jest.fn(() => Promise.reject(error)) as unknown as Api;

            const failure = await create(api).catch((e: unknown) => e);

            expect(failure).toBeInstanceOf(UnavailableUsernameError);
            expect(failure).toMatchObject({ message: `error ${code}`, cause: error });
            expect(handleCreateAddressAndKey).not.toHaveBeenCalled();
        }
    );

    it('fails with a later error as it is, whatever its code: something may have been created by then', async () => {
        const error = apiError(API_CUSTOM_ERROR_CODES.ALREADY_USED);
        const api = jest.fn(() => Promise.resolve({})) as unknown as Api;
        jest.mocked(handleCreateAddressAndKey).mockRejectedValue(error);

        await expect(create(api)).rejects.toBe(error);
    });
});
