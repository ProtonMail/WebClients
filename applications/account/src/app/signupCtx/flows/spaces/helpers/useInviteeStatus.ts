import { useEffect, useState } from 'react';

import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import noop from '@proton/utils/noop';

export type InviteeStatus = { type: 'loading' } | { type: 'new' } | { type: 'signed-in'; localID: number };

interface Props {
    email: string | undefined;
    onGetActiveSessions?: () => Promise<GetActiveSessionsResult>;
}

export const useInviteeStatus = ({ email, onGetActiveSessions }: Props): InviteeStatus => {
    const [status, setStatus] = useState<InviteeStatus>({ type: email ? 'loading' : 'new' });

    useEffect(() => {
        if (!email) {
            setStatus({ type: 'new' });
            return;
        }

        const abortController = new AbortController();

        const run = async (): Promise<InviteeStatus> => {
            const lowerCaseEmail = email.toLowerCase();
            const sessionsResult = await onGetActiveSessions?.().catch(noop);
            const signedInSession = sessionsResult?.sessions.find(
                ({ remote }) => remote.PrimaryEmail?.toLowerCase() === lowerCaseEmail
            );

            if (signedInSession) {
                return { type: 'signed-in', localID: signedInSession.persisted.localID };
            }

            return { type: 'new' };
        };

        run()
            .catch((): InviteeStatus => ({ type: 'new' }))
            .then((result) => {
                if (!abortController.signal.aborted) {
                    setStatus(result);
                }
            });

        return () => abortController.abort();
    }, [email]);

    return status;
};
