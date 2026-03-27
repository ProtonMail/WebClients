import { pushForkSession } from '@proton/shared/lib/api/auth';
import type { Api } from '@proton/shared/lib/interfaces';

export async function forkSession(api: Api, childClientId: string, code: string) {
    await api(
        pushForkSession({
            ChildClientID: childClientId,
            Independent: 1,
            UserCode: code,
        })
    );
}
