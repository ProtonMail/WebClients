import { useCallback } from 'react';

import { useApi } from '@proton/components';
import {
    queryFreshAccountStatus,
    queryOnboardingStatus,
    queryUpdateFreshAccount,
} from '@proton/shared/lib/api/drive/onboarding';

export function useFreeUploadApi() {
    const api = useApi();

    // Memoized to be used in useEffect hook
    const checkOnboardingStatus = useCallback(() => api<{ IsFreshAccount: boolean }>(queryOnboardingStatus()), [api]);
    const checkFreeUploadTimer = useCallback(() => api<{ EndTime: null | number }>(queryFreshAccountStatus()), [api]);
    const startFreeUploadTimer = () => api<{ EndTime: null | number }>(queryUpdateFreshAccount());

    return { checkOnboardingStatus, checkFreeUploadTimer, startFreeUploadTimer };
}
