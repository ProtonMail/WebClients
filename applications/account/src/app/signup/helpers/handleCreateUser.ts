import { Api, User } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';
import { queryCreateUser } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

interface CreateUserArgs {
    api: Api;
    clientType: 1 | 2;
    payload?: { [key: string]: string };
    username: string;
    password: string;
    recoveryEmail: string;
    recoveryPhone: string;
}

const handleCreateUser = async ({
    api,
    username,
    password,
    recoveryEmail,
    recoveryPhone,
    clientType,
    payload,
}: CreateUserArgs) => {
    if (!username) {
        throw new Error('Missing username');
    }
    return srpVerify<{ User: User }>({
        api,
        credentials: { password },
        config: {
            ...queryCreateUser({
                Type: clientType,
                ...(recoveryEmail ? { Email: recoveryEmail } : undefined),
                ...(recoveryPhone ? { Phone: recoveryPhone } : undefined),
                Username: username,
                Payload: payload,
            }),
            silence: [
                API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED,
                API_CUSTOM_ERROR_CODES.USER_CREATE_TOKEN_INVALID,
            ],
            ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        },
    });
};

export default handleCreateUser;
