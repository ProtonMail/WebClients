import type { ReactNode } from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

import Challenge from '@proton/components/containers/challenge/Challenge';
import type { ChallengeRef } from '@proton/components/containers/challenge/interface';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import StandardLoadErrorPage from '../app/StandardLoadErrorPage';
import ApiContext from './apiContext';
import { apiCallback, setApi, setChallenge, setup } from './unAuthenticatedApi';

interface Props {
    children: ReactNode;
}

const UnAuthenticatedApiProvider = ({ children }: Props) => {
    const api: Api = useContext(ApiContext);
    const [error, setError] = useState<Error | null>(null);
    const challengeRefLogin = useRef<ChallengeRef>();

    useEffect(() => {
        setApi(api);
    });

    useEffect(() => {
        setup().catch((e) => {
            setError(e);
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return (
        <ApiContext.Provider value={apiCallback}>
            <Challenge
                className="h-0 absolute"
                empty
                tabIndex={-1}
                challengeRef={challengeRefLogin}
                name="unauth"
                type={0}
                onSuccess={async () => {
                    const challenge = await challengeRefLogin.current?.getChallenge().catch(noop);
                    setChallenge(challenge);
                }}
                onError={() => {
                    setChallenge(undefined);
                }}
            />
            {children}
        </ApiContext.Provider>
    );
};

export default UnAuthenticatedApiProvider;
