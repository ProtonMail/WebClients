import { forwardRef, memo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useNavigationMatches } from '@proton/pass/components/Navigation/NavigationMatches';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { selectShare } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';

type Props = { toggle: () => void; isOpen: boolean };

export const MenuHamburger = memo(
    forwardRef<HTMLButtonElement, Props>(({ toggle, isOpen }, ref) => {
        const { matchTrash } = useNavigationMatches();

        const { filters } = useNavigationFilters();
        const { selectedShareId } = filters;

        const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));

        return (
            <div className="relative">
                <Button
                    icon
                    shape="solid"
                    color="weak"
                    pill
                    ref={ref}
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
            </div>
        );
    })
);

MenuHamburger.displayName = 'MenuHamburgerMemo';
