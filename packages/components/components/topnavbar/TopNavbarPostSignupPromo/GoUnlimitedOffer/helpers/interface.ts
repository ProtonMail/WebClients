import type { TipProps, TopNavbarOfferConfig } from '../../common/interface';

export const POST_SIGNUP_GO_UNLIMITED_ACCOUNT_AGE = 7;
export const POST_SIGNUP_GO_UNLIMITED_DURATION = 30;
export const HIDE_OFFER = -1;

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';

export type UnlimitedOfferConfig = TopNavbarOfferConfig<UnlimitedMessageType>;
export type UnlimitedOfferTipProps = TipProps<UnlimitedMessageType>;

export enum UnlimitedMessageType {
    Generic = 'generic',
    InboxThreatProtection = 'inbox-threat-protection',
    InboxUnlimitedAliases = 'inbox-unlimited-aliases',
    Drive = 'drive',
    VPNBrowseSecurely = 'vpn-browse-securely',
    VPNUnblockStreaming = 'vpn-unblock-streaming',
    Pass = 'pass',
}
