import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import type { SignupInviteParameters } from '../../../../signup/interfaces';

export type SpacesInvite = Extract<SignupInviteParameters, { type: 'spaces' }>;

export const getSpacesJoinUrl = (orgJoinLink: string, localID: number) => {
    try {
        const joinUrl = new URL(orgJoinLink);
        if (joinUrl.protocol !== 'https:' || !joinUrl.pathname.startsWith('/j/')) {
            return undefined;
        }
        const url = new URL(getAppHref(joinUrl.pathname, APPS.PROTONSPACES, localID));
        url.search = joinUrl.search;
        url.hash = joinUrl.hash;
        return url.toString();
    } catch {
        return undefined;
    }
};

export const getSpacesRedirectUrl = (orgJoinLink: string | null | undefined, localID: number) =>
    (orgJoinLink ? getSpacesJoinUrl(orgJoinLink, localID) : undefined) ?? getAppHref('/', APPS.PROTONSPACES, localID);

const getDefinedParams = (values: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });
    return params;
};

export const getSpacesSignInUrl = ({
    loginUrl,
    invitee,
    preVerifiedAddressToken,
    orgJoinLink,
}: {
    loginUrl: string;
    invitee?: string;
    preVerifiedAddressToken?: string;
    orgJoinLink?: string | null;
}) => {
    const searchParams = getDefinedParams({ prompt: 'login', username: invitee, preVerifiedAddressToken });
    const hashParams = getDefinedParams({ orgJoinLink });
    return `${loginUrl}?${searchParams}${hashParams.size ? `#${hashParams}` : ''}`;
};

export const getSpacesInviteFromSearchParams = (
    searchParams: URLSearchParams,
    hashParams: URLSearchParams = new URLSearchParams()
): SpacesInvite | undefined => {
    const invitee = searchParams.get('invitee');
    const orgJoinLink = hashParams.get('orgJoinLink');
    const preVerifiedAddressToken = searchParams.get('preVerifiedAddressToken');

    if (!invitee || !orgJoinLink || !preVerifiedAddressToken) {
        return undefined;
    }

    return {
        type: 'spaces',
        data: { invitee, orgJoinLink, preVerifiedAddressToken },
    };
};
