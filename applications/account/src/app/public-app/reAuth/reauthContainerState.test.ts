import { USER_ROLES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';

import type { AuthSession } from '../authSession';
import { getReAuthState } from './reauthContainerState';

const getSession = (user: Partial<UserModel>) => ({ data: { User: buildUser(user) } }) as unknown as AuthSession;

const globalSSOUser: Partial<UserModel> = {
    Role: USER_ROLES.MEMBER_ROLE,
    Keys: [{ ID: 'key' } as UserModel['Keys'][number]],
    Flags: { ...buildUser().Flags, sso: true },
};

const getApi = (SSOBackupPasswordDisabled: boolean) =>
    jest.fn(async () => ({ SSOBackupPasswordDisabled })) as unknown as Api;

describe('getReAuthState', () => {
    it('signs a global SSO member in with the identity provider when the organization disabled the backup password', async () => {
        const state = await getReAuthState(
            { prompt: 'login', promptType: 'offline', promptBypass: 'none' },
            getSession(globalSSOUser),
            getApi(true)
        );
        expect(state.reAuthType).toBe('default');
    });

    it('asks a global SSO member for the backup password when the organization allows it', async () => {
        const state = await getReAuthState(
            { prompt: 'login', promptType: 'offline', promptBypass: 'none' },
            getSession(globalSSOUser),
            getApi(false)
        );
        expect(state.reAuthType).toBe('offline');
    });

    it('asks a global SSO admin for the backup password, which admins keep, without loading the organization', async () => {
        const api = getApi(true);
        const state = await getReAuthState(
            { prompt: 'login', promptType: 'offline', promptBypass: 'none' },
            getSession({ ...globalSSOUser, Role: USER_ROLES.ADMIN_ROLE }),
            api
        );
        expect(state.reAuthType).toBe('offline');
        expect(api).not.toHaveBeenCalled();
    });

    it('signs a global SSO member in with the identity provider on the sso bypass, without loading the organization', async () => {
        const api = getApi(false);
        const state = await getReAuthState(
            { prompt: 'login', promptType: 'offline', promptBypass: 'sso' },
            getSession(globalSSOUser),
            api
        );
        expect(state.reAuthType).toBe('default');
        expect(api).not.toHaveBeenCalled();
    });

    it('keeps the reauth type of other accounts, without loading the organization', async () => {
        const api = getApi(true);
        const state = await getReAuthState(
            { prompt: 'login', promptType: 'offline', promptBypass: 'none' },
            getSession({}),
            api
        );
        expect(state.reAuthType).toBe('offline');
        expect(api).not.toHaveBeenCalled();
    });
});
