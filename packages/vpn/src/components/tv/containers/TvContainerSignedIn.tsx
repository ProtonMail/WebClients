import { useEffect, useState } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Loader, useApi } from '@proton/components/index';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { telemetry } from '@proton/shared/lib/telemetry';

import { isB2BAdmin } from '../../../functions/isB2BAdmin';
import { TvSignInCompleted } from '../components/TvSignInCompleted';
import { TvSignInFailed } from '../components/TvSignInFailed';
import type { FetchErrors } from '../types';
import { forkSession } from '../utils/forkSession';
import { getChildClientId } from '../utils/getChildClientId';
import { getUserTier } from '../utils/getUserTier';

enum ForkSessionStep {
    FETCHING_CODE,
    DEVICE_CONNECTED,
    DEVICE_CONNECTION_ERROR,
}

const childClientId = getChildClientId();

export const TvContainerSignedIn = ({ code }: { code: string }) => {
    const api = useApi();
    const [step, setStep] = useState<ForkSessionStep>(ForkSessionStep.FETCHING_CODE);
    const [error, setError] = useState<FetchErrors | undefined>(undefined);
    const [user] = useUser();
    const [organization] = useOrganization();
    const [subscription] = useSubscription();

    const isBusiness = isB2BAdmin({ subscription, user, organization });

    useEffect(() => {
        if (isBusiness) {
            setStep(ForkSessionStep.DEVICE_CONNECTION_ERROR);
            setError('business-user');
            return;
        }
        if (code) {
            const tier = getUserTier(user);
            telemetry.sendCustomEvent('tv_auth_initiated', { userTierAtInitiation: tier });
            forkSession({ api, childClientId, code, payload: JSON.stringify({ InitialUserTier: tier }) })
                .then(() => setStep(ForkSessionStep.DEVICE_CONNECTED))
                .catch((error) => {
                    const { code } = getApiError(error);
                    setError(code === 2501 ? 'code-expired' : 'generic');
                    setStep(ForkSessionStep.DEVICE_CONNECTION_ERROR);
                });
        }
    }, []);

    return (
        <>
            {step === ForkSessionStep.FETCHING_CODE && <Loader />}
            {step === ForkSessionStep.DEVICE_CONNECTED && <TvSignInCompleted />}
            {step === ForkSessionStep.DEVICE_CONNECTION_ERROR && error && <TvSignInFailed error={error} />}
        </>
    );
};
