import { ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { Challenge, ChallengeRef, LoaderPage } from '@proton/components/containers';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import StandardLoadErrorPage from '../app/StandardLoadErrorPage';
import ApiContext from './apiContext';
import { apiCallback, context, setChallenge, setup } from './unAuthenticatedApi';

interface Props {
    children: ReactNode;
}

const UnAuthenticatedApiProvider = ({ children }: Props) => {
    const api: Api = useContext(ApiContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const challengeRefLogin = useRef<ChallengeRef>();

    useEffect(() => {
        context.api = api;
    });

    useEffect(() => {
        setup()
            .then(() => {
                setLoading(false);
            })
            .catch((e) => {
                setError(e);
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading) {
        return <LoaderPage />;
    }

    return (
        <ApiContext.Provider value={apiCallback}>
            <Challenge
                className="h0 absolute"
                noLoader
                empty
                tabIndex={-1}
                challengeRef={challengeRefLogin}
                name="unauth"
                type={0}
                onSuccess={async () => {
                    const challenge = await challengeRefLogin.current?.getChallenge();
                    if (!challenge) {
                        return;
                    }
                    // Challenge is set dynamically for a faster loading experience
                    await setChallenge(challenge);
                }}
                onError={noop}
            />
            {children}
        </ApiContext.Provider>
    );
};

export default UnAuthenticatedApiProvider;
