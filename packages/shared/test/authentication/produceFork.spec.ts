import { SessionSource } from '../../lib/authentication/SessionInterface';
import { getProduceForkParameters, produceFork } from '../../lib/authentication/fork/produce';
import type { ResumedSessionResult } from '../../lib/authentication/persistedSessionHelper';

const session = {
    keyPassword: 'key-password',
    offlineKey: undefined,
    persistedSession: {
        persistent: true,
        trusted: false,
        source: SessionSource.Proton,
    },
} as ResumedSessionResult;

/**
 * Produces a fork for the given `/authorize` search parameters and returns the body of the
 * `auth/v4/sessions/forks` request it made.
 */
const getPushForkRequestData = async (search: string) => {
    const forkParameters = getProduceForkParameters(new URLSearchParams(search));
    const api = vi.fn().mockResolvedValue({ Selector: 'selector' });

    await produceFork({ api, session, forkParameters: { ...forkParameters, app: forkParameters.app! } });

    expect(api).toHaveBeenCalledTimes(1);
    const { url, method, data } = api.mock.calls[0][0];
    expect({ url, method }).toEqual({ url: 'auth/v4/sessions/forks', method: 'post' });
    return data;
};

describe('produceFork', () => {
    it('should push the fork to the client id of the app', async () => {
        const data = await getPushForkRequestData('?app=proton-mail');
        expect(data.ChildClientID).toBe('web-mail');
    });

    it('should push the fork to the client id given in the clientId param', async () => {
        const data = await getPushForkRequestData('?app=proton-mail&clientId=ios-mail');
        expect(data.ChildClientID).toBe('ios-mail');
    });

    it('should push the fork to the client id of another app given in the clientId param', async () => {
        const data = await getPushForkRequestData('?app=proton-mail&clientId=web-calendar');
        expect(data.ChildClientID).toBe('web-calendar');
    });

    it('should push the fork to the client id of the app when the clientId param has no known platform', async () => {
        const data = await getPushForkRequestData('?app=proton-mail&clientId=not-a-client-id');
        expect(data.ChildClientID).toBe('web-mail');
    });

    it('should not affect the rest of the request', async () => {
        const data = await getPushForkRequestData('?app=proton-mail&clientId=ios-mail&independent=1&forkChallenge=abc');
        expect(data).toEqual({
            ChildClientID: 'ios-mail',
            Independent: 1,
            ForkChallenge: 'abc',
            Payload: expect.any(String),
        });
    });
});
