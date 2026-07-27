import { forwardRef, memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcHamburger } from '@proton/icons/icons/IcHamburger';

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
                    <IcHamburger className="shrink-0" size={4} />
                </Button>
            </div>
        );
    })
);

AppMenuButton.displayName = 'AppMenuButtonMemo';
