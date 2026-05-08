import { appendUrlSearchParams } from '@proton/shared/lib/helpers/url';
import { VPN_MOBILE_APP_LINKS } from '@proton/shared/lib/vpn/constants';

export const defaultDownloadUrl = 'https://protonvpn.com/download';
export const iosMarketplaceUrl = appendUrlSearchParams(VPN_MOBILE_APP_LINKS.appStore, {
    pt: '106513916',
    ct: 'protonvpn.com-dashboard',
    mt: '8',
});

export const androidMarketplaceUrl = appendUrlSearchParams(VPN_MOBILE_APP_LINKS.playStore, {
    utm_campaign: 'ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard',
    utm_source: 'account.protonvpn.com',
    utm_medium: 'link',
    utm_content: 'dashboard',
    utm_term: 'android',
});
