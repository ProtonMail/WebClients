import { pullForkSession, pushForkSession } from '@proton/shared/lib/api/auth';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { PullForkResponse, PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { getNativeAppInfo } from '../util/userAgent';
import type { ExternalSessionPayload } from './nativeAuthBridge';

export type { ExternalSessionPayload };

const buildExternalSessionPayloadForLocalID = async ({
    api,
    localID,
    pathname,
    appVersion,
    childClientId,
}: {
    api: Api;
    localID: number;
    pathname: string;
    appVersion: string;
    childClientId: string;
}): Promise<ExternalSessionPayload> => {
    const session = await resumeSession({ api, localID, options: { clearInvalidSession: false } });
    const uidApi = getUIDApi(session.UID, api);

    const { Selector: selector } = await uidApi<PushForkResponse>(
        pushForkSession({
            ChildClientID: childClientId,
            Independent: 0,
        })
    );

    const pullForkResponse = await uidApi<PullForkResponse>({
        ...pullForkSession(selector),
        headers: {
            'x-pm-appversion': appVersion,
        },
    });

    const { EventID } = await uidApi<{ EventID: string }>(getLatestID());

    return {
        userId: pullForkResponse.UserID,
        username: session.User.Name ?? null,
        sessionId: pullForkResponse.UID,
        refreshToken: pullForkResponse.RefreshToken,
        keySecret: session.keyPassword || null,
        eventId: EventID ?? null,
        localId: localID,
        canMigrate: !pathname.startsWith(SSO_PATHS.FORK),
    };
};

/**
 * Build an {@link ExternalSessionPayload} for every logged-in (persisted)
 * session so native can adopt all of them in a single migration call.
 *
 * Each session is forked independently and in parallel; a session that fails to
 * resume or fork (e.g. invalid/expired blob) is logged and skipped rather than
 * failing the whole batch. The returned array is what gets pushed to native.
 */
export const buildExternalSessionsViaFork = async ({
    api,
    pathname,
}: {
    api: Api;
    pathname: string;
}): Promise<ExternalSessionPayload[]> => {
    const appInfo = getNativeAppInfo();
    if (!appInfo || appInfo.platform === 'unknown') {
        return [];
    }

    const { version, platform } = appInfo;

    const semverVersion = version.match(/^\d+\.\d+\.\d+/)?.[0] ?? version;

    const appVersion = `${platform}-lumo@${semverVersion}`;
    const childClientId = `${platform}-lumo`;

    const persistedSessions = getPersistedSessions();

    const results = await Promise.all(
        persistedSessions.map((persistedSession) =>
            buildExternalSessionPayloadForLocalID({
                api,
                localID: persistedSession.localID,
                pathname,
                appVersion,
                childClientId,
            }).catch((e) => {
                console.error(`External session: failed to build payload for localID ${persistedSession.localID}:`, e);
                return null;
            })
        )
    );

    return results.filter((payload): payload is ExternalSessionPayload => payload !== null);
};
