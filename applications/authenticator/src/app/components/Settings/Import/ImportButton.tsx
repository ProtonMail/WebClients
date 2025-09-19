import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Dropdown, usePopperAnchor } from '@proton/components';

import { ImportDropdown } from './ImportDropdown';

export const ImportButton: FC = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                pill
                shape="outline"
                color="weak"
                onClick={toggle}
                ref={anchorRef}
                title={c('authenticator-2025:Action').t`Import codes`}
            >
                {c('authenticator-2025:Action').t`Import codes`}
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <ImportDropdown />
            </Dropdown>
        </>
    );
};
