import { Api } from 'proton-shared/lib/interfaces';
import { HumanVerificationError } from '../interfaces';
import { srpVerify } from 'proton-shared/lib/srp';
import { queryCreateUser, queryCreateUserExternal } from 'proton-shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';

interface CreateUserArgs {
    api: Api;
    clientType: 1 | 2;
    payload?: { [key: string]: string };
    username?: string;
    email?: string;
    password: string;
    recoveryEmail: string;
}

export const handleCreateUser = async ({
    api,
    username,
    password,
    email,
    recoveryEmail,
    clientType,
    payload,
}: CreateUserArgs) => {
    if (username) {
        try {
            return await srpVerify({
                api,
                credentials: { password },
                config: {
                    ...queryCreateUser({
                        Type: clientType,
                        Email: recoveryEmail,
                        Username: username,
                        Payload: payload,
                    }),
                    silence: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
                    ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
                },
            });
        } catch (error) {
            const { data: { Code, Details } = { Code: 0, Details: {} } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
                const { HumanVerificationMethods = [], HumanVerificationToken = '' } = Details;
                throw new HumanVerificationError(HumanVerificationMethods, HumanVerificationToken);
            }

            throw error;
        }
    }

    if (email) {
        return srpVerify({
            api,
            credentials: { password },
            config: queryCreateUserExternal({
                Type: clientType,
                Email: email,
                Payload: payload,
            }),
        });
    }

    throw new Error('Bad state create user');
};

export default handleCreateUser;
