import type { ChallengeResult } from '@proton/challenge/interface';
import { getInfo } from '@proton/shared/lib/api/auth';
import type { InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import type { Api } from '@proton/shared/lib/interfaces';

/** SRP sign-in with username and password; falls back to older auth versions when needed. */
export const loginWithPassword = async ({
    username,
    password,
    payload,
    persistent,
    api,
}: {
    username: string;
    password: string;
    payload: ChallengeResult;
    persistent: boolean;
    api: Api;
}) => {
    const infoResult = await api<InfoResponse>(getInfo({ username }));
    return loginWithFallback({
        api,
        credentials: { username, password },
        initialAuthInfo: infoResult,
        payload,
        persistent,
    });
};
