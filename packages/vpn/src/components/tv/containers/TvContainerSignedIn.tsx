import { useEffect, useState } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Loader, useApi } from '@proton/components/index';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getItem, removeItem } from '@proton/shared/lib/helpers/storage';
import { telemetry } from '@proton/shared/lib/telemetry';

import { VPN_TV_USER_TIER } from '../../../../constants/tvUserTier';
import { isB2BAdmin } from '../../../functions/isB2BAdmin';
import { TvConfirmForkSession } from '../components/TvConfirmForkSession';
import { TvSignInCompleted } from '../components/TvSignInCompleted';
import { TvSignInFailed } from '../components/TvSignInFailed';
import type { FetchErrors } from '../types';
import { forkSession } from '../utils/forkSession';
import { getChildClientId } from '../utils/getChildClientId';
import { getUserTier } from '../utils/getUserTier';
import type { UserTier } from '../utils/getUserTier';

enum ForkSessionStep {
    CONFIRMATION,
    FETCHING_CODE,
    DEVICE_CONNECTED,
    DEVICE_CONNECTION_ERROR,
}

const childClientId = getChildClientId();

export const TvContainerSignedIn = ({ code }: { code: string }) => {
    const api = useApi();
    const [step, setStep] = useState<ForkSessionStep>(ForkSessionStep.CONFIRMATION);
    const [error, setError] = useState<FetchErrors | undefined>(undefined);
    const [user] = useUser();
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const [tier, setTier] = useState(getUserTier(user));

    const isBusiness = isB2BAdmin({ subscription, user, organization });

    useEffect(() => {
        // If the tier is in the localStorage means it was sent already, but it is also need to
        // be sent in the payload when forking the session.
        const localStorageTier: UserTier | undefined = getItem(VPN_TV_USER_TIER);
        if (localStorageTier) {
            setTier(localStorageTier);
            removeItem(VPN_TV_USER_TIER);
            return;
        }

        telemetry.sendCustomEvent('tv_auth_initiated', { userTierAtInitiation: tier, flowType: 'web' });
    }, []);

    const onConfirm = () => {
        setStep(ForkSessionStep.FETCHING_CODE);
        if (isBusiness) {
            setStep(ForkSessionStep.DEVICE_CONNECTION_ERROR);
            setError('business-user');
            return;
        }
        if (code) {
            forkSession({
                api,
                childClientId,
                code,
                payload: JSON.stringify({ InitialUserTier: tier, FlowType: 'web' }),
            })
                .then(() => setStep(ForkSessionStep.DEVICE_CONNECTED))
                .catch((error) => {
                    const { code } = getApiError(error);
                    setError(code === 2501 ? 'code-expired' : 'generic');
                    setStep(ForkSessionStep.DEVICE_CONNECTION_ERROR);
                });
        }
    };

    return (
        <>
            {step === ForkSessionStep.CONFIRMATION && <TvConfirmForkSession onConfirm={onConfirm} />}
            {step === ForkSessionStep.FETCHING_CODE && <Loader />}
            {step === ForkSessionStep.DEVICE_CONNECTED && <TvSignInCompleted />}
            {step === ForkSessionStep.DEVICE_CONNECTION_ERROR && error && <TvSignInFailed error={error} />}
        </>
    );
};
