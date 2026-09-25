import type { Api } from '@proton/shared/lib/interfaces';
import { getOrganizationExtended } from '@proton/shared/lib/organization/api';

import type { OnLoginCallbackArguments } from '../content/authSession';

export const getOrganization = async ({ session, api }: { session: OnLoginCallbackArguments; api: Api }) => {
    if (!session.data.User.Subscribed) {
        return undefined;
    }
    return getOrganizationExtended({ api });
};
