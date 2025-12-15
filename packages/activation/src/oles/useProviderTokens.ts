import { useMemo } from 'react';

import type { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import type { OAuthToken } from '@proton/activation/src/logic/oauthToken';
import { useOAuthToken } from '@proton/activation/src/logic/oauthToken/hooks';

const useProviderTokens = (provider: OAUTH_PROVIDER): [OAuthToken[], boolean] => {
    const [oauthTokens, oauthTokensLoading] = useOAuthToken();
    const tokens = useMemo(() => {
        return oauthTokens?.filter((t) => t.Provider === provider) || [];
    }, [oauthTokens]);
    return [tokens, oauthTokensLoading];
};

export default useProviderTokens;
