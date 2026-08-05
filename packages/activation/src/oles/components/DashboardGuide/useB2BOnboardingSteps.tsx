import type React from 'react';
import type { FC } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { ApiImporterOrganizationState } from '@proton/activation/src/api/api.interface';
import { EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

import { useImporterOrganizations } from '../../useImporterOrganizations';
import { useProviderTokens } from '../../useProviderTokens';

export type Step = {
    text: string;
    description?: string;
    action?: FC<{ className: string }>;
    state: 'not-completed' | 'partial' | 'completed';
};

export type StepName =
    | 'billing'
    | '2fa'
    | 'add-domain'
    | 'verify-domain'
    | 'authenticate-provider'
    | 'install-migration-assistant'
    | 'configure-migration'
    | 'migrate'
    | 'finalize-migration';

const useB2BOnboardingSteps = (): [Record<StepName, Step> | undefined, boolean] => {
    const [organization] = useOrganization();
    const [userSettings] = useUserSettings();
    const [customDomains] = useCustomDomains();
    const [importerOrgs] = useImporterOrganizations();
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE, [EASY_SWITCH_FEATURES.OLES]);

    const loading = !organization || !userSettings || !customDomains || !importerOrgs || !tokens;

    const steps: Record<StepName, Step> = {
        billing: {
            text: c('Onboarding step').t`Set up billing information`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/dashboard#payment-methods">{c('Action')
                    .t`Change`}</ButtonLike>
            ),
            state: 'completed',
        },
        '2fa': {
            text: c('Onboarding step').t`Set up two-factor authentication`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/account-password#two-fa">{c('Action')
                    .t`Set up`}</ButtonLike>
            ),
            state: Boolean(userSettings['2FA'].Enabled) ? 'completed' : 'not-completed',
        },
        'add-domain': {
            text: c('Onboarding step').t`Add a domain`,
            description: c('Description').t`Required to create user accounts`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/domain-names">{c('Action')
                    .t`Configure`}</ButtonLike>
            ),
            state: Boolean(customDomains?.length) ? 'completed' : 'not-completed',
        },
        'verify-domain': {
            text: c('Onboarding step').t`Verify domain ownership`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/domain-names">{c('Action')
                    .t`Configure`}</ButtonLike>
            ),
            state: Boolean(customDomains?.find(getIsDomainActive)) ? 'completed' : 'not-completed',
        },
        'authenticate-provider': {
            text: c('Onboarding step').t`Authenticate to Google Workspace`,
            state: Boolean(tokens?.length) ? 'completed' : 'not-completed',
        },
        'install-migration-assistant': {
            text: c('Onboarding step').t`Install Migration assistant`,
            state: Boolean(importerOrgs?.length) ? 'completed' : 'not-completed',
        },
        'configure-migration': {
            text: c('Onboarding step').t`Configure migration`,
            state: Boolean(importerOrgs?.length) ? 'completed' : 'not-completed',
        },
        migrate: {
            text: c('Onboarding step').t`Migrate users to ${BRAND_NAME}`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/migration-assistant">
                    {c('Action').t`Start migration`}
                </ButtonLike>
            ),
            state: Boolean(importerOrgs?.length && (organization?.UsedMembers ?? 0) > 1)
                ? 'completed'
                : 'not-completed',
        },
        'finalize-migration': {
            text: c('Onboarding step').t`Finalize your migration`,
            state: (() => {
                if (Boolean(importerOrgs?.some((o) => o.State === ApiImporterOrganizationState.COMPLETED))) {
                    return 'partial';
                }
                if (Boolean(importerOrgs?.some((o) => o.State === ApiImporterOrganizationState.FINALIZED))) {
                    return 'completed';
                }
                return 'not-completed';
            })(),
        },
    };

    return [steps, loading];
};

export default useB2BOnboardingSteps;
