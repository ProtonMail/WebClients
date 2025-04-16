import type { ReactNode } from 'react';

export type B2BFeaturesID =
    | 'custom-domain'
    | 'add-users'
    | 'easy-switch'
    | 'recovery'
    | '2fa'
    | 'user-groups'
    | 'security'
    | 'security-breaches'
    | 'get-the-apps'
    | 'imap-smtp'
    | 'email-forwarding'
    | 'calendar-sharing'
    | 'calendar-zoom'
    | 'share-files'
    | 'docs'
    | 'get-drive-app'
    | 'use-vpn'
    | 'password-management';

export interface B2BFeaturesSection {
    title: string;
    featuresList: B2BFeaturesID[];
}

export interface B2BOnboardingFeature {
    id: B2BFeaturesID;
    title: string;
    description: string;
    kb?: {
        title?: string;
        link?: string;
    };
    cta: ReactNode;
    illustration: string;
    canShowFeature: boolean;
}
