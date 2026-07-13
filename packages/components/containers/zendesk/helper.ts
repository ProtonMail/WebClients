import type { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { isFree } from '@proton/shared/lib/user/helpers';

export interface ZendeskRef {
    run: (data: object) => void;
    open: () => void;
}

const vpnZendeskKey = '52184d31-aa98-430f-a86c-b5a93235027a';
const accountZendeskKey = 'c08ab87d-68c3-4d7d-a419-a0a1ef34759d';

export const getZendeskIframeUrl = (appName: APP_NAMES) => {
    const apiKey = appName === APPS.PROTONVPN_SETTINGS ? vpnZendeskKey : accountZendeskKey;

    const url = getApiSubdomainUrl('/core/v4/resources/zendesk', window.location.origin);
    url.searchParams.set('Key', apiKey);
    url.searchParams.set('Version', '2');
    return url;
};

// Zendesk does some special checks against plan name and `free` is taken. So we have to pass a custom value.
type ZendeskTags = PLANS | 'free_user';
export const getZendeskTags = (user: UserModel, organization: OrganizationExtended | undefined) => {
    const planNames: ZendeskTags[] = [];
    if (isFree(user)) {
        planNames.push('free_user');
    } else if (organization?.PlanName) {
        planNames.push(organization.PlanName);
    }
    return planNames;
};
