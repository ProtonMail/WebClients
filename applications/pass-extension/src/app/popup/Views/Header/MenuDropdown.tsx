import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { c } from 'ttag';

import { Button, NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';
import type { DropdownProps } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Dropdown,
    DropdownMenu,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { SecureLinkButton } from '@proton/pass/components/Menu/SecureLink/SecureLinkButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, getPassWebUrl } from '@proton/pass/components/Navigation/routing';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { AccountPath, UpsellRef } from '@proton/pass/constants';
import { type MenuItem, useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import browser from '@proton/pass/lib/globals/browser';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectLockEnabled,
    selectPassPlan,
    selectPlanDisplayName,
    selectShare,
    selectUser,
} from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { OnboardingMessage } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { withTap } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '30em',
    width: `24em`,
};

export const MenuDropdown: FC = () => {
    const { onLink, onboardingAcknowledge, onboardingCheck } = usePassCore();
    const { ready, expanded } = usePopupContext();
    const { lock, logout } = useExtensionClient();
    const { API_URL } = usePassConfig();
    const { navigate, filters, matchTrash } = useNavigation();
    const { selectedShareId } = filters;

    const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);
    const canLock = useSelector(selectLockEnabled);

    const [notifyMonitor, setNotifyMonitor] = useState(false);
    const notify = notifyMonitor;

    const vaultActions = useVaultActions();
    const openSettings = useOpenSettingsTab();
    const expandPopup = useExpandPopup();
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const withClose = withTap(close);

    useEffect(() => {
        (async () => onboardingCheck?.(OnboardingMessage.PASS_MONITOR))()
            .then((show) => setNotifyMonitor(Boolean(show)))
            .catch(noop);
    }, []);

    const menu = useMenuItems({
        onAction: close,
        extra: {
            advanced: !expanded
                ? [
                      {
                          icon: 'arrow-out-square',
                          label: c('Action').t`Open in a window`,
                          onClick: withClose(expandPopup),
                      },
                  ]
                : [],
            feedback: [
                {
                    icon: 'life-ring',
                    label: c('Action').t`How to use ${PASS_APP_NAME}`,
                    url: browser.runtime.getURL('/onboarding.html#/welcome'),
                },
            ],
        },
    });

    const accountMenuItems: MenuItem[] = [
        {
            onClick: navigateToAccount,
            label: c('Action').t`Account settings`,
            icon: 'arrow-out-square',
        },
        {
            onClick: () => logout({ soft: false }),
            label: c('Action').t`Sign out`,
            icon: 'arrow-out-from-rectangle',
        },
    ];

    return (
        <>
            <nav>
                <div className="relative">
                    <Button
                        icon
                        shape="solid"
                        color="weak"
                        pill
                        ref={anchorRef}
                        onClick={toggle}
                        size="small"
                        title={isOpen ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
                    >
                        <VaultIcon
                            className="shrink-0"
                            size={4}
                            color={matchTrash ? VaultColor.COLOR_UNSPECIFIED : vault?.content.display.color}
                            icon={matchTrash ? 'pass-trash' : vault?.content.display.icon}
                        />
                    </Button>
                    {notify && <NotificationDot className="absolute h-2 w-2 top-0 right-0" color={ThemeColor.Danger} />}
                </div>

                <Dropdown
                    anchorRef={anchorRef}
                    autoClose={false}
                    isOpen={isOpen}
                    onClose={close}
                    availablePlacements={verticalPopperPlacements}
                    size={DROPDOWN_SIZE}
                    style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
                >
                    <DropdownMenu>
                        <div className="flex items-center justify-space-between flex-nowrap gap-2 py-2 px-4">
                            <span
                                className={clsx('flex items-center flex-nowrap', isPaidPlan(passPlan) && 'ui-orange')}
                            >
                                <Icon name="star" className="mr-3" color="var(--interaction-norm)" />
                                <span className="text-left">
                                    <div className="text-sm text-ellipsis">{user?.Email}</div>
                                    <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                                        {planDisplayName}
                                    </div>
                                </span>
                            </span>
                        </div>

                        {!isPaidPlan(passPlan) && (
                            <div className="pb-2 px-4">
                                <UpgradeButton className="w-full" upsellRef={UpsellRef.MENU} />
                            </div>
                        )}

                        <hr className="dropdown-item-hr mb-2 mx-4" aria-hidden="true" />

                        <VaultMenu
                            dense
                            inTrash={matchTrash}
                            onAction={close}
                            onSelect={vaultActions.select}
                            selectedShareId={selectedShareId}
                            render={(selected, menu) => (
                                <Collapsible>
                                    <CollapsibleHeader
                                        className="pl-4 pr-2"
                                        suffix={
                                            <CollapsibleHeaderIconButton className="p-0" pill size="small">
                                                <Icon name="chevron-down" />
                                            </CollapsibleHeaderIconButton>
                                        }
                                    >
                                        <span className="flex items-center flex-nowrap gap-2">
                                            <VaultIcon
                                                className="shrink-0"
                                                size={4}
                                                color={selected.color}
                                                icon={selected?.icon}
                                            />
                                            <span className="block text-ellipsis">{selected.label}</span>
                                        </span>
                                    </CollapsibleHeader>
                                    <CollapsibleContent as="ul" className="unstyled mx-2">
                                        <hr className="dropdown-item-hr my-2 mx-2" aria-hidden="true" />
                                        {menu}
                                        <div className="mt-2 mb-4 w-full">
                                            <Button
                                                className="w-full"
                                                color="weak"
                                                pill
                                                shape="solid"
                                                onClick={withClose(vaultActions.create)}
                                            >
                                                {c('Action').t`Create vault`}
                                            </Button>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        />

                        <SecureLinkButton
                            className="pt-1.5 pb-1.5"
                            onClick={withClose(() => navigate(getLocalPath('secure-links')))}
                        />

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <DropdownMenuButton
                            onClick={withClose(() => {
                                void onboardingAcknowledge?.(OnboardingMessage.PASS_MONITOR);
                                onLink(getPassWebUrl(API_URL, 'monitor'));
                            })}
                            label={
                                <>
                                    {c('Label').t`${PASS_SHORT_APP_NAME} monitor`}
                                    {notifyMonitor && (
                                        <NotificationDot
                                            className="ml-2 h-2 w-2 self-center"
                                            color={ThemeColor.Danger}
                                        />
                                    )}
                                </>
                            }
                            icon={'pass-shield-warning'}
                            className="pt-1.5 pb-1.5"
                        />

                        <DropdownMenuButton
                            onClick={withClose(() => openSettings())}
                            label={c('Label').t`Settings`}
                            icon={'cog-wheel'}
                            className="pt-1.5 pb-1.5"
                        />

                        {canLock && (
                            <DropdownMenuButton
                                onClick={withClose(lock)}
                                disabled={!ready}
                                label={c('Action').t`Lock extension`}
                                icon="lock"
                                className="pt-1.5 pb-1.5"
                            />
                        )}

                        <DropdownMenuButton
                            onClick={withClose(() => onLink(getPassWebUrl(API_URL)))}
                            label={c('Action').t`Open web app`}
                            icon="arrow-out-square"
                            className="pt-1.5 pb-1.5"
                        />

                        <Submenu icon="notepad-checklist" label={c('Action').t`Advanced`} items={menu.advanced} />
                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />
                        <Submenu icon="bug" label={c('Action').t`Feedback & Help`} items={menu.feedback} />
                        <Submenu icon="mobile" label={c('Action').t`Get mobile apps`} items={menu.download} />
                        <Submenu icon="user" label={c('Action').t`Account`} items={accountMenuItems} />
                    </DropdownMenu>
                </Dropdown>
            </nav>
        </>
    );
};
