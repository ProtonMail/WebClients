import { GSUITE_MARKETPLACE_URL } from '@proton/shared/lib/api/activation';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import { ApiImportProvider } from '../api/api.interface';
import { ImportProvider, OAUTH_PROVIDER } from '../interface';

type OlesProviderBase = {
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
    installApp: {
        defaultUrl: string;
        /** Key holding the URL override inside the OrganizationLevelEasySwitch feature flag payload */
        urlOverrideKey: string;
        /** Name of the store the migration app is installed from, e.g. "Google Workspace Marketplace" */
        storeName: string;
    };
};

type ProviderIdentities = {
    [ImportProvider.GOOGLE]: {
        apiProvider: ApiImportProvider.GOOGLE;
        oauthProvider: OAUTH_PROVIDER.GSUITE;
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
        brandName: 'Google',
        displayName: 'Google Workspace',
        mailAppName: 'Gmail',
        adminConsoleName: 'Google Workspace Admin Console',
        iconSrc: googleLogo,
        spfInclude: '_spf.google.com',
        installApp: {
            defaultUrl: GSUITE_MARKETPLACE_URL,
            urlOverrideKey: 'marketplaceUrl',
            storeName: 'Google Workspace Marketplace',
        },
    },
};

export const isProviderSupported = (provider: string | ImportProvider): provider is SupportedProvider =>
    Object.hasOwn(OLES_PROVIDERS, provider);
