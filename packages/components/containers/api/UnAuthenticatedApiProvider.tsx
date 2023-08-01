import { ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { Challenge, ChallengeRef } from '@proton/components/containers';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import StandardLoadErrorPage from '../app/StandardLoadErrorPage';
import ApiContext from './apiContext';
import { apiCallback, setApi, setChallenge, setup } from './unAuthenticatedApi';

interface Props {
    children: ReactNode;
    onLoaded: () => void;
}

const UnAuthenticatedApiProvider = ({ children, onLoaded }: Props) => {
    const api: Api = useContext(ApiContext);
    const [error, setError] = useState<Error | null>(null);
    const challengeRefLogin = useRef<ChallengeRef>();

    useEffect(() => {
        setApi(getSilentApi(api));
    });

    useEffect(() => {
        setup()
            .then(() => {
                onLoaded();
            })
            .catch((e) => {
                setError(e);
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return (
        <ApiContext.Provider value={apiCallback}>
            <Challenge
                className="h0 absolute"
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
