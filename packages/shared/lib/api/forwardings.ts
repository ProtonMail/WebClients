import type { SIEVE_VERSION, SieveBranch } from '@proton/sieve/src/interface';

import type {
    Api,
    ForwardingState,
    ForwardingType,
    IncomingAddressForwarding,
    OutgoingAddressForwarding,
} from '../interfaces';
import queryPages from './helpers/queryPages';

interface ProxyInstance {
    PgpVersion: number;
    ForwarderKeyFingerprint: string;
    ForwardeeKeyFingerprint: string;
    ProxyParam: string;
}

interface QueryProps {
    AddressID?: string;
    Page?: number;
    PageSize?: number;
}

export const queryOutgoingForwardings = ({ AddressID, Page, PageSize }: QueryProps) => ({
    method: 'get',
    url: 'mail/v4/forwardings/outgoing',
    params: { Page, PageSize, AddressID },
});

export const queryOutgoingForwarding = (id: string) => ({
    method: 'get',
    url: `mail/v4/forwardings/outgoing/${id}`,
});

export const queryAllOutgoingForwardings = (api: Api) => {
    return queryPages((Page, PageSize) => {
        return api<{ OutgoingAddressForwardings: OutgoingAddressForwarding[]; Total: number }>(
            queryOutgoingForwardings({
                Page,
                PageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ OutgoingAddressForwardings }) => OutgoingAddressForwardings);
    });
};

export const queryIncomingForwardings = ({ AddressID, Page, PageSize }: QueryProps) => ({
    method: 'get',
    url: 'mail/v4/forwardings/incoming',
    params: { Page, PageSize, AddressID },
});

export const queryIncomingForwarding = (id: string) => ({
    method: 'get',
    url: `mail/v4/forwardings/incoming/${id}`,
});

export const queryAllIncomingForwardings = (api: Api) => {
    return queryPages((Page, PageSize) => {
        return api<{ IncomingAddressForwardings: IncomingAddressForwarding[]; Total: number }>(
            queryIncomingForwardings({
                Page,
                PageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ IncomingAddressForwardings }) => IncomingAddressForwardings);
    });
};

export interface SetupForwardingParameters {
    Type: ForwardingType;
    ForwarderAddressID: string;
    ForwardeeEmail: string;
    ForwardeePrivateKey?: string; // Only for internal E2EE forwarding
    ActivationToken?: string; // Only for internal E2EE forwarding
    ProxyInstances?: ProxyInstance[]; // Only for E2EE forwarding
    Tree: SieveBranch[] | null;
    Version: SIEVE_VERSION;
}

export const setupForwarding = ({
    Type,
    ForwarderAddressID,
    ForwardeeEmail,
    ForwardeePrivateKey,
    ActivationToken,
    ProxyInstances,
    Tree,
    Version,
}: SetupForwardingParameters) => ({
    method: 'post',
    url: 'mail/v4/forwardings',
    data: {
        Type,
        ForwarderAddressID,
        ForwardeeEmail,
        ForwardeePrivateKey,
        ActivationToken,
        ProxyInstances,
        Tree,
        Version,
    },
});

interface UpdateForwardingParameters {
    ID: string;
    ForwardeePrivateKey: string;
    ActivationToken: string;
    ProxyInstances: ProxyInstance[];
}

export const updateForwarding = ({
    ID,
    ForwardeePrivateKey,
    ActivationToken,
    ProxyInstances,
}: UpdateForwardingParameters) => ({
    method: 'put',
    url: `mail/v4/forwardings/${ID}`,
    data: {
        ForwardeePrivateKey,
        ActivationToken,
        ProxyInstances,
    },
});

export const deleteForwarding = (ID: string) => ({
    method: 'delete',
    url: `mail/v4/forwardings/${ID}`,
});

export const rejectForwarding = (ID: string) => ({
    method: 'delete',
    url: `mail/v4/forwardings/${ID}`,
});

export const acceptExternalForwarding = (jwt: string) => ({
    method: 'put',
    url: `mail/v4/forwardings/external/${jwt}`,
});

export const rejectExternalForwarding = (jwt: string) => ({
    method: 'delete',
    url: `mail/v4/forwardings/external/${jwt}`,
});

export interface ExternalForwardingResult {
    Code: number;
    Type: ForwardingType;
    State: ForwardingState;
    ForwarderEmail: string;
    ForwardeeEmail: string;
}

export const getExternalForwarding = (jwt: string) => ({
    method: 'get',
    url: `mail/v4/forwardings/external/${jwt}`,
});

export const pauseForwarding = (ID: string) => ({
    method: 'put',
    url: `mail/v4/forwardings/${ID}/pause`,
});

export const resumeForwarding = (ID: string) => ({
    method: 'put',
    url: `mail/v4/forwardings/${ID}/resume`,
});

export const resendForwardingInvitation = (ID: string) => ({
    method: 'put',
    url: `mail/v4/forwardings/${ID}/reinvite`,
});

export const updateForwardingFilter = (ID: string, Tree: SieveBranch[] | null, Version: SIEVE_VERSION) => ({
    method: 'put',
    url: `mail/v4/forwardings/${ID}/filter`,
    data: { Tree, Version },
});
