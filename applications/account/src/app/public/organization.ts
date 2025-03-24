import type { OnLoginCallbackArguments } from '@proton/components/containers/app/interface';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Api } from '@proton/shared/lib/interfaces';
import { getOrganizationWithSettings } from '@proton/shared/lib/organization/api';

export const getOrganization = async ({ session, api }: { session: OnLoginCallbackArguments; api: Api }) => {
    if (!session.data.User.Subscribed) {
        return undefined;
    }
    const uidApi = getUIDApi(session.data.UID, api);
    return getOrganizationWithSettings({ api: uidApi });
};
