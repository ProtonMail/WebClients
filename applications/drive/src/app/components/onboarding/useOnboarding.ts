import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { queryListPendingExternalInvitations } from '@proton/shared/lib/api/drive/invitation';
import type { ListDrivePendingExternalInvitationsPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { useDebouncedRequest } from '../../store/_api';
import useChecklist from './useChecklist';

export const useOnboarding = () => {
    const checklist = useChecklist();
    const debouncedRequest = useDebouncedRequest();
    const [isLoading, withIsLoading] = useLoading(false);
    const [hasPendingExternalInvitations, setHasPendingExternalInvitations] = useState(false);

    const getHasPendingExternalInvitations = () =>
        withIsLoading(async () => {
            const { ExternalInvitations } = await debouncedRequest<ListDrivePendingExternalInvitationsPayload>(
                queryListPendingExternalInvitations()
            );
            setHasPendingExternalInvitations(!!ExternalInvitations.length);
        });

    useEffect(() => {
        void getHasPendingExternalInvitations();
    }, []);

    return { isLoading: checklist.isLoading || isLoading, checklist, hasPendingExternalInvitations };
};
