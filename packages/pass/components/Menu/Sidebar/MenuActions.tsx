import type { FC, MouseEventHandler, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Badge } from '@proton/components/components/badge/Badge';
import type { IconComponent } from '@proton/icons/component';
import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { IcBuildings } from '@proton/icons/icons/IcBuildings';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcLocks } from '@proton/icons/icons/IcLocks';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';

import { AccountPath } from '../../../constants';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { useNavigateToAccount } from '../../../hooks/useNavigateToAccount';
import { useNotificationEnhancer } from '../../../hooks/useNotificationEnhancer';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import { selectPassPlan } from '../../../store/selectors';
import { OrganizationAliasCreateMode, SpotlightMessage } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { usePassCore } from '../../Core/PassCoreProvider';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../../Layout/Dropdown/QuickActionsDropdown';
import { useOrganization } from '../../Organization/OrganizationProvider';
import { useSpotlightFor } from '../../Spotlight/WithSpotlight';

type MenuAction = {
    icon: IconComponent;
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

    const navigateToAccount = useNavigateToAccount(AccountPath.DASHBOARD);
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
            { key: 'general', label: c('Label').t`General`, icon: IcCogWheel },
            ...(!orgAliasCreationDisabled ? [{ key: 'aliases', label: c('Label').t`Aliases`, icon: IcAlias }] : []),
            { key: 'security', label: c('Label').t`Security`, icon: IcLocks },
            ...(accessTokensEnabled
                ? [
                      {
                          key: 'access-tokens',
                          label: c('Label').t`Access tokens`,
                          icon: IcKey,
                          signaled: accessTokensSignaled,
                          onClick: () => {
                              if (accessTokensSpotlight.open) accessTokensSpotlight.close();
                              openSettings('access-tokens');
                          },
                      },
                  ]
                : []),
            { key: 'import', label: c('Label').t`Import`, icon: IcArrowDownLine },
            { key: 'export', label: c('Label').t`Export`, icon: IcArrowUpLine },
            { key: 'account', label: c('Label').t`Account`, icon: IcArrowWithinSquare, onClick: navigateToAccount },
            ...(orgEnabled
                ? [
                      {
                          key: 'organization',
                          label: c('Label').t`Organization`,
                          icon: IcBuildings,
                          onClick: navigateToOrganization,
                      } as const,
                  ]
                : []),
            { key: 'support', label: c('Label').t`Support`, icon: IcSpeechBubble },
            { key: 'logout', label: c('Action').t`Sign out`, icon: IcArrowOutFromRectangle, onClick: handleLogout },
        ],
        [orgEnabled, orgAliasCreationDisabled, accessTokensEnabled, accessTokensSpotlight.open]
    );

    return (
        <>
            <QuickActionsDropdown
                icon={IcCogWheel}
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
