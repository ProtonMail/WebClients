import type { FC, MouseEventHandler, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Badge } from '@proton/components/components/badge/Badge';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { IconName } from '@proton/icons/types';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { AccountPath } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { OrganizationAliasCreateMode, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

type MenuAction = {
    icon: IconName;
    key: string;
    label: string;
    subMenu?: ReactNode;
    signaled?: boolean;
    onClick?: MouseEventHandler;
};

type Props = {
    onLogout: (options: { soft: boolean }) => void;
};

export const MenuActions: FC<Props> = ({ onLogout }) => {
    const { openSettings } = usePassCore();
    const { createNotification, clearNotifications } = useNotifications();
    const enhance = useNotificationEnhancer();
    const org = useOrganization();
    const orgEnabled = org?.settings.enabled ?? false;
    const orgAliasCreationDisabled = org?.settings.AliasCreateMode === OrganizationAliasCreateMode.NOBODY;

    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);
    const accessTokensEnabled = useFeatureFlag(PassFeature.PassAccessTokens);
    const accessTokensSpotlight = useSpotlightFor(SpotlightMessage.ACCESS_TOKENS_DISCOVERY);

    const plan = useSelector(selectPassPlan);
    const accessTokensSignaled = accessTokensEnabled && accessTokensSpotlight.open && isPaidPlan(plan);

    const handleLogout = useCallback(async () => {
        createNotification(enhance({ text: c('Info').t`Logging you out...`, type: 'info', loading: true }));
        onLogout({ soft: false });
        clearNotifications();
    }, []);

    const settings = useMemo<MenuAction[]>(
        () => [
            { key: 'general', label: c('Label').t`General`, icon: 'cog-wheel' },
            ...(!orgAliasCreationDisabled
                ? [{ key: 'aliases', label: c('Label').t`Aliases`, icon: 'alias' as const }]
                : []),
            { key: 'security', label: c('Label').t`Security`, icon: 'locks' },
            ...(accessTokensEnabled
                ? [
                      {
                          key: 'access-tokens',
                          label: c('Label').t`Access tokens`,
                          icon: 'key' as const,
                          signaled: accessTokensSignaled,
                          onClick: () => {
                              if (accessTokensSpotlight.open) accessTokensSpotlight.close();
                              openSettings('access-tokens');
                          },
                      },
                  ]
                : []),
            { key: 'import', label: c('Label').t`Import`, icon: 'arrow-down-line' },
            { key: 'export', label: c('Label').t`Export`, icon: 'arrow-up-line' },
            { key: 'account', label: c('Label').t`Account`, icon: 'arrow-within-square', onClick: navigateToAccount },
            ...(orgEnabled
                ? [
                      {
                          key: 'organization',
                          label: c('Label').t`Organization`,
                          icon: 'buildings',
                          onClick: navigateToOrganization,
                      } as const,
                  ]
                : []),
            { key: 'support', label: c('Label').t`Support`, icon: 'speech-bubble' },
            { key: 'logout', label: c('Action').t`Sign out`, icon: 'arrow-out-from-rectangle', onClick: handleLogout },
        ],
        [orgEnabled, orgAliasCreationDisabled, accessTokensEnabled, accessTokensSpotlight.open]
    );

    return (
        <>
            <QuickActionsDropdown
                icon="cog-wheel"
                size="small"
                shape="ghost"
                className="shrink-0"
                signaled={accessTokensSignaled}
            >
                {settings.map((setting) => (
                    <DropdownMenuButton
                        key={setting.key}
                        className="relative"
                        ellipsis={false}
                        icon={setting.icon}
                        onClick={setting.onClick ?? (() => openSettings(setting.key))}
                        label={
                            <div className="flex items-center gap-3">
                                <span className="flex-1 flex-nowrap">{setting.label}</span>
                                {setting.signaled && (
                                    <Badge type="info" className="m-0 text-sm">{c('Info').t`New`}</Badge>
                                )}
                            </div>
                        }
                    />
                ))}
            </QuickActionsDropdown>
        </>
    );
};
