import { AUTH_FALLBACK_VERSION, getFallbackAuthVersion, getSrp } from 'pmcrypto';

import { auth, info, PASSWORD_WRONG_ERROR } from '../../api/auth';

export default async (api, srp, credentials, initialAuthInfo) => {
    const { username } = credentials;

    const state = {
        authInfo: initialAuthInfo || (await api(info(username))),
        fallbackAuthVersion: AUTH_FALLBACK_VERSION
    };

    const authHttpConfiguration = auth(username);
    const infoHttpConfiguration = info(username);

    do {
        const { authInfo, fallbackAuthVersion } = state;

        const { Version } = authInfo;
        const shouldFallback = Version === 0;
        const authVersion = shouldFallback ? fallbackAuthVersion : Version;
        const nextFallbackAuthVersion = getFallbackAuthVersion(credentials, fallbackAuthVersion);

        // This will be the last attempt
        if (shouldFallback && nextFallbackAuthVersion !== -1) {
            // Can add suppress notification here
        }

        try {
            const { parameters, expectation } = await getSrp({ ...authInfo, Version: authVersion }, credentials);
            const result = await srp.callAndValidate(authHttpConfiguration, parameters, expectation);
            return {
                authVersion,
                result
            };
        } catch (e) {
            if (e && e.data && e.data.Code === PASSWORD_WRONG_ERROR && shouldFallback && nextFallbackAuthVersion !== -1) {
                state.fallbackAuthVersion = nextFallbackAuthVersion;
                state.authInfo = await api(infoHttpConfiguration);
                continue; // eslint-disable-line
            }
            throw e;
        }

    } while (true); // eslint-disable-line
};

