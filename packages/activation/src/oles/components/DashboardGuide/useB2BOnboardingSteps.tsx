import type React from 'react';
import type { FC } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { getIsDomainActive, isOrganizationB2B } from '@proton/shared/lib/organization/helper';

export type Step = {
    id: string;
    text: string;
    action?: FC<{ className: string }>;
    completed?: boolean;
    visible?: boolean;
};

const useB2BOnboardingSteps = (): [Step[], boolean] => {
    const [organization, organizationLoading] = useOrganization();
    const [userSettings, userSettingsLoading] = useUserSettings();
    const [customDomains, customDomainsLoading] = useCustomDomains();

    const allSteps: Step[] = [
        {
            id: 'billing',
            text: c('BOSS').t`Set up billing information`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/dashboard#payment-methods">{c('BOSS')
                    .t`Change`}</ButtonLike>
            ),
            completed: true,
        },
        {
            id: '2fa',
            text: c('BOSS').t`Set up two-factor authentication`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/account-password#two-fa">{c('BOSS')
                    .t`Set up`}</ButtonLike>
            ),
            completed: Boolean(userSettings['2FA'].Enabled),
        },
        {
            id: 'add-domain',
            text: c('BOSS').t`Add a custom domain`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/domain-names">{c('BOSS')
                    .t`Configure`}</ButtonLike>
            ),
            completed: Boolean(customDomains?.length),
            visible: !Boolean(customDomains?.length),
        },
        {
            id: 'verify',
            text: c('BOSS').t`Verify your domain ownership`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/domain-names">{c('BOSS')
                    .t`Configure`}</ButtonLike>
            ),
            completed: Boolean(customDomains?.find(getIsDomainActive)),
            visible: Boolean(customDomains?.length),
        },
        {
            id: 'migrate',
            text: c('BOSS').t`Migrate from Google Workspace`,
            action: (props) => (
                <ButtonLike {...props} size="small" as={SettingsLink} path="/migration-assistant">{c('BOSS')
                    .t`Start migration`}</ButtonLike>
            ),
            visible: true,
        },
    ];

    const hasIncompleteSteps = (() => {
        for (const step of allSteps) {
            if (step.visible !== false && !step.completed) {
                return true;
            }
        }

        return false;
    })();

    const steps =
        !isOrganizationB2B(organization) || !hasIncompleteSteps ? [] : allSteps.filter((s) => s.visible !== false);

    const loading = userSettingsLoading || customDomainsLoading || organizationLoading;

    return [steps, loading];
};

export default useB2BOnboardingSteps;
