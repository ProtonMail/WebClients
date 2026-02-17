import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

export interface ZendeskRef {
    run: (data: object) => void;
    open: () => void;
}

const vpnZendeskV1Key = 'c08ab87d-68c3-4d7d-a419-a0a1ef34759d';
const vpnZendeskV2Key = '52184d31-aa98-430f-a86c-b5a93235027a';

export const getZendeskIframeUrl = (isZendeskV2Enabled: boolean) => {
    const zendeskVersion = isZendeskV2Enabled ? '2' : '1';
    const apiKey = isZendeskV2Enabled ? vpnZendeskV2Key : vpnZendeskV1Key;

    const url = getApiSubdomainUrl('/core/v4/resources/zendesk', window.location.origin);
    url.searchParams.set('Key', apiKey);
    url.searchParams.set('Version', zendeskVersion);
    return url;
};
