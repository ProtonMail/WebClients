import { type VFC } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
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
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { useMenuItems } from '@proton/pass/hooks/useMenuItems';
import {
    selectHasRegisteredLock,
    selectPassPlan,
    selectPlanDisplayName,
    selectShare,
    selectUser,
} from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { withTap } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '30em',
    width: `22em`,
};

export const MenuDropdown: VFC = () => {
    const history = useHistory();
    const { lock, logout, ready, expanded } = usePopupContext();
    const { inTrash, unselectItem } = useNavigationContext();
    const { shareId, setSearch, setShareId } = useItemsFilteringContext();
    const vaultActions = useVaultActions();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);
    const canLock = useSelector(selectHasRegisteredLock);

    const openSettings = useOpenSettingsTab();
    const expandPopup = useExpandPopup();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const menu = useMenuItems({ onAction: close });
    const withClose = withTap(close);

    const onVaultSelect = (selected: string) => {
        unselectItem();
        setSearch('');

        switch (selected) {
            case 'all':
            case 'trash':
                setShareId(null);
                return history.push(`/${selected === 'trash' ? 'trash' : ''}`);
            default: {
                setShareId(selected);
                return history.push(`/share/${selected}`);
            }
        }
    };

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
                        className="flex-item-noshrink"
                        size={16}
                        color={inTrash ? VaultColor.COLOR_UNSPECIFIED : vault?.content.display.color}
                        icon={inTrash ? 'pass-trash' : vault?.content.display.icon}
                    />
                </Button>

                <Dropdown
                    anchorRef={anchorRef}
                    autoClose={false}
                    isOpen={isOpen}
                    onClose={close}
                    originalPlacement="bottom"
                    size={DROPDOWN_SIZE}
                >
                    <DropdownMenu>
                        <div className="flex flex-align-items-center flex-justify-space-between flex-nowrap gap-2 py-2 px-4">
                            <span
                                className={clsx(
                                    'flex flex-align-items-center flex-nowrap',
                                    passPlan === UserPassPlan.PLUS && 'ui-orange'
                                )}
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

                        {passPlan !== UserPassPlan.PLUS && (
                            <div className="pb-2 px-4">
                                <UpgradeButton className="w-full" />
                            </div>
                        )}

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <VaultMenu
                            dense
                            inTrash={inTrash}
                            onAction={close}
                            onSelect={onVaultSelect}
                            selectedShareId={shareId}
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
                                        <span className="flex flex-align-items-center flex-nowrap gap-2">
                                            <VaultIcon
                                                className="flex-item-noshrink"
                                                size={16}
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
                        />

                        {canLock && (
                            <DropdownMenuButton
                                onClick={withClose(lock)}
                                disabled={!ready}
                                label={c('Action').t`Lock extension`}
                                icon="lock"
                            />
                        )}

                        {!expanded && (
                            <DropdownMenuButton
                                onClick={expandPopup}
                                label={c('Action').t`Open in a window`}
                                icon="arrow-out-square"
                            />
                        )}

                        <Submenu icon="notepad-checklist" label={c('Action').t`Advanced`} items={menu.advanced} />
                        <hr className="dropdown-item-hr my-3 mx-4" aria-hidden="true" />
                        <Submenu icon="bug" label={c('Action').t`Feedback`} items={menu.feedback} />
                        <Submenu icon="mobile" label={c('Action').t`Get mobile apps`} items={menu.download} />

                        <DropdownMenuButton
                            onClick={() => logout({ soft: false })}
                            label={c('Action').t`Sign out`}
                            icon="arrow-out-from-rectangle"
                        />
                    </DropdownMenu>
                </Dropdown>
            </nav>
        </>
    );
};
