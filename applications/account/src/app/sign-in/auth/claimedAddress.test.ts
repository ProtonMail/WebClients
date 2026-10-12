import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Address, Api, User } from '@proton/shared/lib/interfaces';
import { handleCreateAddressAndKey } from '@proton/shared/lib/keys/setupAddress';

import { UnavailableUsernameError, createClaimedAddressAndFinalize } from './claimedAddress';
import type { LoginFlowContext } from './loginFlowContext';

jest.mock('@proton/shared/lib/api/addresses', () => ({ getAllAddresses: jest.fn() }));
jest.mock('@proton/shared/lib/keys/setupAddress', () => ({
    ...jest.requireActual('@proton/shared/lib/keys/setupAddress'),
    handleCreateAddressAndKey: jest.fn(),
}));
jest.mock('./accountKeys', () => ({ upgradeKeysAndFinalize: jest.fn() }));
jest.mock('./finalizeSignIn', () => ({ finalizeSignIn: jest.fn() }));

const apiError = (code: number) => ({ status: 422, data: { Code: code, Error: `error ${code}` } });

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
