import { CLIENT_TYPES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { type AccountData, type SignupInviteParameters, SignupType } from '../../../signup/interfaces';
import { handleCreateUser } from './handleCreateUser';

const mockSrpVerify = vi.fn();
vi.mock('@proton/shared/lib/srp', () => ({
    srpVerify: (...args: unknown[]) => mockSrpVerify(...args),
}));

const accountData: AccountData = {
    signupType: SignupType.External,
    username: '',
    domain: '',
    email: 'invitee@example.com',
    password: 'password',
    payload: undefined,
};
const api: Api = vi.fn();

const createExternalUser = async (invite: SignupInviteParameters) => {
    await handleCreateUser({
        accountData,
        clientType: CLIENT_TYPES.MAIL,
        paymentToken: undefined,
        productParam: 'generic',
        api,
        invite,
        visitorId: undefined,
        hvMode: undefined,
    });
    return mockSrpVerify.mock.lastCall?.[0].config.data;
};

describe('handleCreateUser', () => {
    beforeEach(() => mockSrpVerify.mockReset().mockResolvedValue({}));

    it('sends the pre-verified address token of an invite that has one', async () => {
        const data = await createExternalUser({
            type: 'spaces',
            data: { invitee: 'invitee@example.com', orgJoinLink: 'link', preVerifiedAddressToken: 'token' },
        });
        expect(data.TokenPreVerifiedAddress).toBe('token');
    });

    it('sends no pre-verified address token for an invite without one', async () => {
        const data = await createExternalUser({ type: 'generic', data: { selector: 'selector', token: 'token' } });
        expect(data).not.toHaveProperty('TokenPreVerifiedAddress');
    });
});
