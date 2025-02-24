import type { OnLoginCallbackArguments } from '@proton/components/containers/app/interface';
import { getOrganization as getOrganizationConfig } from '@proton/shared/lib/api/organization';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api, Organization } from '@proton/shared/lib/interfaces';

export const getOrganization = async ({ session, api }: { session: OnLoginCallbackArguments; api: Api }) => {
    if (!session.User.Subscribed) {
        return undefined;
    }
    return api<{
        Organization: Organization;
    }>(withUIDHeaders(session.UID, getOrganizationConfig())).then(({ Organization }) => Organization);
};
