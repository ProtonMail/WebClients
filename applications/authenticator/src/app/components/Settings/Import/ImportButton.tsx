import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';

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
