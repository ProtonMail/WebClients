// @vitest-environment happy-dom
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import createAuthenticationStore from '@proton/shared/lib/authentication/createAuthenticationStore';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';

import { InvalidSessionError, loadSession } from './index';
import { removeLastUsedLocalID, setLastUsedLocalID } from './lastUsedLocalID';

vi.mock('@proton/shared/lib/authentication/persistedSessionHelper', async () => ({
    ...(await vi.importActual('@proton/shared/lib/authentication/persistedSessionHelper')),
    resumeSession: vi.fn(),
}));

const mockedResumeSession = vi.mocked(resumeSession);

const setAccountLocalIDs = (localIDs: number[]) => {
    const value = utf8StringToUint8Array(JSON.stringify(localIDs)).toBase64({
        alphabet: 'base64url',
        omitPadding: true,
    });
    document.cookie = `iaas=${value}; path=/`;
};

const missingSessionError = new InvalidPersistentSessionError('Missing persisted session or UID');

const mockResumeSession = ({ resumable, error = missingSessionError }: { resumable: number[]; error?: unknown }) => {
    mockedResumeSession.mockImplementation(async ({ localID }) => {
        if (!resumable.includes(localID)) {
            throw error;
        }
        return {
            UID: `uid-${localID}`,
            localID,
            keyPassword: '',
            clientKey: '',
            offlineKey: undefined,
            User: undefined,
            persistedSession: { localID, persistent: true, trusted: false } as PersistedSession,
        };
    });
};

const getResumedLocalIDs = () => mockedResumeSession.mock.calls.map(([{ localID }]) => localID);

const setup = (url: string) => {
    window.history.replaceState(null, '', url);
    const values = new Map<string, any>();
    const authentication = createAuthenticationStore({
        mode: 'sso',
        store: {
            set: (key, value) => values.set(key, value),
            get: (key) => values.get(key),
            flush: () => {},
        },
    });
    const api = {} as ApiWithListener;
    const run = (localID?: number) =>
        loadSession({
            authentication,
            api,
            pathname: window.location.pathname,
            searchParams: new URLSearchParams(window.location.search),
            localID,
        });
    return { authentication, api, run };
};

beforeEach(() => {
    document.cookie = 'iaas=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    removeLastUsedLocalID();
    mockedResumeSession.mockReset();
});

describe('loadSession', () => {
    it.each([
        ['is missing', missingSessionError],
        ['is revoked', Object.assign(new Error('Unauthorized'), { status: 401 })],
    ])('resumes the last used session when the requested one %s and account does not list it', async (_, error) => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(0);
        mockResumeSession({ resumable: [0], error });
        const { authentication, api, run } = setup('/u/2/inbox?a=1#b');

        await expect(run()).resolves.toMatchObject({
            session: { localID: 0 },
            basename: '/u/0',
            url: '/inbox?a=1#b',
        });
        expect(getResumedLocalIDs()).toEqual([2, 0]);
        expect(authentication.localID).toBe(0);
        expect(api.UID).toBe('uid-0');
    });

    it('redirects to account to fork the requested session when account lists it', async () => {
        setAccountLocalIDs([0, 2]);
        setLastUsedLocalID(0);
        mockResumeSession({ resumable: [0] });

        const error = await setup('/u/2/inbox')
            .run()
            .catch((e) => e);

        expect(error).toBeInstanceOf(InvalidSessionError);
        expect(error.extra.localID).toBe(2);
        expect(getResumedLocalIDs()).toEqual([2]);
    });

    it('redirects to account with the requested local id when the last used session cannot be resumed either', async () => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(0);
        mockResumeSession({ resumable: [] });

        const error = await setup('/u/2/inbox')
            .run()
            .catch((e) => e);

        expect(error).toBeInstanceOf(InvalidSessionError);
        expect(error.extra.localID).toBe(2);
        expect(getResumedLocalIDs()).toEqual([2, 0]);
    });

    it('redirects to account when an email is specified, since the last used session may not have it', async () => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(0);
        mockResumeSession({ resumable: [0] });

        const error = await setup('/u/2/inbox?email=user@proton.me')
            .run()
            .catch((e) => e);

        expect(error).toBeInstanceOf(InvalidSessionError);
        expect(getResumedLocalIDs()).toEqual([2]);
    });

    it('redirects to account when the app passes the local id, even one from the URL, since it asks for that account', async () => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(0);
        mockResumeSession({ resumable: [0] });

        const error = await setup('/u/2/inbox')
            .run(2)
            .catch((e) => e);

        expect(error).toBeInstanceOf(InvalidSessionError);
        expect(error.extra.localID).toBe(2);
        expect(getResumedLocalIDs()).toEqual([2]);
    });

    it('does not fall back when the session fails to resume for any other reason', async () => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(0);
        const offlineError = Object.assign(new Error('Offline'), { name: 'OfflineError' });
        mockResumeSession({ resumable: [0], error: offlineError });

        await expect(setup('/u/2/inbox').run()).rejects.toBe(offlineError);
        expect(getResumedLocalIDs()).toEqual([2]);
    });
});
