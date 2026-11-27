import type { PersistedSession, PersistedSessionLite } from '@proton/shared/lib/authentication/SessionInterface';

import { rewriteSessionlessJoinUrlToGuest } from './rewriteSessionlessJoinUrlToGuest';

const mocks = vi.hoisted(() => ({
    readAccountSessions: vi.fn<() => PersistedSessionLite[] | undefined>(),
    getPersistedSessions: vi.fn<() => PersistedSession[]>(),
}));

vi.mock('@proton/account/accountSessions/storage', () => ({
    readAccountSessions: mocks.readAccountSessions,
}));

vi.mock('@proton/shared/lib/authentication/persistedSessionStorage', () => ({
    getPersistedSessions: mocks.getPersistedSessions,
}));

const JOIN_URL = '/join/id-meetingabc?source=link#pwd-passwordabcd';

const getCurrentUrl = () => window.location.pathname + window.location.search + window.location.hash;

describe('rewriteSessionlessJoinUrlToGuest', () => {
    beforeEach(() => {
        mocks.readAccountSessions.mockReturnValue(undefined);
        mocks.getPersistedSessions.mockReturnValue([]);
    });

    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it('moves a session-less join link to the guest route, keeping search and hash', () => {
        window.history.replaceState(null, '', JOIN_URL);

        rewriteSessionlessJoinUrlToGuest();

        expect(getCurrentUrl()).toBe(`/guest${JOIN_URL}`);
    });

    it('keeps the join link when the account cookie lists sessions', () => {
        mocks.readAccountSessions.mockReturnValue([{ localID: 0 }]);
        window.history.replaceState(null, '', JOIN_URL);

        rewriteSessionlessJoinUrlToGuest();

        expect(getCurrentUrl()).toBe(JOIN_URL);
    });

    it('keeps the join link when a session is persisted locally', () => {
        mocks.getPersistedSessions.mockReturnValue([{ localID: 0 } as PersistedSession]);
        window.history.replaceState(null, '', JOIN_URL);

        rewriteSessionlessJoinUrlToGuest();

        expect(getCurrentUrl()).toBe(JOIN_URL);
    });

    it.each(['/u/0/join/id-meetingabc#pwd-passwordabcd', '/guest/join/id-meetingabc#pwd-passwordabcd', '/dashboard'])(
        'keeps %s unchanged',
        (url) => {
            window.history.replaceState(null, '', url);

            rewriteSessionlessJoinUrlToGuest();

            expect(getCurrentUrl()).toBe(url);
        }
    );
});
