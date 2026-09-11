import { GSUITE_MARKETPLACE_URL, MICROSOFT_BUSINESS_CONSENT_PATH } from '@proton/shared/lib/api/activation';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import microsoftLogo from '@proton/styles/assets/img/import/providers/microsoft.svg';

import { ApiImportProvider } from '../api/api.interface';
import { ImportProvider, OAUTH_PROVIDER } from '../interface';

type OlesProviderBase = {
    /**
     * Slug used in the migration-assistant `?provider=` URL, intentionally decoupled from the
     * internal `ImportProvider` enum value so the URL matches the brand the user sees
     * ("microsoft") rather than the API/OAuth provider identity ("outlook").
     */
    routeSlug: string;
    /** Knowledge base slug for this provider's Easy Switch for Business article */
    knowledgeBaseSlug: string;
    /** Name of the other provider, e.g. "Google" */
    brandName: string;
    /** Name of the suite being migrated away from, e.g. "Google Workspace" */
    displayName: string;
    /** Name of the mail product being retired, e.g. "Gmail" */
    mailAppName: string;
    /** Name of the provider's admin interface, e.g. "Google Workspace Admin Console" */
    adminConsoleName: string;
    iconSrc: string;
    /** SPF include token the provider requires for dual delivery during the migration */
    spfInclude: string;
    installApp: InstallApp;
};

/**
 * How the admin grants us access to their organization. Either they install an app
 * from a store, or they grant consent to ours directly through the provider.
 */
type InstallApp =
    | {
          type: 'link';
          defaultUrl: string;
          /** Name of the store the migration app is installed from, e.g. "Google Workspace Marketplace" */
          storeName: string;
      }
    | {
          type: 'consent';
          baseUrl: string;
      };

type ProviderIdentities = {
    [ImportProvider.GOOGLE]: {
        apiProvider: ApiImportProvider.GOOGLE;
        oauthProvider: OAUTH_PROVIDER.GSUITE;
    };
    [ImportProvider.OUTLOOK]: {
        apiProvider: ApiImportProvider.OUTLOOK;
        oauthProvider: OAUTH_PROVIDER.MICROSOFT_BUSINESS;
    };
};

export type SupportedProvider = keyof ProviderIdentities;

type OlesProviderFor<Id extends SupportedProvider> = OlesProviderBase & { id: Id } & ProviderIdentities[Id];

export type OlesProvider = { [Id in SupportedProvider]: OlesProviderFor<Id> }[SupportedProvider];

export const OLES_PROVIDERS: { [Id in SupportedProvider]: OlesProviderFor<Id> } = {
    [ImportProvider.GOOGLE]: {
        id: ImportProvider.GOOGLE,
        apiProvider: ApiImportProvider.GOOGLE,
        oauthProvider: OAUTH_PROVIDER.GSUITE,
        routeSlug: 'google',
        knowledgeBaseSlug: '/easy-switch-for-business',
        brandName: 'Google',
        displayName: 'Google Workspace',
        mailAppName: 'Gmail',
        adminConsoleName: 'Google Workspace Admin Console',
        iconSrc: googleLogo,
        spfInclude: '_spf.google.com',
        installApp: {
            type: 'link',
            defaultUrl: GSUITE_MARKETPLACE_URL,
            storeName: 'Google Workspace Marketplace',
        },
    },
    [ImportProvider.OUTLOOK]: {
        id: ImportProvider.OUTLOOK,
        apiProvider: ApiImportProvider.OUTLOOK,
        oauthProvider: OAUTH_PROVIDER.MICROSOFT_BUSINESS,
        routeSlug: 'microsoft',
        knowledgeBaseSlug: '/easy-switch-for-business-microsoft',
        brandName: 'Microsoft',
        displayName: 'Microsoft',
        mailAppName: 'Outlook',
        adminConsoleName: 'Microsoft 365 Admin Center',
        iconSrc: microsoftLogo,
        spfInclude: 'spf.protection.outlook.com',
        installApp: {
            type: 'consent',
            baseUrl: MICROSOFT_BUSINESS_CONSENT_PATH,
        },
    },
};

export const isProviderSupported = (provider: string | ImportProvider): provider is SupportedProvider =>
    Object.hasOwn(OLES_PROVIDERS, provider);

/** Slug to put in the ?provider= URL param. */
export const getProviderRouteSlug = (provider: SupportedProvider): string => OLES_PROVIDERS[provider].routeSlug;

/** Resolve a ?provider= URL slug back to its OLES provider, or undefined if unknown. */
export const getProviderFromRouteSlug = (slug: string): SupportedProvider | undefined =>
    (Object.keys(OLES_PROVIDERS) as SupportedProvider[]).find(
        (provider) => OLES_PROVIDERS[provider].routeSlug === slug
    );
