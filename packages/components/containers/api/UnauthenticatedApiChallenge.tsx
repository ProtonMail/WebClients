import { useEffect, useRef } from 'react';

import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import ChallengeV4 from '../challenge/ChallengeV4';
import type { ChallengeV4Ref } from '../challenge/interface';

interface Props {
    unauthenticatedApi: UnauthenticatedApi;
}

const UnauthenticatedApiChallenge = ({ unauthenticatedApi }: Props) => {
    const challengeRefLogin = useRef<ChallengeV4Ref>();

    useEffect(() => {
        challengeRefLogin.current
            ?.getChallenge()
            .catch(noop)
            .then((data) => unauthenticatedApi.setChallenge(data))
            .catch(noop);
    }, []);

    return <ChallengeV4 empty tabIndex={-1} challengeRef={challengeRefLogin} name="unauth" type={0} />;
};

export default UnauthenticatedApiChallenge;
