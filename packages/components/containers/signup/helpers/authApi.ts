import { srpAuth } from 'proton-shared/lib/srp';
import { AuthResponse } from 'proton-shared/lib/authentication/interface';
import { auth, setCookies } from 'proton-shared/lib/api/auth';
import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { Api } from 'proton-shared/lib/interfaces';
import { getRandomString } from 'proton-shared/lib/helpers/string';

interface Args {
    api: Api;
    username: string;
    password: string;
}
const createAuthApi = async ({ api, username, password }: Args) => {
    const authResponse = await srpAuth<AuthResponse>({
        api,
        credentials: {
            username,
            password
        },
        config: auth({ Username: username })
    });

    const { UID, AccessToken, RefreshToken } = authResponse;

    const authApiCaller = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

    return {
        api: authApiCaller,
        getAuthResponse: () => authResponse,
        setCookies: () => {
            return api(setCookies({ UID, AccessToken, RefreshToken, State: getRandomString(24) }));
        }
    };
};

export default createAuthApi;
