import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { UpsellRef } from '@proton/pass/constants';
import { isVaultMemberLimitReached, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { type ShareItem } from '@proton/pass/store/reducers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { truthy } from '@proton/pass/utils/fp/predicates';
import clsx from '@proton/utils/clsx';

type Props = {
    count: number;
    dense?: boolean;
    label: string;
    selected: boolean;
    vault?: ShareItem<ShareType.Vault>;
    onDelete?: () => void;
    onEdit?: () => void;
    onInvite?: () => void;
    onLeave?: () => void;
    onManage?: () => void;
    onMove?: () => void;
    onSelect: () => void;
};

const handleClickEvent = (handler?: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler?.();
};

export const VaultItem: FC<Props> = ({
    count,
    dense,
    label,
    selected,
    vault,
    onDelete,
    onEdit,
    onInvite,
    onLeave,
    onManage,
    onMove,
    onSelect,
}) => {
    const withActions = onEdit || onDelete || onInvite || onManage || onLeave;
    const allowSharing = vault !== undefined;
    const shared = vault?.shared ?? false;
    const notification = (vault?.newUserInvitesReady ?? 0) > 0;
    const spotlight = useSpotlight();
    const plan = useSelector(selectPassPlan);

    return (
        <DropdownMenuButton
            onClick={() => onSelect()}
            label={<span className="block text-ellipsis">{label}</span>}
            parentClassName={clsx(
                'pass-vault-submenu-vault-item w-full',
                !withActions && 'pass-vault-submenu-vault-item--no-actions'
            )}
            className={clsx(selected && 'is-selected', !dense && 'py-3')}
            style={{ '--max-h-custom': '1.25rem' }}
            extra={
                <>
                    {shared && (
                        <ButtonLike
                            as="div"
                            icon
                            pill
                            size="small"
                            color="weak"
                            onClick={handleClickEvent(onManage)}
                            shape="ghost"
                            title={c('Action').t`See members`}
                            className="relative"
                        >
                            {notification && (
                                <Icon
                                    name="exclamation-circle-filled"
                                    size={3}
                                    className="absolute top-custom right-custom"
                                    style={{
                                        '--top-custom': '-1px',
                                        '--right-custom': '-1px',
                                        color: 'var(--signal-danger)',
                                    }}
                                />
                            )}
                            <Icon name="users" alt={c('Action').t`See members`} color="var(--text-weak)" />
                        </ButtonLike>
                    )}
                    <span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>
                </>
            }
            icon={
                <VaultIcon
                    className="shrink-0"
                    size={3.5}
                    color={vault?.content.display.color}
                    icon={vault?.content.display.icon}
                />
            }
            quickActions={
                withActions
                    ? [
                          <DropdownMenuButton
                              key="vault-edit"
                              disabled={!onEdit}
                              label={c('Action').t`Edit vault`}
                              icon="pen"
                              onClick={handleClickEvent(onEdit)}
                          />,

                          allowSharing && shared && (
                              <DropdownMenuButton
                                  key="vault-manage"
                                  className="flex items-center py-2 px-4"
                                  icon="users"
                                  label={
                                      vault.shareRoleId === ShareRole.ADMIN
                                          ? c('Action').t`Manage access`
                                          : c('Action').t`See members`
                                  }
                                  onClick={handleClickEvent(onManage)}
                              />
                          ),

                          allowSharing && !shared && (
                              <DropdownMenuButton
                                  key="vault-share"
                                  className="flex items-center py-2 px-4"
                                  disabled={!isWritableVault(vault)}
                                  icon="user-plus"
                                  label={c('Action').t`Share`}
                                  onClick={
                                      plan === UserPassPlan.FREE && isVaultMemberLimitReached(vault)
                                          ? () =>
                                                spotlight.setUpselling({
                                                    type: 'pass-plus',
                                                    upsellRef: UpsellRef.LIMIT_SHARING,
                                                })
                                          : handleClickEvent(onInvite)
                                  }
                              />
                          ),

                          <DropdownMenuButton
                              key="vault-move"
                              disabled={!onMove}
                              onClick={handleClickEvent(onMove)}
                              label={c('Action').t`Move all items`}
                              icon="folder-arrow-in"
                          />,

                          allowSharing && shared && !vault.owner ? (
                              <DropdownMenuButton
                                  key="vault-leave"
                                  className="flex items-center py-2 px-4"
                                  onClick={handleClickEvent(onLeave)}
                                  icon="cross-circle"
                                  label={c('Action').t`Leave vault`}
                                  danger
                              />
                          ) : (
                              <DropdownMenuButton
                                  key="vault-delete"
                                  disabled={!onDelete}
                                  onClick={handleClickEvent(onDelete)}
                                  label={c('Action').t`Delete vault`}
                                  icon="trash"
                                  danger
                              />
                          ),
                      ].filter(truthy)
                    : undefined
            }
        />
    );
};
