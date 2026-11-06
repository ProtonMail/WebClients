import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';

interface SpacesInviteDetails {
    inviterEmail?: string;
    inviterDisplayName?: string;
    spaceName?: string;
    spaceDescription?: string;
}

export type InviteDetailsStatus =
    { type: 'loading' } | { type: 'none' } | { type: 'loaded'; details: SpacesInviteDetails };

interface InviteDetailsResponse {
    InviterEmail: string | null;
    InviterDisplayName: string | null;
    SpaceName: string | null;
    SpaceDescription: string | null;
}

const getInviteDetails = (preVerifiedAddressToken: string) => ({
    method: 'post',
    url: 'chat/v1/invitations/details',
    data: { PreVerifiedAddressToken: preVerifiedAddressToken },
});

export const useInviteDetails = (preVerifiedAddressToken: string | null | undefined): InviteDetailsStatus => {
    const api = useApi();
    const [status, setStatus] = useState<InviteDetailsStatus>({ type: preVerifiedAddressToken ? 'loading' : 'none' });

    useEffect(() => {
        if (!preVerifiedAddressToken) {
            setStatus({ type: 'none' });
            return;
        }

        const abortController = new AbortController();

        api<InviteDetailsResponse>({ ...getInviteDetails(preVerifiedAddressToken), signal: abortController.signal })
            .then((response) => ({
                type: 'loaded' as const,
                details: {
                    inviterEmail: response.InviterEmail ?? undefined,
                    inviterDisplayName: response.InviterDisplayName ?? undefined,
                    spaceName: response.SpaceName ?? undefined,
                    spaceDescription: response.SpaceDescription ?? undefined,
                },
            }))
            .catch((): InviteDetailsStatus => ({ type: 'none' }))
            .then((result) => {
                if (!abortController.signal.aborted) {
                    setStatus(result);
                }
            });

        return () => abortController.abort();
    }, [preVerifiedAddressToken]);

    return status;
};
