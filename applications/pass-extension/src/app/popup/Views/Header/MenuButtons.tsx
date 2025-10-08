import { forwardRef, memo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getVaultOptionInfo } from '@proton/pass/components/Menu/Vault/utils';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { VaultIcon, type VaultIconName } from '@proton/pass/components/Vault/VaultIcon';
import { selectShare } from '@proton/pass/store/selectors';
import type { Maybe, ShareType } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1.static';

type Props = { toggle: () => void; isOpen: boolean };

export const AppMenuButton = memo(
    forwardRef<HTMLButtonElement, Props>(({ toggle, isOpen }, ref) => {
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
                    <VaultIcon className="shrink-0" size={4} icon="hamburger" />
                </Button>
            </div>
        );
    })
);

AppMenuButton.displayName = 'AppMenuButtonMemo';

export const VaultMenuButton = memo(
    forwardRef<HTMLButtonElement, Props>(({ toggle, isOpen }, ref) => {
        const scope = useItemScope();
        const trash = scope === 'trash';

        const { filters } = useNavigationFilters();
        const { selectedShareId } = filters;

        const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));

        const icon: Maybe<VaultIconName> = (() => {
            switch (scope) {
                case 'trash':
                case 'shared-with-me':
                case 'shared-by-me':
                case 'secure-links':
                    return getVaultOptionInfo(scope).icon;
                case 'share':
                    return vault?.content.display.icon;
            }
        })();

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
                        color={trash ? VaultColor.COLOR_UNSPECIFIED : vault?.content.display.color}
                        icon={icon}
                    />
                </Button>
            </div>
        );
    })
);

VaultMenuButton.displayName = 'VaultMenuButtonMemo';
