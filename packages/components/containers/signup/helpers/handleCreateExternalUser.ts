import { Api } from 'proton-shared/lib/interfaces';
import { srpVerify } from 'proton-shared/lib/srp';
import { queryCreateUserExternal } from 'proton-shared/lib/api/user';

interface CreateUserArgs {
    api: Api;
    password: string;
    email: string;
    clientType: 1 | 2;
    payload?: { [key: string]: string };
}

export const handleCreateExternalUser = async ({ api, password, email, clientType, payload }: CreateUserArgs) => {
    if (!email) {
        throw new Error('Missing email');
    }
    return srpVerify({
        api,
        credentials: { password },
        config: queryCreateUserExternal({
            Type: clientType,
            Email: email,
            Payload: payload,
        }),
    });
};

export default handleCreateExternalUser;
