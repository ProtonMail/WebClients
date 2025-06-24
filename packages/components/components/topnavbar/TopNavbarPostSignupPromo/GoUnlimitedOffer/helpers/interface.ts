import type { IconName, IconSize } from 'packages/icons';

import type { ButtonLikeShape } from '@proton/atoms';
import type { Feature } from '@proton/components/containers/offers/interface';
import type { Currency } from '@proton/payments';

export const POST_SIGNUP_GO_UNLIMITED_ACCOUNT_AGE = 7;
export const POST_SIGNUP_GO_UNLIMITED_DURATION = 30;
export const HIDE_OFFER = -1;

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';

export interface UnlimitedOfferConfig {
    type: MessageType;
    title: string;
    features: Feature[];
    currency: Currency;
    price: number;
    topButton?: {
        shape?: ButtonLikeShape;
        gradient?: boolean;
        iconGradient?: boolean;
        iconSize?: IconSize;
        icon?: IconName;
        title: string;
        variant?: string;
    };
    loading: boolean;
}

export interface TipProps {
    type: MessageType;
    cta: string;
    spotlightTitle: string;
    features: Feature[];
}

export enum MessageType {
    Generic = 'generic',
    InboxThreatProtection = 'inbox-threat-protection',
    InboxUnlimitedAliases = 'inbox-unlimited-aliases',
    Drive = 'drive',
    VPNBrowseSecurely = 'vpn-browse-securely',
    VPNUnblockStreaming = 'vpn-unblock-streaming',
    Pass = 'pass',
}
