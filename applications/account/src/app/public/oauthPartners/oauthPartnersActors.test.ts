import { createActor, toPromise } from 'xstate';

import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import type { OAuthPartnersCallbackState } from './oauthPartners';
import { createOAuthPartnersActors } from './oauthPartnersActors';

const mockHandleOAuthPartners = jest.fn();
jest.mock('./oauthPartners', () => ({
    handleOAuthPartners: (...args: unknown[]) => mockHandleOAuthPartners(...args),
}));

const state: OAuthPartnersCallbackState = { type: 'callback', payload: { token: 'token', uid: 'uid' } };

const signIn = () => {
    const login = jest.fn(async () => {});
    const actors = createOAuthPartnersActors({ unauthenticatedApi: {} as UnauthenticatedApi, login });
    return { output: toPromise(createActor(actors.signIn, { input: state }).start()), login };
};

describe('signIn', () => {
    it('signs in with the session the partner hands back', async () => {
        const session = { UID: 'uid' };
        mockHandleOAuthPartners.mockResolvedValue({ type: 'done', payload: session });
        const { output, login } = signIn();
        await expect(output).resolves.toBeUndefined();
        expect(login).toHaveBeenCalledWith({ data: session, flow: 'login' });
    });

    it('returns the Proton account the partner account already is, without signing in', async () => {
        const account = { email: 'user@proton.me', sessions: { sessions: [] } };
        mockHandleOAuthPartners.mockResolvedValue({ type: 'existing-account', payload: account });
        const { output, login } = signIn();
        await expect(output).resolves.toEqual(account);
        expect(login).not.toHaveBeenCalled();
    });
});
