import { pullForkSession, revoke } from '../../lib/api/auth';
import { getUser } from '../../lib/api/user';
import { SessionSource } from '../../lib/authentication/SessionInterface';
import { consumeFork } from '../../lib/authentication/fork/consume';
import type { ConsumeForkParameters } from '../../lib/authentication/fork/getConsumeForkParameters';
import type { PullForkResponse } from '../../lib/authentication/interface';
import type { ResumedSessionResult } from '../../lib/authentication/persistedSessionHelper';
import { persistSession, resumeSession } from '../../lib/authentication/persistedSessionHelper';
import { removePersistedSessionByLocalIDAndUID } from '../../lib/authentication/persistedSessionStorage';
import { withAuthHeaders, withUIDHeaders } from '../../lib/fetch/headers';
import type { Api } from '../../lib/interfaces/Api';

vi.mock('../../lib/authentication/persistedSessionHelper', async (importOriginal) => {
    return {
        ...(await importOriginal<object>()),
        resumeSession: vi.fn(),
        persistSession: vi.fn(),
    };
});

vi.mock('../../lib/authentication/persistedSessionStorage', async (importOriginal) => {
    return {
        ...(await importOriginal<object>()),
        removePersistedSessionByLocalIDAndUID: vi.fn(),
    };
});

const pullForkResponse = {
    Payload: '',
    LocalID: 0,
    UID: 'fork-uid',
    AccessToken: 'fork-access-token',
    RefreshToken: 'fork-refresh-token',
    UserID: 'user-b',
} as PullForkResponse;

const parameters = {
    selector: 'selector',
    state: 'state',
    key: new Uint8Array(32),
    persistent: false,
    trusted: false,
    source: SessionSource.Proton,
    payloadVersion: 2,
    payloadType: 'default',
    forkType: undefined,
} as ConsumeForkParameters;

const getApi = () => {
    const api = vi.fn(async (config: { url: string }): Promise<any> => {
        if (config.url === pullForkSession(parameters.selector).url) {
            return pullForkResponse;
        }
        if (config.url === getUser().url) {
            return { User: { ID: pullForkResponse.UserID } };
        }
        return {};
    });
    return api as Api & typeof api;
};

const getExistingSession = (UserID: string) => {
    return { UID: 'existing-uid', localID: 0, User: { ID: UserID } } as ResumedSessionResult;
};

describe('consumeFork', () => {
    beforeEach(() => {
        vi.mocked(removePersistedSessionByLocalIDAndUID).mockResolvedValue();
        vi.mocked(persistSession).mockImplementation(async ({ UID }) => {
            return { UID } as ResumedSessionResult;
        });
    });

    it('resumes the existing session and revokes the fork when both belong to the same user', async () => {
        const existingSession = getExistingSession(pullForkResponse.UserID);
        vi.mocked(resumeSession).mockResolvedValue(existingSession);
        const api = getApi();

        const { session } = await consumeFork({ api, mode: 'sso', parameters });

        expect(session).toBe(existingSession);
        expect(api).toHaveBeenCalledWith(
            withAuthHeaders(pullForkResponse.UID, pullForkResponse.AccessToken, revoke({ Child: 1 }))
        );
        expect(persistSession).not.toHaveBeenCalled();
    });

    it('uses the fork and drops the existing session when it belongs to another user', async () => {
        vi.mocked(resumeSession).mockResolvedValue(getExistingSession('user-a'));
        const api = getApi();

        const { session } = await consumeFork({ api, mode: 'sso', parameters });

        expect(session.UID).toBe(pullForkResponse.UID);
        expect(api).toHaveBeenCalledWith(withUIDHeaders('existing-uid', revoke()));
        expect(removePersistedSessionByLocalIDAndUID).toHaveBeenCalledWith(0, 'existing-uid');
        expect(persistSession).toHaveBeenCalledWith(
            expect.objectContaining({ UID: pullForkResponse.UID, User: { ID: pullForkResponse.UserID } })
        );
    });
});
