import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { verticalPopperPlacements } from '@proton/atoms/Popper/utils';
import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

import { useVaultCreationPolicy } from '../../hooks/organization/useVaultCreationPolicy';
import { selectShare } from '../../store/selectors/shares';
import type { ShareType } from '../../types/data/shares';
import { VaultColor } from '../../types/protobuf/vault-v1.static';
import { withTap } from '../../utils/fp/pipe';
import { SharedMenuContent } from '../Menu/Shared/SharedMenu';
import { VaultMenu } from '../Menu/Vault/VaultMenu';
import { getVaultOptionInfo } from '../Menu/Vault/utils';
import { useNavigationFilters } from '../Navigation/NavigationFilters';
import { useItemScope } from '../Navigation/NavigationMatches';
import { OrganizationPolicyTooltip } from '../Organization/OrganizationPolicyTooltip';
import { useVaultActions } from '../Vault/VaultActionsProvider';
import { VaultIcon } from '../Vault/VaultIcon';

import './HeaderVaultSelector.scss';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '26em',
    width: `22em`,
};

export const HeaderVaultSelector = memo(() => {
    const scope = useItemScope();
    const { filters } = useNavigationFilters();
    const { selectedShareId } = filters;

    const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));
    const vaultActions = useVaultActions();
    const { vaultCreationDisabled } = useVaultCreationPolicy();

    const vaultMenu = usePopperAnchor<HTMLButtonElement>();
    const withVaultMenuClose = withTap(vaultMenu.close);
    // Same threshold as the sidebar (`hidden lg:flex` → >medium). Unmount instead of
    // `lg:hidden` because flex layout in the header overrides `display: none`.
    const sidebarVisible = useActiveBreakpoint().viewportWidth['>=large'];

    const isActive = scope === 'share' && selectedShareId !== null;

    const vaultOption = useMemo(() => {
        switch (scope) {
            case 'trash':
                return getVaultOptionInfo('trash');
            case 'shared-with-me':
                return getVaultOptionInfo('shared-with-me');
            case 'shared-by-me':
                return getVaultOptionInfo('shared-by-me');
            case 'secure-links':
                return getVaultOptionInfo('secure-links');
            case 'share':
                return getVaultOptionInfo(vault ?? 'all');
            default:
                return getVaultOptionInfo('all');
        }
    }, [scope, vault]);

    const iconColor = scope === 'trash' ? VaultColor.COLOR_UNSPECIFIED : vaultOption.color;

    if (sidebarVisible) {
        return null;
    }

    return (
        <>
            <Button
                ref={vaultMenu.anchorRef}
                onClick={vaultMenu.toggle}
                pill
                shape={isActive ? undefined : 'solid'}
                size="small"
                color={isActive ? 'norm' : 'weak'}
                className="pass-header-vault-selector flex flex-nowrap gap-1.5 shrink-0 text-sm"
                title={c('Action').t`Switch vault`}
            >
                <VaultIcon
                    className="shrink-0"
                    size={4}
                    highlighted={isActive}
                    color={iconColor}
                    icon={vaultOption.icon}
                />
                <span className="text-ellipsis">{vaultOption.label}</span>
            </Button>

            <Dropdown
                anchorRef={vaultMenu.anchorRef}
                autoClose={false}
                isOpen={vaultMenu.isOpen}
                onClose={vaultMenu.close}
                availablePlacements={verticalPopperPlacements}
                size={DROPDOWN_SIZE}
                style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
                contentProps={{ className: 'flex flex-column flex-nowrap' }}
            >
                <div className="overflow-auto p-2 pb-0">
                    <div className="flex flex-column">
                        <VaultMenu onAction={vaultMenu.close} />
                        <SharedMenuContent onAction={vaultMenu.close} />
                    </div>
                </div>

                <div className="p-2 w-full shrink-0">
                    <OrganizationPolicyTooltip
                        enforced={vaultCreationDisabled}
                        text={c('Warning').t`Your organization does not allow creating a vault`}
                    >
                        <Button
                            className="w-full"
                            color="weak"
                            shape="solid"
                            onClick={withVaultMenuClose(vaultActions.create)}
                            disabled={vaultCreationDisabled}
                        >
                            {c('Action').t`Create vault`}
                        </Button>
                    </OrganizationPolicyTooltip>
                </div>
            </Dropdown>
        </>
    );
});

HeaderVaultSelector.displayName = 'HeaderVaultSelectorMemo';
