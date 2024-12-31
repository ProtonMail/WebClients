import { memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { withTap } from '@proton/pass/utils/fp/pipe';

type Props = { onAction: () => void };

export const MenuVaults = memo(({ onAction }: Props) => {
    const vaultActions = useVaultActions();
    const withAction = withTap(onAction);

    return (
        <VaultMenu
            dense
            onAction={onAction}
            onSelect={vaultActions.select}
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
                            <VaultIcon className="shrink-0" size={4} color={selected.color} icon={selected?.icon} />
                            <span className="block text-ellipsis">{selected.label}</span>
                        </span>
                    </CollapsibleHeader>
                    <CollapsibleContent as="ul" className="unstyled mx-2">
                        <hr className="my-2 mx-2" aria-hidden="true" />
                        {menu}
                        <div className="mt-2 mb-4 w-full">
                            <Button
                                className="w-full"
                                color="weak"
                                pill
                                shape="solid"
                                onClick={withAction(vaultActions.create)}
                            >
                                {c('Action').t`Create vault`}
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}
        />
    );
});

MenuVaults.displayName = 'MenuVaultsMemo';
