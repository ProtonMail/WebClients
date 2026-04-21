import { pushForkSession } from '@proton/shared/lib/api/auth';
import type { Api } from '@proton/shared/lib/interfaces';

export async function forkSession({
    api,
    childClientId,
    code,
    payload,
}: {
    api: Api;
    childClientId: string;
    code: string;
    payload?: string;
}) {
    await api(
        pushForkSession({
            // Typically this Payload field is used for all clients to pass the key password around.
            // Since the VPN TV client doesn't need that, and because the TV client can't compute this information on its own,
            // we use this hack to pass extra information it.
            ...(payload ? { Payload: btoa(payload) } : {}),
            ChildClientID: childClientId,
            Independent: 1,
            UserCode: code,
        })
    );
}
