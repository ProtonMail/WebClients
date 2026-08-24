import { useEffect, useRef } from 'react';

import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import Challenge from '../challenge/Challenge';
import type { ChallengeRef } from '../challenge/interface';

interface Props {
    unauthenticatedApi: UnauthenticatedApi;
}

const UnauthenticatedApiChallenge = ({ unauthenticatedApi }: Props) => {
    const challengeRefLogin = useRef<ChallengeRef>();

    useEffect(() => {
        challengeRefLogin.current
            ?.getChallenge()
            .catch(noop)
            .then((data) => unauthenticatedApi.setChallenge(data))
            .catch(noop);
    }, []);

    return <Challenge empty tabIndex={-1} challengeRef={challengeRefLogin} name="unauth" type={0} />;
};

export default UnauthenticatedApiChallenge;
