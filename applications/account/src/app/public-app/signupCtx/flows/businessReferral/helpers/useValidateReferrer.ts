import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useSilentApi } from '@proton/app-context/useSilentApi';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { InvalidReferrerError, useReferralData } from '../../../context/accountData/useReferralData';
import { getReferralID, getReferralIdentifier } from '../../../helpers/signupSearchParams';

/**
 * Display/gating validation only. The actual `/referrals/register` call is driven by
 * `unverifiedReferralData` on SignupContextProvider (see BusinessReferralSignup.tsx); this hook's
 * `useReferralData` state is separate from the provider's.
 *
 * `optional` skips validation when no referrer is in the URL, instead of treating it as invalid.
 */
export const useValidateReferrer = ({ optional = false }: { optional?: boolean } = {}) => {
    const silentApi = useSilentApi();
    const notifyError = useNotifyErrorHandler();
    const history = useHistory();
    const location = useLocation();
    const { initReferralData } = useReferralData();

    const searchParams = new URLSearchParams(location.search);
    const referralIdentifier = getReferralIdentifier(searchParams);
    const referralID = getReferralID(searchParams);

    useEffect(() => {
        if (optional && !referralIdentifier) {
            return;
        }
        initReferralData({
            unverifiedReferralData: { referralIdentifier: referralIdentifier || '', referralID },
            api: silentApi,
        }).catch((error) => {
            if (error instanceof InvalidReferrerError) {
                history.replace(SSO_PATHS.BUSINESS_SIGNUP_GENERIC);
                return;
            }
            notifyError(error);
        });
    }, [referralIdentifier]);
};
