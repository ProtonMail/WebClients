import { useEffect, useRef } from 'react';

import Challenge from '@proton/components/containers/challenge/Challenge';
import type { ChallengeRef } from '@proton/components/containers/challenge/interface';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

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
