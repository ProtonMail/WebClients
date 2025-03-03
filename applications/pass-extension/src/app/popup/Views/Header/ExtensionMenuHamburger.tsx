import { forwardRef, memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';

type Props = { toggle: () => void; isOpen: boolean };

export const ExtensionMenuHamburger = memo(
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

ExtensionMenuHamburger.displayName = 'ExtensionMenuHamburgerMemo';
