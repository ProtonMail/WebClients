import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { usePopupContext } from 'proton-pass-extension/lib/components/Context/PopupProvider';
import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
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
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { AccountPath, UpsellRef } from '@proton/pass/constants';
import { type MenuItem, useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import browser from '@proton/pass/lib/globals/browser';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectHasRegisteredLock,
    selectPassPlan,
    selectPlanDisplayName,
    selectShare,
    selectUser,
} from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { withTap } from '@proton/pass/utils/fp/pipe';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '30em',
    width: `22em`,
};

export const MenuDropdown: FC = () => {
    const { onLink } = usePassCore();
    const { lock, logout, ready, expanded } = usePopupContext();
    const { API_URL } = usePassConfig();
    const { filters, matchTrash } = useNavigation();
    const { selectedShareId } = filters;

    const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);
    const canLock = useSelector(selectHasRegisteredLock);

    const vaultActions = useVaultActions();
    const openSettings = useOpenSettingsTab();
    const expandPopup = useExpandPopup();
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const withClose = withTap(close);

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

    const passWebAppUrl = useMemo(() => {
        const appUrl = getAppUrlFromApiUrl(API_URL, APPS.PROTONPASS);
        appUrl.pathname = getLocalPath();
        return appUrl.toString();
    }, []);

    return (
        <>
            <nav>
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

                <Dropdown
                    anchorRef={anchorRef}
                    autoClose={false}
                    isOpen={isOpen}
                    onClose={close}
                    availablePlacements={verticalPopperPlacements}
                    size={DROPDOWN_SIZE}
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

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

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
                            onClick={withClose(() => onLink(passWebAppUrl))}
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
