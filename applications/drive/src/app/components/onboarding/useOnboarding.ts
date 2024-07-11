import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { queryOnboarding } from '@proton/shared/lib/api/drive/onboarding';

import { useDebouncedRequest } from '../../store/_api';
import useChecklist from './useChecklist';

export const useOnboarding = () => {
    const checklist = useChecklist();
    const debouncedRequest = useDebouncedRequest();
    const [isLoading, withIsLoading] = useLoading(false);
    const [hasPendingInvitations, setHasPendingInvitations] = useState(false);

    const getHasPendingInvitations = () =>
        withIsLoading(async () => {
            const { HasPendingInvitations: hasPendingInvitations } = await debouncedRequest<{
                HasPendingInvitations: boolean;
            }>(queryOnboarding());
            setHasPendingInvitations(hasPendingInvitations);
        });

    useEffect(() => {
        void getHasPendingInvitations();
    }, []);

    return { isLoading: checklist.isLoading || isLoading, checklist, hasPendingInvitations };
};
