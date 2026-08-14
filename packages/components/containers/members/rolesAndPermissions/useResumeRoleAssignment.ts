import { useRef, useState } from 'react';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';

/** Currently supported RoleAssignmentSources: EnhancedMember | EnhancedGroup */
type Resume = (sourceId: string, isCancelRequested: () => boolean) => Promise<void>;

/**
 * Resume assigning one or many OrganizationRoles that were interrupted before access to org key was
 * granted. Currently supported RoleAssignmentSources: EnhancedMember | EnhancedGroup.
 */
export const useResumeRoleAssignment = ({
    successText,
    getErrorText,
}: {
    successText: string;
    getErrorText: (failedCount: number) => string;
}) => {
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const [resumingSourceId, setResumingSourceId] = useState<string | undefined>(undefined);
    const cancelRequestedRef = useRef(false);

    const resumeOne = async ({ sourceId, resume }: { sourceId: string; resume: Resume }) => {
        setResumingSourceId(sourceId);
        try {
            await resume(sourceId, () => cancelRequestedRef.current);
            createNotification({ type: 'success', text: successText });
        } catch (error) {
            handleError(error);
        } finally {
            setResumingSourceId(undefined);
        }
    };

    const toggleResumeAll = async ({ sourceIds, resume }: { sourceIds: string[]; resume: Resume }) => {
        if (resumingSourceId !== undefined) {
            cancelRequestedRef.current = true;
            return;
        }

        if (sourceIds.length === 0) {
            return;
        }

        cancelRequestedRef.current = false;
        let failedCount = 0;
        for (const sourceId of sourceIds) {
            if (cancelRequestedRef.current) {
                break;
            }
            setResumingSourceId(sourceId);
            try {
                await resume(sourceId, () => cancelRequestedRef.current);
            } catch (error) {
                // Individual failures are only traced. The user gets one summary notification below.
                handleError(error, { notify: false });
                failedCount += 1;
            }
        }
        setResumingSourceId(undefined);

        if (cancelRequestedRef.current) {
            cancelRequestedRef.current = false;
            return;
        }

        if (failedCount === 0) {
            createNotification({ type: 'success', text: successText });
            return;
        }

        createNotification({ type: 'error', text: getErrorText(failedCount) });
    };

    return {
        resumingSourceId,
        resumeOne,
        toggleResumeAll,
    };
};
