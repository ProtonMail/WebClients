import { createContext } from 'react';

export type FeatureType = 'boolean' | 'integer' | 'float' | 'string' | 'enumeration' | 'mixed';

export interface Feature<V = any> {
    Code: string;
    Type: FeatureType;
    DefaultValue: V;
    Value: V;
    Minimum: number;
    Maximum: number;
    Global: boolean;
    Writable: boolean;
    ExpirationTime: number;
    UpdateTime: number;
}

export enum FeatureCode {
    EarlyAccess = 'EarlyAccess',
    WelcomeImportModalShown = 'WelcomeImportModalShown',
    BlackFridayPromoShown = 'BlackFridayPromoShown',
    BundlePromoShown = 'BundlePromoShown',
    UsedMailMobileApp = 'UsedMailMobileApp',
    UsedContactsImport = 'UsedContactsImport',
    CanUserSendFeedback = 'CanUserSendFeedback',
    EnabledEncryptedSearch = 'EnabledEncryptedSearch',
    EnabledProtonProtonInvites = 'EnabledProtonProtonInvites',
}

export interface FeaturesContextValue {
    features: { [code: string]: Feature | undefined };
    loading: { [code: string]: boolean | undefined };
    get: <V = any>(code: FeatureCode) => Promise<Feature<V>>;
    put: <V = any>(code: FeatureCode, value: V) => Promise<Feature<V>>;
}

export default createContext<FeaturesContextValue>({} as FeaturesContextValue);
