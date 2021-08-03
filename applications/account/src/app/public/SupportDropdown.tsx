import { useState } from 'react';
import * as React from 'react';
import { generateUID, Dropdown, usePopperAnchor, DropdownMenu } from '@proton/components';
import { c } from 'ttag';

import SupportDropdownButton from './SupportDropdownButton';

interface Props {
    children?: React.ReactNode;
    content?: React.ReactNode;
}

const SupportDropdown = ({ content = c('Action').t`Need help?`, children }: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <SupportDropdownButton
                className="mlauto mrauto link"
                aria-describedby={uid}
                buttonRef={anchorRef}
                isOpen={isOpen}
                noCaret
                onClick={toggle}
            >
                {content}
            </SupportDropdownButton>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

export default SupportDropdown;
